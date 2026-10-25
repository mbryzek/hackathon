#!/usr/bin/env node
// node scripts/ci-test.mjs vitest|playwright|none [runner arguments...]
//
// TEST HEALTH'S CONTRACT FOR AN npm REPOSITORY (design DES-18577 "Every repository with CI"). This
// file is a copy of devops templates/npm/ci-test.mjs; `ci/build.sh` diffs it against devops `main`,
// so it is edited THERE and copied here. docs/ci.md in devops says how a repository adopts it.
//
// It runs the repository's test runner, and the four lines of the contract are the whole of what it
// adds:
//
//   1. reports  every spec's JUnit report under `ci-test-reports/<runner>/`, which `ci/build.sh`
//               declares with `# ci-test-reports: ci-test-reports/*/*.xml`. A spec is a test FILE,
//               named as the runner's JUnit report names it: relative to vitest's root, or to
//               playwright's testDir. One `TEST-<spec>.xml` per spec, and `FIRST-<spec>.xml` beside
//               it for the first run of a spec that was rerun.
//   2. lists    the file CI_TEST_LISTS names (`version <n>`, then `quarantined <spec>`,
//               `slow <spec>` or `proof <spec>` per line) leaves out every quarantined and slow spec
//               and runs every proof spec; the `ci-lists:` line says which lists the build ran with,
//               and a full build prints `ci-lists: unknown <spec>` for a listed spec no test file is.
//   3. slow     with CI_SLOW_SPECS=1 only the slow specs run, a quarantined one excepted.
//   4. rerun    every spec that failed is run once more, alone with the other failures: one
//               `ci-flake: <spec>` for each that passed the second time, which does not fail the
//               build, one `ci-rerun: failed again: <spec>` for each that failed twice, which does,
//               and `ci-rerun: done` once the rerun has run.
//
// A PROOF SPEC IS PROVED ONCE THE BUILD IS GREEN, as platform proves one (project/CiTestLists.scala
// and CiTestListsPlugin's `ciProof`): run 5 times alone and 3 times beside every other spec the
// build ran, each run leaving `PROOF-<alone|load>-<run>-<spec>.xml` (the run as two digits) beside
// the build's own reports, which the ledger records under the event `proof`. Whether a run passed is
// read from that run's report of the spec alone, so another spec failing in a load run is not this
// spec's failure, and a run that ran none of its tests proved nothing. The first failed run ends the
// proof red with `ci-proof: FAILED`; a proof that ran in full prints `ci-proof: passed <n> spec(s),
// 5 alone and 3 beside each`. CI_PROOF_RUNS="<alone> <beside>" is for measuring this and is set by
// nothing. Not in the slow run, and not after a red build.
//
// UNSET CI_TEST_LISTS LEAVES NOTHING OUT. That is a developer's working tree, and it is how the
// session fixing a quarantined spec runs it.
//
// A LISTS FILE THAT IS NOT THE FORMAT IS THE BOX AND NOT THE BRANCH. Nothing on a branch writes it,
// and a line this does not understand is a spec it would run while the lists say it must not, so it
// exits 75 with nothing run. CI_SLOW_SPECS=1 with no lists is the same answer: there is no slow spec
// to run and a green would claim there was.
//
// PLAYWRIGHT IS HANDED A SELECTION WITH `--test-list`, ONE testDir-RELATIVE FILE PER LINE, AND ONLY
// @playwright/test 1.58.0 AND LATER SELECT A FILE BY THAT LINE: through 1.57 a line's titles must equal
// a test's titles exactly, so a line naming only a file matches no test, and the run runs nothing and
// exits 0. So every run by name — the lists leaving a spec out, the rerun, a proof — is refused on an
// older version, naming the minimum, before it runs; a build that runs every spec does not need it.
//
// A RED THAT IS NOT WHOLLY FAILING SPECS IS NOT RERUN — a runner that exited non-zero with every
// spec passing (an unhandled error, a config that will not load) or left no report stays red exactly
// as it was.
//
// `none` IS A REPOSITORY WHOSE TESTS ARE NOTHING YET: the lists are read and printed as for any
// runner, and it reports zero specs. Everything after the runner's name is handed to every
// invocation of it (a `-c <config>`, a `--project`); CI passes none.
//
// EXIT CODES: 0 green, the runner's own code (or 1) red, 2 a usage error, 75 nothing measured.
//
// NODE STDLIB ONLY, so it runs before anything is installed and adds nothing to package.json.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const INFRA_EXIT = 75;
export const REPORTS_ROOT = "ci-test-reports";
// How many times a proof runs a spec alone, and beside the rest of the build: platform's
// `CiTestLists.ProofRunsAlone` and `ProofRunsBeside`.
export const PROOF_RUNS_ALONE = 5;
export const PROOF_RUNS_BESIDE = 3;
const RUNNERS = ["vitest", "playwright", "none"];
// The first @playwright/test whose `--test-list` selects every test of a file from a line naming only
// the file (`loadTestList` matches a line's titles as a prefix of the test's from 1.58.0 on).
export const PLAYWRIGHT_TEST_LIST_MINIMUM = "1.58.0";

