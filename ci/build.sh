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

# A HAND-WRITTEN CALL THE GENERATOR ALREADY EMITS FAILS THIS BUILD (ISS-3921).
# A generated client method and a hand-written `fetch` to the same operation are
# one wire contract expressed twice, and only the generated copy moves when the
# spec does — the second drifts silently into a request the backend no longer
# serves. Three repos hand-rolled the same data_url upload that way, each with a
# comment claiming no generated method existed (ISS-3884).
#
# EXIT CODES ARE THE VERDICT: 0 clean, 1 findings, 2 the lint could not look.
# Under `set -e` the last two both fail the build, and that is deliberate — "I
# could not check" must never be reported as "I checked and it is fine". A call
# the generated method genuinely cannot make is suppressed AT THE SITE with a
# `codegen-lint-ignore: <reason>` comment, never by dropping this step.
#
# IT RUNS BEFORE `npm ci` because it is hermetic and takes about a second: it
# reads only committed files — this repo's generated clients and its
# `.api/config.pkl` — so it opens no network connection, needs nothing `npm ci`
# installs, and adds nothing to `# ci-needs:`. `pkl` is the one binary it shells
# out to, and every runner already has it for `api`. The directory is `$PWD` by
# default, which is what makes it correct in a CI checkout whose directory is
# named for the SLUG and names no app.
dev codegen lint-consumers

ci_report covered "dev codegen lint-consumers"

# `npm ci` rather than `npm install`: the lockfile is the contract, and a build
# that silently resolved a different tree than the one committed is a green
# measured on something nobody is merging. It is fast here regardless — the
# download half is served from ~/.npm, which lives outside the checkout and
# survives every clean.
npm ci

# svelte-check + the Playwright tsconfig typecheck + `playwright test --list` +
# eslint --max-warnings 0 + prettier --check + vitest. `npm run check` is the whole
# gate in every SvelteKit repo in this fleet (ISS-3885), so there is deliberately no
# second test step below — running the unit suite twice would double the slowest
# part of this build for the same verdict.
#
# `check:e2e:collect` inside there COLLECTS the Playwright suite without running
# it — it loads playwright.config.ts and every spec, so a spec that fails to
# import is caught here rather than at the next deploy, and it launches no
# browser and starts no `webServer`. That is what makes it safe in CI while
# `npm run test:e2e` below is not.
npm run check

# THE BUILD IS A VERDICT `npm run check` CANNOT GIVE (ISS-868). SvelteKit's
# "$lib/server imported into browser code" guard is a vite BUILD plugin, so
# svelte-check is blind to it — as it is to a bad adapter config and every other
# build-only vite failure. Without this step the release is the first thing that
# ever builds the repo, and the leak is found by a `dev deploy` that has already
# tagged and pushed. playbook-admin 0.4.42 is what that looks like: tag pushed,
# nothing deployed.
npm run build

# Deliberately NOT `npm run test:e2e`, and the reason has CHANGED (ISS-4028).
#
# It used to be that Playwright could not produce a verdict here at all: it needs a live
# `platform`, and the released image would not serve one. That is fixed — `ci/e2e.sh` beside this
# file runs the browser suite against a real backend, and it runs today.
#
# What keeps it out of THIS file is the gate. This script produces the `ci` status the merge lane
# refuses to merge without; `ci/e2e.sh` produces `e2e`, which the lane does not read. These suites
# had never run unattended before, so their flake rate is unmeasured, and an unmeasured flake
# source inside `ci` parks pull requests that did nothing wrong. Moving them in here is a decision
# earned by measured flake data (ISS-2180) — see "The browser suites are the second context" in
# devops/docs/ci.md — and not something to do because the suite has looked fine.
