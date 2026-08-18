#!/usr/bin/env bash
#
# What CI runs for hackathon's BROWSER suite (ISS-4028, following the playbook-admin pilot in
# ISS-2193).
#
# THIS IS A SECOND, SEPARATE ENROLMENT FROM `ci/build.sh`, and the separation is the whole design.
# `ci/build.sh` produces the `ci` status the merge lane gates on; this file produces the `e2e`
# status, which the lane does not read. So a red here parks nothing and merges nothing — it files
# an issue. That is deliberate and it is the first step of a three-step rollout written down in
# devops/docs/ci.md: post-merge on `main` only, then a non-gating `e2e` context on pull requests,
# then — only if measured flake data earns it — inside `ci`. This fleet's green rate does not have
# room for an unmeasured flake source inside the gate.
#
# WHY THIS SUITE COULD NOT RUN BEFORE, in one line: every spec here needs a live `platform`, and
# the released image would not serve one, because the fixture endpoints and the
# `X-Bypass-Rate-Limit` header all gate on Play's runtime mode and a distribution is always
# `Mode.Prod`. ISS-2192 made the mode a startup parameter and `dev e2e run` stands the resulting
# container up; this file is what enrols the suite here.
#
# `# ci-needs:` IS READ BY THE PREFLIGHT at the sha being built, so a dependency added here has to
# be added there in the same commit. This build needs all three: `docker` for the backend
# container, `registry` for the DigitalOcean credential that pulls its image, and `database` for
# the session database that backs it — none of which `ci/build.sh` beside it needs.
#
# `heap:4G` IS MEMORY PER SLOT, NOT AN SBT HEAP. There is no JVM in this repo's own build; the
# number is the scheduler's admission test (Agent::Heap), and what it is admitting is the four
# processes this build runs at once — the emulated platform JVM, Chromium, vite and Postgres. It
# is `Agent::Heap::MIN_GB`, the least any runner in this fleet hands a build, so it excludes no
# machine; what it buys is the difference between "measured, and it fits anywhere" and an
# omission, which is indistinguishable from nobody having looked.
#
# ci-needs: docker, registry, database, heap:4G
set -euo pipefail

echo "e2e ${CI_REPO:-hackathon} @ ${CI_SHA:-working tree} (${CI_EVENT:-local})"

npm ci

# The BROWSER, which is not in node_modules. From the repo's OWN playwright, never a global one:
# the browser build is pinned per `playwright-core` version and a mismatch fails at launch with
# `Executable doesn't exist at .../chromium_headless_shell-<rev>` (ISS-780). Chromium only — the
# one project this config defines.
npx playwright install chromium

# THE WHOLE LIFECYCLE, and the teardown is inside it rather than in a `trap` here: ports, the
# session database and the container are machine-wide state, and all three leak if this script is
# killed between two lines of its own. See devops/lib/e2e.rb.
#
# `--frontend hackathon` names the TENANT ID this repo serves (a key of platform's
# `TenantHosts.DefaultDevFrontendUrls`), so this build's allocated vite port is pointed at that
# one tenant and the other ten are left on their defaults.
exec dev e2e run --app platform --frontend hackathon -- npm run test:e2e