// A refusal: the build cannot measure what was asked of it on what this repository installs, and
// says why. It is the branch's (package.json is), so it is red, never 75.
class Refused extends Error {}

// ---- the lists ----

// The lists CI_TEST_LISTS' file holds, or a refusal naming the first line it does not understand.
export function parseLists(text) {
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  if (lines.length === 1 && lines[0].trim() === "") return { error: "the file is empty" };
  const version = /^(?:version )?(\d+)$/.exec(lines[0]);
  if (!version) return { error: `line 1: not a lists version: ${lines[0]}` };
  const lists = { version: version[1], quarantined: new Set(), slow: new Set(), proof: new Set() };
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue;
    const entry = /^(quarantined|slow|proof) (\S+)$/.exec(lines[i]);
    if (!entry) return { error: `line ${i + 1}: neither quarantined, slow nor proof: ${lines[i]}` };
    lists[entry[1]].add(entry[2]);
  }
  return { lists };
}

export function listsLine(lists) {
  return `ci-lists: version ${lists.version} quarantined ${lists.quarantined.size} slow ${lists.slow.size}`;
}

// Whether a build runs [spec]: platform's rule, word for word (project/CiTestLists.scala). A
// quarantined spec runs nowhere, so it stays out of the slow run too; a proof spec is one the build
// is about to prove, so its own build runs it.
export function runs(lists, slowOnly, spec) {
  if (!lists) return !slowOnly;
  if (slowOnly) return lists.slow.has(spec) && !lists.quarantined.has(spec);
  return lists.proof.has(spec) || !(lists.quarantined.has(spec) || lists.slow.has(spec));
}

// The listed specs no test file is, sorted.
export function unknownSpecs(lists, defined) {
  const known = new Set(defined);
  return [...new Set([...lists.quarantined, ...lists.slow, ...lists.proof])].filter((s) => !known.has(s)).sort();
}

// ---- JUnit ----

