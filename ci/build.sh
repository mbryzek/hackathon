#!/usr/bin/env bash
#
# What CI runs for hackathon.
#
# LANDING THIS FILE IS THE ENROLMENT (ISS-848). The fleet verifies a repo exactly
# when `ci/build.sh` exists at a pull request's head sha — there is no registry to
# keep in step with the repos that have one. A verify job checks the commit out
# detached, runs this, and posts the result as the `ci` commit status the merge
# lane reads.
#
# That cuts both ways: **a broken script here parks every pull request in this
# repo**, because the lane refuses anything whose `ci` is not green. Confirm a
# change to it by hand before merging one:
#
#   dev ci verify --repo mbryzek/hackathon --sha <head sha> --pr <n> --no-post
#
# `set -euo pipefail` is not style. A pipeline reports only its LAST command's
# status, so any chain here that swallowed a failure would exit 0 and publish a
# green nothing measured. One exit status, no exceptions.
#
# This repo's build needs nothing from the machine beyond disk — no Docker, no
# registry credential, no session database — so there is no `# ci-needs:` line.
# `dev ci preflight` reads that directive out of this file at the sha being
# built, so adding a dependency here means adding it there in the same commit.
# No `heap:` either: an npm build fits in the least any runner in the fleet
# hands out, and every gigabyte declared narrows the set of machines that can
# build this repo.
#
# TEST HEALTH'S CONTRACT (design DES-18577, "Every repository with CI"). The two lines below are
# its declarations; `scripts/ci-test.mjs`, which `npm run test:unit` runs, is the rest — see the
# test step further down.
#
# ci-test-reports: ci-test-reports/*/*.xml
# ci-test-lists: required
set -euo pipefail

echo "building ${CI_REPO:-hackathon} @ ${CI_SHA:-working tree} (${CI_EVENT:-local}, clean=${CI_CLEAN_BUILD:-?})"

# SAY WHAT THIS BUILD COVERED (ISS-2175). Two verbs, `covered` and `not-run`;
# each becomes a clause on the `ci` status and a line in this log. The echo is
# for the log and the append is what reaches the status, so the two cannot come
# to say different things. An unset CI_COVERAGE_FILE means nobody is collecting
# — this script run by hand — and this shape both survives `set -u` and always
# exits 0, which `set -e` requires of the last command in a function.
ci_report() {                    # ci_report covered|not-run "<short phrase>"
  local line="ci-$1: $2"
  echo "$line"
  [ -z "${CI_COVERAGE_FILE:-}" ] || printf '%s\n' "$line" >>"$CI_COVERAGE_FILE"
}

# A DIFF THAT ONLY MOVES THE LOCKFILE BUILDS WHAT A LOCKFILE CAN BREAK (ISS-19997).
# A dependency bump is one mechanical change across the fleet: `package-lock.json`
# moves, and sometimes `package.json`'s `overrides` with it. No line of this repo's
# source changed, so what it can break is the install and the build: `npm ci` and
# `npm run build` are this build's whole verdict on it, and the status says so.
#
# DECIDED FROM THE DIFF, NEVER THE TITLE: `dev ci lockfile-only` compares this tree
# with its merge base on origin's default branch and answers 0 only when every
# changed path is a `package-lock.json` or a `package.json` whose only change is
# `overrides`. Every other answer is the full build below — 1 for any other change
# and for a build of `main` itself, 2 when it could not tell, and a nonzero exit
# from a runner whose `dev` predates the command.
#
# IT RUNS FIRST, before the test health and codegen checks, for two reasons. Both
# judge files a lockfile-only diff does not touch, so they have nothing to say
# about it; and the status clause keeps whole entries from the FRONT, so a scope
# reported after three others is the one dropped from the `ci` description.
scope_rc=0; dev ci lockfile-only || scope_rc=$?
if [ "$scope_rc" -eq 0 ]; then
  npm ci
  npm run build
  ci_report covered "npm ci + build (lockfile-only diff)"
  exit 0
fi

# THE SHARED STEPS ARE DEVOPS', NOT THIS FILE'S (ISS-19732). `dev ci step NAME`
# runs `templates/ci/steps/NAME` out of the devops release this machine runs, so a
# step's rule, its comment or a new step in the family sequence reaches every
# SvelteKit repo with one devops release and no pull request here. Each step
# reports what it covered itself. `dev ci step --list` says what this release
# carries, and the comments that say why each step exists live with the step.
#
# `codegen`: the two codegen lints, before `npm ci` because they read only
# committed files; reported not-run without `.api/config.pkl`.
dev ci step codegen

