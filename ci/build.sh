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

# `npm ci` rather than `npm install`: the lockfile is the contract, and a build
# that silently resolved a different tree than the one committed is a green
# measured on something nobody is merging. It is fast here regardless — the
# download half is served from ~/.npm, which lives outside the checkout and
# survives every clean.
npm ci

# svelte-check + the Playwright tsconfig typecheck + `playwright test --list` +
# eslint + prettier --check.
#
# `check:e2e:collect` inside there COLLECTS the Playwright suite without running
# it — it loads playwright.config.ts and every spec, so a spec that fails to
# import is caught here rather than at the next deploy, and it launches no
# browser and starts no `webServer`. That is what makes it safe in CI while
# `npm run test:e2e` below is not.
npm run check

npm run test:unit

# THE BUILD IS A VERDICT `npm run check` CANNOT GIVE (ISS-868). SvelteKit's
# "$lib/server imported into browser code" guard is a vite BUILD plugin, so
# svelte-check is blind to it — as it is to a bad adapter config and every other
# build-only vite failure. Without this step the release is the first thing that
# ever builds the repo, and the leak is found by a `dev deploy` that has already
# tagged and pushed. playbook-admin 0.4.42 is what that looks like: tag pushed,
# nothing deployed.
npm run build

# Deliberately NOT `npm run test:e2e`. Playwright needs a live backend here, so
# it cannot produce a verdict in CI — and a suite that is red for an
# infrastructure reason is worse than no suite, because the lane cannot tell it
# apart from a real failure.