const unescapeXml = (s) =>
  s.replace(/&(lt|gt|quot|apos|amp);/g, (_, e) => ({ lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" })[e]);

// Every `<testsuite>` of a JUnit report: its name, whether it failed, and its own text.
export function suitesOf(xml) {
  const suites = [];
  const re = /<testsuite\b[^>]*?(?:\/>|>[\s\S]*?<\/testsuite>)/g;
  for (const m of xml.matchAll(re)) {
    const text = m[0];
    const open = /^<testsuite\b[^>]*>/.exec(text)[0];
    const name = /\sname="([^"]*)"/.exec(open);
    if (!name) continue;
    const count = (attr) => Number((new RegExp(`\\s${attr}="(\\d+)"`).exec(open) || [])[1] || 0);
    const body = text.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
    const failed = count("failures") > 0 || count("errors") > 0 || /<(failure|error)\b/.test(body);
    suites.push({ name: unescapeXml(name[1]), failed, tests: count("tests"), text });
  }
  return suites;
}

// The file one spec's report is written to: the spec, encoded so that its slashes are not
// directories. The ledger reads the spec from the suite's own name, never from the file's.
export const reportFile = (prefix, spec) => `${prefix}-${encodeURIComponent(spec)}.xml`;

// The report one proof run leaves: platform's `proofReportName`, the spec encoded as for its own.
export const proofReportFile = (mode, run, spec) => reportFile(`PROOF-${mode}-${String(run).padStart(2, "0")}`, spec);

// The runs of one spec's proof, in the order they run: every run alone, then every run under load.
// Alone first, so the cheap runs find a flake before the build's suite is spent on it.
export function proofAttempts(alone, beside) {
  const runs = (mode, n) => Array.from({ length: n }, (_, i) => ({ mode, run: i + 1 }));
  return [...runs("alone", alone), ...runs("load", beside)];
}

// Whether one run's suites of a spec passed: it ran at least one test and none failed. A run that
// ran nothing proved nothing, and a spec the run left no suite for did not pass.
export const proofPassed = (suites) => suites.length > 0 && suites.every((s) => !s.failed) && suites.some((s) => s.tests > 0);

const escapeXml = (s) =>
  s.replace(/[<>"'&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;", "&": "&amp;" })[c]);

// The suite written for a proof run that left none of the spec's own: platform's `missingReport`.
export function missingSuite(spec) {
  const name = escapeXml(spec);
  return (
    `<testsuite errors="1" failures="0" name="${name}" tests="1" time="0">\n` +
    `  <testcase classname="${name}" name="ci-proof" time="0">\n` +
    `    <error message="the run left no report for this suite" type="ci-proof"/>\n` +
    `  </testcase>\n</testsuite>`
  );
}

// CI_PROOF_RUNS="<alone> <beside>", or platform's counts when it is unset.
export function proofRuns(value) {
  if (value === undefined || value.trim() === "") return { alone: PROOF_RUNS_ALONE, beside: PROOF_RUNS_BESIDE };
  const m = /^\s*(\d+)\s+(\d+)\s*$/.exec(value);
  return m ? { alone: Number(m[1]), beside: Number(m[2]) } : null;
}

const junitDocument = (texts) => `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n${texts.join("\n")}\n</testsuites>\n`;

// [suites] written one file per spec, as `TEST-<spec>.xml` under [dir]. A spec two projects both
// ran is one file holding both suites.
function writeReports(dir, suites) {
  const bySpec = new Map();
  for (const s of suites) bySpec.set(s.name, [...(bySpec.get(s.name) || []), s.text]);
  for (const [spec, texts] of bySpec) {
    fs.writeFileSync(path.join(dir, reportFile("TEST", spec)), junitDocument(texts));
  }
}

// ---- the runners ----

function bin(root, runner) {
  return path.join(root, "node_modules", ".bin", runner);
}

function capture(cmd, args, opts) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, ...opts });
  if (r.error) throw r.error;
  return r;
}

// The specs a runner defines, as its JUnit report names them.
function defineSpecs({ root, runner, extra }) {
  if (runner === "none") return [];
  if (runner === "vitest") {
    const r = capture(bin(root, "vitest"), ["list", "--filesOnly", "--json", "--passWithNoTests", ...extra], {
      cwd: root
    });
    if (r.status !== 0) throw new Error(`vitest list exited ${r.status}: ${r.stderr.trim()}`);
    return [...new Set(JSON.parse(r.stdout || "[]").map((t) => toPosix(path.relative(root, t.file))))].sort();
  }
  const r = capture(bin(root, "playwright"), ["test", "--list", "--reporter=json", ...extra], { cwd: root });
  // `--list` exits 1 on a load error; the JSON still says what it found, and the run will say the rest.
  const report = JSON.parse(r.stdout || "{}");
  const files = (report.suites || []).map((s) => s.file).filter(Boolean);
  if (!report.config && r.status !== 0) throw new Error(`playwright --list exited ${r.status}: ${r.stderr.trim()}`);
  return [...new Set(files.map(toPosix))].sort();
}