# THE TEST HEALTH HELPER IS DEVOPS' BYTES (ISS-19888). `scripts/ci-test.mjs` is the one npm
# implementation of the contract every npm repository runs, and `ci/test/ci-test-test.mjs` its
# suite; both are copies of devops `templates/npm/`, so a copy that is missing or drifts from devops
# `main` fails here, before anything is installed, with the line that syncs it. A package.json whose
# scripts never run the helper fails too: the declarations above would be a claim nothing keeps.
#
# EACH TEMPLATE IS READ INTO A FILE, AND READ ONCE MORE WHEN THAT FAILS. Diffed straight off a
# process substitution, a failed read compares the copy against nothing and reports all of it as
# drift; a read that fails twice is the box instead, 75 with nothing measured.
template_diff() {                # template_diff <devops path> <tracked copy>
  local bytes read_rc=0 diff_rc=0
  bytes=$(mktemp "${TMPDIR:-/tmp}/ci-template.XXXXXX")
  dev repo cat devops "$1" >"$bytes" || dev repo cat devops "$1" >"$bytes" || read_rc=$?
  [ "$read_rc" -ne 0 ] || diff -u "$bytes" "$2" || diff_rc=$?
  rm -f "$bytes"
  if [ "$read_rc" -ne 0 ]; then
    echo "ci/build.sh: could not read devops $1 (dev repo cat exit $read_rc, twice) -- a read failure, not a drift in $2; nothing was measured" >&2
    exit 75
  fi
  return "$diff_rc"
}
for template in ci-test.mjs:scripts/ci-test.mjs ci-test-test.mjs:ci/test/ci-test-test.mjs; do
  if ! template_diff "templates/npm/${template%%:*}" "${template#*:}"; then
    echo "ci/build.sh: sync it — dev repo cat devops templates/npm/${template%%:*} > ${template#*:}" >&2
    exit 1
  fi
done
if ! grep -q 'node scripts/ci-test.mjs ' package.json; then
  echo "ci/build.sh: no package.json script runs scripts/ci-test.mjs — make test:unit \"node scripts/ci-test.mjs vitest\" (or \"... none\" with no tests)" >&2
  exit 1
fi
ci_report covered "test health helper matches devops"

# `npm ci` rather than `npm install`: the lockfile is the contract, and a build
# that silently resolved a different tree than the one committed is a green
# measured on something nobody is merging. It is fast here regardless — the
# download half is served from ~/.npm, which lives outside the checkout and
# survives every clean.
npm ci

# The helper's own suite, against the vitest and playwright `npm ci` just installed: it drives both
# runners in private fixtures, so a helper that asks either the wrong question is red here rather
# than wrong in every build's reports.
node --test ci/test/ci-test-test.mjs
ci_report covered "test health helper suite"

# svelte-check + the Playwright tsconfig typecheck + eslint --max-warnings 0 +
# vitest. `npm run check` is the whole
# gate in every SvelteKit repo in this fleet (ISS-3885), so there is deliberately no
# second test step below — running the unit suite twice would double the slowest
# part of this build for the same verdict.
#
# ITS VITEST IS TEST HEALTH'S RUNNER. `npm run test:unit` is `node scripts/ci-test.mjs vitest`,
# which reads the lists `CI_TEST_LISTS` names and prints the `ci-lists:` line, leaves out every
# quarantined and slow spec (with `CI_SLOW_SPECS=1`, runs the slow ones alone), writes each spec's
# JUnit report under `ci-test-reports/vitest/`, and reruns every failed spec once, printing
# `ci-flake: <spec>` for each that passes the second time, `ci-rerun: failed again: <spec>` for
# each that does not, and `ci-rerun: done`. A flake does not fail this build; a spec that fails
# twice does.
npm run check

# `sveltekit`: everything the family runs after `npm run check`, in order —
# the advisory format report (formatting never fails a build, ISS-19427), the
# svelte-vitals gate on new findings (ISS-15600), and `npm run build`, the verdict
# svelte-check cannot give (ISS-868).
#
# The hygiene sweep reads the declaration below out of this file and runs the
# repo's `scripts/check-format` (a copy of devops templates/ci/check-format) over
# `main` every 14 days.
# ci-advisory: scripts/check-format
dev ci step sveltekit
