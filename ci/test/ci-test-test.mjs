// node --test ci/test/ci-test-test.mjs
//
// `scripts/ci-test.mjs` against the REAL vitest and playwright this repository installs, because the
// thing it does that is worth testing is drive them: which files a filter selects, what a JUnit
// report calls a spec, what a runner exits when a spec fails. A fixture that stubbed the runners
// out would pass forever while the shipped helper asked them the wrong question. A runner this
// repository does not install skips its cases. This file is a copy of devops
// templates/npm/ci-test-test.mjs.
//
// Each fixture is a directory of its own with this repository's `node_modules` linked into it, so
// the runner is the installed one and the specs are the fixture's. A FLAKY spec is one that fails
// the first time it runs in a fixture and passes after: it leaves a marker file beside itself.
//
// NODE STDLIB ONLY: `node:test` is the runner and `node:assert` the assertions, so running this file
// directly IS the invocation and a failing test exits 1.
//
// EVERY FIXTURE IS PRIVATE TO ONE RUN. Several sessions share a runner as one user, so a fixed name
// under the system temp directory is a name a sibling is also using: each case builds its own
// `mkdtemp` root and removes it.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const HELPER = fileURLToPath(new URL("../../scripts/ci-test.mjs", import.meta.url));
const REPO = path.resolve(path.dirname(HELPER), "..");
const MODULES = path.join(REPO, "node_modules");
const { parseLists, runs, unknownSpecs, suitesOf, vitestOvermatched, reportFile, proofReportFile, proofAttempts, proofPassed, proofRuns, missingSuite } =
  await import(HELPER);

const has = (runner) => fs.existsSync(path.join(MODULES, ".bin", runner));

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ci-test-fixture-"));
  fs.symlinkSync(MODULES, path.join(root, "node_modules"));
  fs.writeFileSync(path.join(root, "package.json"), '{ "type": "module" }\n');
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), text);
  }
  return root;
}

function run(root, args, env = {}) {
  const clean = { ...process.env };
  for (const k of ["CI_TEST_LISTS", "CI_SLOW_SPECS", "CI_PROOF_RUNS", "CI_COVERAGE_FILE", "CI"]) delete clean[k];
  const r = spawnSync(process.execPath, [HELPER, ...args], { cwd: root, encoding: "utf8", env: { ...clean, ...env } });
  return { status: r.status, out: r.stdout, err: r.stderr, lines: r.stdout.split("\n") };
}