const toPosix = (p) => p.split(path.sep).join("/");

// The paths vitest would select with [filters], by vitest's own rule (`filterFiles` in vitest's
// node API): a test file whose root-relative path CONTAINS a filter's, case-insensitively. So a
// filter can select a second file whose path contains the first's, and the run would include a spec
// the lists leave out.
export function vitestOvermatched(selected, all) {
  const chosen = new Set(selected);
  return all.filter((t) => !chosen.has(t) && selected.some((f) => t.toLowerCase().includes(f.toLowerCase())));
}

// One invocation of the runner over [specs] (every spec when [specs] is null), its JUnit report
// written to [junit]. Its output is the build's; the answer is its exit code.
function runSpecs(ctx, specs, junit) {
  const { root, runner, extra, scratch } = ctx;
  if (runner === "vitest") {
    const args = [
      "run",
      "--passWithNoTests",
      "--reporter=default",
      "--reporter=junit",
      `--outputFile.junit=${junit}`,
      ...extra,
      ...(specs || [])
    ];
    return spawnSync(bin(root, "vitest"), args, { cwd: root, stdio: "inherit" }).status ?? 1;
  }
  const args = ["test", "--reporter=list,junit", "--retries=0", ...extra];
  if (specs) {
    if (ctx.playwrightVersion === undefined) ctx.playwrightVersion = playwrightVersion(root);
    const refusal = testListRefusal(ctx.playwrightVersion, specs.length);
    if (refusal) throw new Refused(refusal);
    const list = path.join(scratch, `test-list.${path.basename(junit)}.txt`);
    fs.writeFileSync(list, specs.join("\n") + "\n");
    args.push(`--test-list=${list}`);
  }
  const env = { ...process.env, PLAYWRIGHT_JUNIT_OUTPUT_FILE: junit };
  return spawnSync(bin(root, "playwright"), args, { cwd: root, stdio: "inherit", env }).status ?? 1;
}

// The version of @playwright/test this repository installs (of `playwright` when only that is), or
// null when neither package.json can be read.
export function playwrightVersion(root) {
  for (const pkg of ["@playwright/test", "playwright"]) {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, "node_modules", pkg, "package.json"), "utf8")).version || null;
    } catch {
      // the next package, or none
    }
  }
  return null;
}

// Whether [version] is [minimum] or later, by its numeric major.minor.patch. An unreadable version is not.
export function versionAtLeast(version, minimum) {
  const triple = (v) => /^(\d+)\.(\d+)\.(\d+)/.exec(v || "")?.slice(1).map(Number);
  const [have, want] = [triple(version), triple(minimum)];
  if (!have) return false;
  for (let i = 0; i < 3; i++) if (have[i] !== want[i]) return have[i] > want[i];
  return true;
}

// Why a playwright run of [count] spec(s) by name cannot be trusted on [version], or null when it can.
export function testListRefusal(version, count) {
  if (versionAtLeast(version, PLAYWRIGHT_TEST_LIST_MINIMUM)) return null;
  const installed = version
    ? `@playwright/test ${version} runs no test for a --test-list line naming only a file, and exits 0`
    : "the installed @playwright/test version cannot be read from node_modules";
  return `ci-test: ${installed}, so it cannot run ${count} spec(s) by name; this helper needs @playwright/test ${PLAYWRIGHT_TEST_LIST_MINIMUM} or later — raise it in package.json`;
}

// ---- the build ----

function report(line) {
  console.log(line);
  if (process.env.CI_COVERAGE_FILE) fs.appendFileSync(process.env.CI_COVERAGE_FILE, `${line}\n`);
}

