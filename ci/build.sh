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

# NO CODEGEN STEP. This site calls no API and carries no generated client, so
# there is no `.api/config.pkl` for `dev codegen lint-consumers` or
# `dev codegen landed` to read; both would answer "could not look".

# `npm ci` rather than `npm install`: the lockfile is the contract, and a build
# that silently resolved a different tree than the one committed is a green
# measured on something nobody is merging. It is fast here regardless — the
# download half is served from ~/.npm, which lives outside the checkout and
# survives every clean.
npm ci

# svelte-check + the Playwright tsconfig typecheck + eslint --max-warnings 0 +
# vitest. `npm run check` is the whole
# gate in every SvelteKit repo in this fleet (ISS-3885), so there is deliberately no
# second test step below — running the unit suite twice would double the slowest
# part of this build for the same verdict.
npm run check

# FORMATTING NEVER FAILS THIS BUILD (ISS-19427): a build fails only for a
# functional problem, and an unformatted file behaves exactly as its formatted
# copy does, so `npm run check` carries no `prettier --check`. `scripts/check-format`
# (a copy of devops templates/ci/check-format, which runs `dev fmt report` — this
# repo's own `node_modules/.bin/prettier --list-different .`) prints every
# unformatted file and exits 0. The hygiene sweep runs it over `main` and fixes
# what it finds; `npm run format` is the fix.
# ci-advisory: scripts/check-format
scripts/check-format || echo "check-format: could not measure this tree — advisory, nothing fails on it"

# A NEW CORRECTNESS, SECURITY OR A11Y FINDING FAILS THIS BUILD (ISS-15600).
# svelte-vitals reads the routes and components statically: an `{#each}` with no
# key, an `{@html}` site, an ARIA attribute the element does not allow, an id
# repeated on one route. `svelte-vitals.config.js` turns every other category
# off and sets `failOn: 'warning'`.
#
# ONLY WHAT THIS BRANCH INTRODUCES. `--baseline` analyzes the merge base in a
# temporary worktree and subtracts every finding already there, so the backlog
# on `main` parks nothing; burning it down is separate work. The base is the
# MERGE BASE with a freshly fetched `main`, never `origin/main`: a CI checkout
# names an explicit refspec on every fetch, so its remote-tracking ref is as old
# as the clone, and a baseline against it would charge this branch with every
# finding merged since. On `main` the merge base is the head, so nothing is new.
#
# A BASELINE THAT COULD NOT BE MEASURED IS 75, NEVER A RED. svelte-vitals itself
# answers a failed baseline by reporting the whole backlog, which would park the
# pull request on findings it did not write — so its stderr is read for that
# warning, and an unreachable `main` is the same answer. Exit 2 (the analysis
# did not run) fails the build under `set -e`: "could not check" is not "clean".
#
# A finding that is right as written is suppressed AT THE SITE with a
# `svelte-vitals-disable-next-line <rule-id>` comment, never by dropping this
# step. `npx svelte-vitals explain <rule-id>` says what a rule wants.
git fetch --quiet origin "+refs/heads/main:refs/ci/svelte-vitals-base" ||
  { echo "ci/build.sh: could not fetch main for the svelte-vitals baseline" >&2; exit 75; }
vitals_base=$(git merge-base HEAD refs/ci/svelte-vitals-base) ||
  { echo "ci/build.sh: no merge base with main for the svelte-vitals baseline" >&2; exit 75; }
vitals_err=$(mktemp -t svelte-vitals)
rc=0
npx svelte-vitals --baseline "$vitals_base" --reporter console --no-color --no-animation 2>"$vitals_err" || rc=$?
cat "$vitals_err" >&2
if [ "$rc" -ne 0 ] && grep -q "reporting all findings" "$vitals_err"; then
  echo "ci/build.sh: svelte-vitals could not analyze the baseline $vitals_base on this box" >&2
  exit 75
fi
rm -f "$vitals_err"
[ "$rc" -eq 0 ] || exit "$rc"
ci_report covered "svelte-vitals (new correctness/security/a11y findings vs ${vitals_base:0:12})"

# THE BUILD IS A VERDICT `npm run check` CANNOT GIVE (ISS-868). SvelteKit's
# server-only module guard — browser code importing a module named `server.ts`,
# or anything under a `server/` directory outside `src/routes` — is a vite BUILD
# plugin, so svelte-check is blind to it, as it is to a bad adapter config and
# every other build-only vite failure. Without this step the release is the first thing that
# ever builds the repo, and the leak is found by a `dev deploy` that has already
# tagged and pushed. playbook-admin 0.4.42 is what that looks like: tag pushed,
# nothing deployed.
npm run build