function withFixture(files, body) {
  const root = fixture(files);
  try {
    body(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const reports = (root, runner) => fs.readdirSync(path.join(root, "ci-test-reports", runner)).sort();
const lists = (root, text) => {
  const file = path.join(root, "lists.txt");
  fs.writeFileSync(file, text);
  return file;
};

// ---- vitest ----

const vPass = (name) => `import { test, expect } from "vitest";\ntest("${name}", () => expect(1).toBe(1));\n`;
const vFail = 'import { test, expect } from "vitest";\ntest("broken", () => expect(1).toBe(2));\n';
// Passes its first [passes] runs in a fixture and fails every run after: it counts its runs in a file
// beside itself.
const vFailsAfter = (passes) =>
  `import { test, expect } from "vitest";\nimport fs from "node:fs";\n` +
  `test("counted", () => { const m = new URL("./runs-" + import.meta.url.split("/").pop(), import.meta.url); ` +
  `const n = fs.existsSync(m) ? Number(fs.readFileSync(m, "utf8")) + 1 : 1; fs.writeFileSync(m, String(n)); expect(n <= ${passes}).toBe(true); });\n`;
const vFlaky = (marker) =>
  `import { test, expect } from "vitest";\nimport fs from "node:fs";\n` +
  `test("flaky", () => { const m = new URL("./${marker}", import.meta.url); const seen = fs.existsSync(m); fs.writeFileSync(m, ""); expect(seen).toBe(true); });\n`;

test("vitest: a green run writes one TEST report per spec and reruns nothing", { skip: !has("vitest") }, () => {
  withFixture({ "src/a.test.mjs": vPass("a"), "src/routes/[id]/b.test.mjs": vPass("b") }, (root) => {
    const r = run(root, ["vitest"]);
    assert.equal(r.status, 0, r.out + r.err);
    assert.match(r.out, /ci-test: vitest: 2 of 2 spec\(s\) to run/);
    assert.match(r.out, /^ci-test-phase: \d+s$/m);
    assert.doesNotMatch(r.out, /ci-rerun/);
    assert.deepEqual(reports(root, "vitest"), [reportFile("TEST", "src/a.test.mjs"), reportFile("TEST", "src/routes/[id]/b.test.mjs")]);
    const xml = fs.readFileSync(path.join(root, "ci-test-reports/vitest", reportFile("TEST", "src/a.test.mjs")), "utf8");
    assert.deepEqual(suitesOf(xml).map((s) => [s.name, s.failed]), [["src/a.test.mjs", false]]);
  });
});

test("vitest: a failed spec is rerun once; a flake passes the build and a second failure fails it", { skip: !has("vitest") }, () => {
  withFixture({ "a.test.mjs": vPass("a"), "flaky.test.mjs": vFlaky("seen"), "broken.test.mjs": vFail }, (root) => {
    const coverage = path.join(root, "coverage.txt");
    const r = run(root, ["vitest"], { CI_COVERAGE_FILE: coverage });
    assert.notEqual(r.status, 0);
    assert.ok(r.lines.includes("ci-rerun: vitest broken.test.mjs flaky.test.mjs"), r.out);
    assert.ok(r.lines.includes("ci-flake: flaky.test.mjs"), r.out);
    assert.ok(r.lines.includes("ci-rerun: failed again: broken.test.mjs"), r.out);
    assert.ok(r.lines.includes("ci-rerun: done"), r.out);
    assert.equal(fs.readFileSync(coverage, "utf8"), "ci-covered: rerun: 1 flake\n");
    const names = reports(root, "vitest");
    for (const spec of ["flaky.test.mjs", "broken.test.mjs"]) {
      assert.ok(names.includes(reportFile("FIRST", spec)), names.join(" "));
      assert.ok(names.includes(reportFile("TEST", spec)), names.join(" "));
    }
    assert.ok(names.includes(reportFile("TEST", "a.test.mjs")));
    assert.ok(!names.includes(reportFile("FIRST", "a.test.mjs")));
  });
});

test("vitest: a build whose only failure is a flake is green", { skip: !has("vitest") }, () => {
  withFixture({ "a.test.mjs": vPass("a"), "flaky.test.mjs": vFlaky("seen") }, (root) => {
    const r = run(root, ["vitest"]);
    assert.equal(r.status, 0, r.out + r.err);
    assert.ok(r.lines.includes("ci-flake: flaky.test.mjs"));
    assert.ok(r.lines.includes("ci-rerun: done"));
  });
});

test("vitest: the lists leave out quarantined and slow specs, prove proof specs 5 alone and 3 under load, and name unknown ones", { skip: !has("vitest") }, () => {
  const files = { "keep.test.mjs": vPass("k"), "q.test.mjs": vFail, "slow.test.mjs": vFail, "proof.test.mjs": vPass("p") };
  withFixture(files, (root) => {
    const file = lists(root, "version 7\nquarantined q.test.mjs\nslow slow.test.mjs\nproof proof.test.mjs\nslow gone.test.mjs\n\n");
    const coverage = path.join(root, "coverage.txt");
    const r = run(root, ["vitest"], { CI_TEST_LISTS: file, CI_COVERAGE_FILE: coverage });
    assert.equal(r.status, 0, r.out + r.err);
    assert.equal(r.lines[0], "ci-lists: version 7 quarantined 1 slow 2");
    assert.ok(r.lines.includes("ci-lists: unknown gone.test.mjs"));
    assert.ok(r.lines.includes("ci-lists: checked 4 listed spec(s)"));
    assert.match(r.out, /ci-test: vitest: 2 of 4 spec\(s\) to run/);
    assert.ok(r.lines.includes("ci-proof: proof.test.mjs alone 5/5 passed"), r.out);
    assert.ok(r.lines.includes("ci-proof: proof.test.mjs load 3/3 passed"), r.out);
    assert.ok(r.lines.includes("ci-proof: passed 1 spec(s), 5 alone and 3 beside each"), r.out);
    assert.equal(fs.readFileSync(coverage, "utf8"), "ci-covered: proof\n");
    const proofs = ["alone-01", "alone-02", "alone-03", "alone-04", "alone-05", "load-01", "load-02", "load-03"].map((m) => `PROOF-${m}-proof.test.mjs.xml`);
    assert.deepEqual(reports(root, "vitest"), [...proofs, reportFile("TEST", "keep.test.mjs"), reportFile("TEST", "proof.test.mjs")].sort());
    // A load run ran keep.test.mjs too; the proof's report holds the proof spec and nothing else.
    const load = fs.readFileSync(path.join(root, "ci-test-reports/vitest", "PROOF-load-01-proof.test.mjs.xml"), "utf8");
    assert.deepEqual(suitesOf(load).map((s) => [s.name, s.failed]), [["proof.test.mjs", false]]);
  });
});

test("vitest: the first failed proof run ends the proof and the build is red", { skip: !has("vitest") }, () => {
  withFixture({ "keep.test.mjs": vPass("k"), "proof.test.mjs": vFailsAfter(2) }, (root) => {
    const file = lists(root, "version 1\nproof proof.test.mjs\n");
    const r = run(root, ["vitest"], { CI_TEST_LISTS: file, CI_PROOF_RUNS: "3 1" });
    assert.equal(r.status, 1, r.out + r.err);
    assert.ok(r.lines.includes("ci-proof: proof.test.mjs alone 1/3 passed"), r.out);
    assert.ok(r.lines.includes("ci-proof: proof.test.mjs alone 2/3 failed"), r.out);
    assert.ok(r.lines.includes("ci-proof: FAILED"), r.out);
    assert.doesNotMatch(r.out, /ci-proof: passed|alone 3\/3|load 1\/1/);
    const names = reports(root, "vitest");
    assert.deepEqual(names.filter((n) => n.startsWith("PROOF-")), ["PROOF-alone-01-proof.test.mjs.xml", "PROOF-alone-02-proof.test.mjs.xml"]);
    const failed = fs.readFileSync(path.join(root, "ci-test-reports/vitest", "PROOF-alone-02-proof.test.mjs.xml"), "utf8");
    assert.deepEqual(suitesOf(failed).map((s) => s.failed), [true]);
  });
});

test("vitest: another spec failing in a load run is not the proof spec's failure", { skip: !has("vitest") }, () => {
  withFixture({ "other.test.mjs": vFailsAfter(1), "proof.test.mjs": vPass("p") }, (root) => {
    const r = run(root, ["vitest"], { CI_TEST_LISTS: lists(root, "version 1\nproof proof.test.mjs\n"), CI_PROOF_RUNS: "1 2" });
    assert.equal(r.status, 0, r.out + r.err);
    assert.ok(r.lines.includes("ci-proof: proof.test.mjs load 2/2 passed"), r.out);
    assert.ok(r.lines.includes("ci-proof: passed 1 spec(s), 1 alone and 2 beside each"), r.out);
  });
});

test("vitest: no proof without lists, in the slow run, or after a red build", { skip: !has("vitest") }, () => {
  withFixture({ "proof.test.mjs": vPass("p"), "broken.test.mjs": vFail }, (root) => {
    const noLists = run(root, ["vitest"]);
    assert.doesNotMatch(noLists.out, /ci-proof/);
    const red = run(root, ["vitest"], { CI_TEST_LISTS: lists(root, "version 1\nproof proof.test.mjs\n") });
    assert.notEqual(red.status, 0);
    assert.doesNotMatch(red.out, /ci-proof/);
    const slow = run(root, ["vitest"], { CI_TEST_LISTS: lists(root, "version 1\nslow proof.test.mjs\nproof proof.test.mjs\n"), CI_SLOW_SPECS: "1" });
    assert.equal(slow.status, 0, slow.out + slow.err);
    assert.doesNotMatch(slow.out, /ci-proof/);
    assert.ok(!reports(root, "vitest").some((n) => n.startsWith("PROOF-")));
  });
});

test("vitest: CI_SLOW_SPECS=1 runs the slow specs and nothing else", { skip: !has("vitest") }, () => {
  withFixture({ "keep.test.mjs": vFail, "slow.test.mjs": vPass("s"), "slowq.test.mjs": vFail }, (root) => {
    const file = lists(root, "version 3\nslow slow.test.mjs\nslow slowq.test.mjs\nquarantined slowq.test.mjs\n");
    const r = run(root, ["vitest"], { CI_TEST_LISTS: file, CI_SLOW_SPECS: "1" });
    assert.equal(r.status, 0, r.out + r.err);
    assert.doesNotMatch(r.out, /ci-scope:|ci-lists: unknown|ci-lists: checked/);
    assert.deepEqual(reports(root, "vitest"), [reportFile("TEST", "slow.test.mjs")]);
  });
});

test("vitest: a spec whose path contains a selected one's is refused rather than run", { skip: !has("vitest") }, () => {
  withFixture({ "a.test.mjs": vPass("a"), "x/a.test.mjs": vPass("xa") }, (root) => {
    const r = run(root, ["vitest"], { CI_TEST_LISTS: lists(root, "version 1\nquarantined x/a.test.mjs\n") });
    assert.equal(r.status, 1);
    assert.match(r.err, /would also run x\/a\.test\.mjs/);
  });
});

// ---- the lists, refused ----

test("a lists file that is not the format, and a slow run with no lists, measure nothing (75)", () => {
  withFixture({}, (root) => {
    const bad = run(root, ["none"], { CI_TEST_LISTS: lists(root, "version 1\nflaky x\n") });
    assert.equal(bad.status, 75);
    assert.match(bad.err, /line 2: neither quarantined, slow nor proof/);
    const missing = run(root, ["none"], { CI_TEST_LISTS: path.join(root, "absent.txt") });
    assert.equal(missing.status, 75);
    const slow = run(root, ["none"], { CI_SLOW_SPECS: "1" });
    assert.equal(slow.status, 75);
    assert.match(slow.err, /CI_SLOW_SPECS=1 runs only the slow specs and CI_TEST_LISTS names no lists/);
  });
});

test("none: a repository whose tests are nothing still prints the lists and reports zero specs", () => {
  withFixture({}, (root) => {
    const r = run(root, ["none"], { CI_TEST_LISTS: lists(root, "4\n") });
    assert.equal(r.status, 0, r.err);
    assert.equal(r.lines[0], "ci-lists: version 4 quarantined 0 slow 0");
    assert.ok(r.lines.includes("ci-test: none: 0 of 0 spec(s) to run"));
    assert.ok(r.lines.includes("ci-test-phase: 0s"));
    assert.deepEqual(reports(root, "none"), []);
  });
});

test("an unknown runner, and a CI_PROOF_RUNS that is not two counts, are usage errors", () => {
  withFixture({}, (root) => {
    assert.equal(run(root, ["jest"]).status, 2);
    const r = run(root, ["none"], { CI_PROOF_RUNS: "20" });
    assert.equal(r.status, 2);
    assert.match(r.err, /CI_PROOF_RUNS=20 is not "<alone> <beside>"/);
  });
});

// ---- playwright ----

const pConfig = 'import { defineConfig } from "@playwright/test";\nexport default defineConfig({ testDir: "./tests" });\n';
const pPass = (name) => `import { test, expect } from "@playwright/test";\ntest("${name}", () => expect(1).toBe(1));\n`;
const pFail = 'import { test, expect } from "@playwright/test";\ntest("broken", () => expect(1).toBe(2));\n';
const pFlaky =
  'import { test, expect } from "@playwright/test";\nimport fs from "node:fs";\n' +
  'test("flaky", () => { const m = new URL("./seen", import.meta.url); const seen = fs.existsSync(m); fs.writeFileSync(m, ""); expect(seen).toBe(true); });\n';

test("playwright: specs are testDir-relative, the lists filter them, and a failed spec is rerun once", { skip: !has("playwright") }, () => {
  const files = {
    "playwright.config.mjs": pConfig,
    "tests/keep.spec.mjs": pPass("keep"),
    "tests/sub/flaky.spec.mjs": pFlaky,
    "tests/broken.spec.mjs": pFail,
    "tests/q.spec.mjs": pFail
  };
  withFixture(files, (root) => {
    const r = run(root, ["playwright"], { CI_TEST_LISTS: lists(root, "version 2\nquarantined q.spec.mjs\n") });
    assert.notEqual(r.status, 0);
    assert.match(r.out, /ci-test: playwright: 3 of 4 spec\(s\) to run/);
    assert.ok(r.lines.includes("ci-flake: sub/flaky.spec.mjs"), r.out);
    assert.ok(r.lines.includes("ci-rerun: failed again: broken.spec.mjs"), r.out);
    assert.ok(r.lines.includes("ci-rerun: done"));
    const names = reports(root, "playwright");
    assert.ok(!names.some((n) => n.includes("q.spec")), names.join(" "));
    assert.ok(names.includes(reportFile("FIRST", "sub/flaky.spec.mjs")));
    assert.ok(names.includes(reportFile("TEST", "keep.spec.mjs")));
  });
});

test("playwright: a proof spec is proved by name, alone and under load", { skip: !has("playwright") }, () => {
  const files = { "playwright.config.mjs": pConfig, "tests/keep.spec.mjs": pPass("keep"), "tests/sub/proof.spec.mjs": pPass("proof") };
  withFixture(files, (root) => {
    const r = run(root, ["playwright"], { CI_TEST_LISTS: lists(root, "version 2\nproof sub/proof.spec.mjs\n"), CI_PROOF_RUNS: "1 1" });
    assert.equal(r.status, 0, r.out + r.err);
    assert.ok(r.lines.includes("ci-proof: passed 1 spec(s), 1 alone and 1 beside each"), r.out);
    const names = reports(root, "playwright");
    for (const mode of ["alone", "load"]) assert.ok(names.includes(proofReportFile(mode, 1, "sub/proof.spec.mjs")), names.join(" "));
    const alone = fs.readFileSync(path.join(root, "ci-test-reports/playwright", proofReportFile("alone", 1, "sub/proof.spec.mjs")), "utf8");
    assert.deepEqual(suitesOf(alone).map((s) => [s.name, s.failed]), [["sub/proof.spec.mjs", false]]);
  });
});

// ---- the pure parts ----

test("parseLists reads platform's format and refuses anything else", () => {
  const { lists: l } = parseLists("version 9\r\nquarantined a\nslow b\nproof c\n");
  assert.equal(l.version, "9");
  assert.deepEqual([...l.quarantined, ...l.slow, ...l.proof], ["a", "b", "c"]);
  assert.equal(parseLists("12").lists.version, "12");
  assert.match(parseLists("").error, /empty/);
  assert.match(parseLists("v1\n").error, /line 1/);
  assert.match(parseLists("1\nslow a b\n").error, /line 2/);
});

test("runs is platform's rule: proof runs, quarantine wins over slow, no lists leaves nothing out", () => {
  const l = { quarantined: new Set(["q", "qs"]), slow: new Set(["s", "qs"]), proof: new Set(["q"]) };
  assert.deepEqual(["a", "q", "s", "qs"].filter((s) => runs(l, false, s)), ["a", "q"]);
  assert.deepEqual(["a", "q", "s", "qs"].filter((s) => runs(l, true, s)), ["s"]);
  assert.equal(runs(null, false, "a"), true);
  assert.equal(runs(null, true, "a"), false);
  assert.deepEqual(unknownSpecs(l, ["q"]), ["qs", "s"]);
});

test("suitesOf names each suite and says whether it failed, CDATA aside", () => {
  const xml =
    '<testsuites><testsuite name="a &amp; b.test.ts" tests="1" failures="0" errors="0"><testcase name="x"><system-out><![CDATA[<failure>]]></system-out></testcase></testsuite>' +
    '<testsuite name="c.test.ts" tests="1" failures="1"><testcase name="y"><failure message="no"/></testcase></testsuite>' +
    '<testsuite name="d.test.ts" tests="0" failures="0" errors="0"/></testsuites>';
  assert.deepEqual(suitesOf(xml).map((s) => [s.name, s.failed]), [["a & b.test.ts", false], ["c.test.ts", true], ["d.test.ts", false]]);
});

test("vitestOvermatched is vitest's own substring rule", () => {
  assert.deepEqual(vitestOvermatched(["src/a.test.ts"], ["src/a.test.ts", "src/a.test.tsx", "x/src/A.test.ts", "b.test.ts"]), ["src/a.test.tsx", "x/src/A.test.ts"]);
});

test("the proof is platform's: 5 alone then 3 under load, reports named PROOF-<mode>-<run>-<spec>.xml", () => {
  assert.deepEqual(proofRuns(undefined), { alone: 5, beside: 3 });
  assert.deepEqual(proofRuns("2 0"), { alone: 2, beside: 0 });
  assert.equal(proofRuns("20"), null);
  assert.deepEqual(proofAttempts(2, 1), [{ mode: "alone", run: 1 }, { mode: "alone", run: 2 }, { mode: "load", run: 1 }]);
  assert.equal(proofReportFile("alone", 3, "src/a.test.ts"), "PROOF-alone-03-src%2Fa.test.ts.xml");
  assert.equal(proofReportFile("load", 12, "a.test.ts"), "PROOF-load-12-a.test.ts.xml");
});

test("a proof run passes when it ran a test of the spec and none failed; a missing report is a failure", () => {
  const ok = { name: "a", failed: false, tests: 1 };
  assert.equal(proofPassed([ok]), true);
  assert.equal(proofPassed([]), false);
  assert.equal(proofPassed([{ ...ok, tests: 0 }]), false);
  assert.equal(proofPassed([ok, { ...ok, failed: true }]), false);
  const missing = suitesOf(missingSuite("a & <b>.test.ts"));
  assert.deepEqual(missing.map((s) => [s.name, s.failed, s.tests]), [["a & <b>.test.ts", true, 1]]);
});