function readSuites(junit) {
  try {
    return suitesOf(fs.readFileSync(junit, "utf8"));
  } catch {
    return null;
  }
}

export function main(argv, env = process.env, root = process.cwd()) {
  const [runner, ...extra] = argv;
  if (!RUNNERS.includes(runner)) {
    console.error(`usage: ci-test.mjs ${RUNNERS.join("|")} [runner arguments...]`);
    return 2;
  }
  const proof = proofRuns(env.CI_PROOF_RUNS);
  if (!proof) {
    console.error(`ci-test: CI_PROOF_RUNS=${env.CI_PROOF_RUNS} is not "<alone> <beside>"`);
    return 2;
  }

  // Line 2 and 3: the lists, read before anything runs.
  const slowOnly = env.CI_SLOW_SPECS === "1";
  let lists = null;
  if (env.CI_TEST_LISTS) {
    let parsed;
    try {
      parsed = parseLists(fs.readFileSync(env.CI_TEST_LISTS, "utf8"));
    } catch (e) {
      parsed = { error: e.message };
    }
    if (parsed.error) {
      console.error(
        `ci-test: INFRASTRUCTURE FAULT — CI_TEST_LISTS=${env.CI_TEST_LISTS} is not a lists file (${parsed.error}), so this build cannot know which specs to leave out; nothing about the tree was measured`
      );
      return INFRA_EXIT;
    }
    lists = parsed.lists;
    console.log(listsLine(lists));
  } else if (slowOnly) {
    console.error(
      "ci-test: INFRASTRUCTURE FAULT — CI_SLOW_SPECS=1 runs only the slow specs and CI_TEST_LISTS names no lists; nothing about the tree was measured"
    );
    return INFRA_EXIT;
  }

  const ctx = { root, runner, extra, proof, scratch: fs.mkdtempSync(path.join(os.tmpdir(), "ci-test-")) };
  try {
    return build(ctx, lists, slowOnly);
  } catch (e) {
    if (!(e instanceof Refused)) throw e;
    console.error(e.message);
    return 1;
  } finally {
    fs.rmSync(ctx.scratch, { recursive: true, force: true });
  }
}

function build(ctx, lists, slowOnly) {
  const { root, runner, scratch } = ctx;
  const reports = path.join(root, REPORTS_ROOT, runner);
  fs.rmSync(reports, { recursive: true, force: true });
  fs.mkdirSync(reports, { recursive: true });

  if (runner !== "none" && !fs.existsSync(bin(root, runner))) {
    console.error(`ci-test: ${bin(root, runner)} is not installed; run npm ci first`);
    return 1;
  }
  const defined = defineSpecs(ctx);
  const selected = defined.filter((s) => runs(lists, slowOnly, s));
  if (lists && !slowOnly) {
    for (const spec of unknownSpecs(lists, defined)) console.log(`ci-lists: unknown ${spec}`);
    const listed = new Set([...lists.quarantined, ...lists.slow, ...lists.proof]).size;
    console.log(`ci-lists: checked ${listed} listed spec(s)`);
  }
  if (!slowOnly) console.log(`ci-scope: full every ${runner} spec the lists leave in`);
  console.log(`ci-test: ${runner}: ${selected.length} of ${defined.length} spec(s) to run`);
  if (selected.length === 0) {
    console.log("ci-test-phase: 0s");
    return 0;
  }

  // Line 1: the run. Every spec by name only when the lists leave something out.
  const filter = selected.length === defined.length ? null : selected;
  if (filter && runner === "vitest") {
    const over = vitestOvermatched(selected, defined);
    if (over.length) {
      console.error(
        `ci-test: vitest selects a test file by any path containing the one named, so running ${selected.length} spec(s) would also run ${over.join(", ")}, which the lists leave out; rename one of them`
      );
      return 1;
    }
  }
  const started = Date.now();
  const first = path.join(scratch, "run-1.xml");
  const status = runSpecs(ctx, filter, first);
  console.log(`ci-test-phase: ${Math.round((Date.now() - started) / 1000)}s`);
  const suites = readSuites(first);
  if (suites) writeReports(reports, suites);
  const result = status === 0 ? 0 : rerun(ctx, reports, status, suites);
  if (result !== 0 || !lists || slowOnly || lists.proof.size === 0) return result;
  return proveAll(ctx, reports, selected.filter((s) => lists.proof.has(s)), filter);
}

// Line 4: the rerun, of failing specs and nothing else.
function rerun(ctx, reports, status, suites) {
  const { runner, scratch } = ctx;
  const failed = [...new Set((suites || []).filter((s) => s.failed).map((s) => s.name))].sort();
  if (!suites || failed.length === 0) {
    console.log(
      `ci-rerun: nothing to rerun — ${runner} exited ${status} ${suites ? "with no spec failing" : "and left no report"}`
    );
    return status;
  }
  for (const spec of failed) {
    const test = path.join(reports, reportFile("TEST", spec));
    if (fs.existsSync(test)) fs.renameSync(test, path.join(reports, reportFile("FIRST", spec)));
  }
  console.log(`ci-rerun: ${runner} ${failed.join(" ")}`);
  const second = path.join(scratch, "run-2.xml");
  const rerunStatus = runSpecs(ctx, failed, second);
  const rerunSuites = readSuites(second) || [];
  writeReports(reports, rerunSuites);
  let flakes = 0;
  let again = 0;
  for (const spec of failed) {
    const ran = rerunSuites.filter((s) => s.name === spec);
    if (ran.length > 0 && ran.every((s) => !s.failed)) {
      console.log(`ci-flake: ${spec}`);
      flakes++;
    } else {
      console.log(`ci-rerun: failed again: ${spec}`);
      again++;
    }
  }
  console.log("ci-rerun: done");
  report(`ci-covered: rerun: ${flakes} flake${flakes === 1 ? "" : "s"}`);
  if (again > 0) return status;
  if (rerunStatus !== 0) {
    console.error(`ci-test: the rerun passed every spec it ran and ${runner} still exited ${rerunStatus}`);
    return rerunStatus;
  }
  return 0;
}

// The proof of every proof spec the build ran, in a stable order, stopping at the first run that
// fails: one failed run is a red build, and the runs after it would spend a runner to say so again.
// A load run runs [filter], the build's own selection.
function proveAll(ctx, reports, specs, filter) {
  const { alone, beside } = ctx.proof;
  const sorted = [...specs].sort();
  for (const spec of sorted) {
    if (!prove(ctx, reports, spec, filter)) {
      console.log("ci-proof: FAILED");
      return 1;
    }
  }
  console.log(`ci-proof: passed ${sorted.length} spec(s), ${alone} alone and ${beside} beside each`);
  report("ci-covered: proof");
  return 0;
}

function prove(ctx, reports, spec, filter) {
  const { runner, scratch, proof } = ctx;
  console.log(`ci-proof: ${spec}: ${proof.alone} alone, ${proof.beside} with the rest of the ${runner} specs`);
  for (const { mode, run } of proofAttempts(proof.alone, proof.beside)) {
    const junit = path.join(scratch, `proof-${mode}-${run}.xml`);
    runSpecs(ctx, mode === "alone" ? [spec] : filter, junit);
    const own = (readSuites(junit) || []).filter((s) => s.name === spec);
    const texts = own.length > 0 ? own.map((s) => s.text) : [missingSuite(spec)];
    fs.writeFileSync(path.join(reports, proofReportFile(mode, run, spec)), junitDocument(texts));
    const passed = proofPassed(own);
    const of = mode === "alone" ? proof.alone : proof.beside;
    console.log(`ci-proof: ${spec} ${mode} ${run}/${of} ${passed ? "passed" : "failed"}`);
    if (!passed) return false;
  }
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2));
}
