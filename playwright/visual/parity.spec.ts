/**
 * THE CAPTURE (ISS-9319, copied under ISS-9325). One test per page; one shot per theme, viewport
 * and state.
 *
 * NOTHING HERE ASSERTS ANYTHING, and that is the design rather than an omission. A capture's job
 * is to write down what the browser drew; the verdict is `npm run visual:compare` over two capture
 * directories, and it lives outside this file because the two things being compared are produced
 * by two different checkouts and cannot both be in one playwright run. A spec that asserted
 * against committed golden PNGs instead would be the usual snapshot suite — and would answer the
 * wrong question, because a golden file is a claim about what the app SHOULD look like, and
 * this harness is only ever asked whether it looks like it did an hour ago.
 *
 * ONE TEST PER PAGE, so the six contexts a page needs are created and closed inside it and
 * playwright's own workers give the parallelism. Sharded output for the same reason: several
 * workers writing one manifest is a lost-update race that would silently drop shots, which is
 * exactly the failure `compareManifests` treats as fatal. Each test writes its own shard;
 * `merge.ts` folds them into `manifest.json` after the run.
 */
// dry-copy: visual-parity/parity-spec — every copy of this region must match; `dev repo copies` checks it
import { test } from '@playwright/test';
import { captureShot, clearState, dumpStyles, hoverTargetCount, settle, themedContext } from './capture.ts';
import { themedPath } from './pages.ts';
import { paths, sha256, writeFile, writeStyles } from './files.ts';
import { hoverState, shotBudget, shotKey, shotStates, STATES, THEMES, VIEWPORTS } from './matrix.ts';
import type { ManifestEntry } from './manifest.ts';
import { capturePlan } from './plan.ts';

const plan = capturePlan();

test.describe.configure({ mode: 'parallel' });

for (const page of plan.targets) {
  test(`${plan.set} ${page.path}`, async ({ browser }, testInfo) => {
    /*
     * THE BUDGET IS PER SHOT, AND IT GROWS AS THE PAGE SAYS WHAT IT OWES (ISS-9957).
     *
     * A page is six navigations and eighteen full-page screenshots at the very least, and up to
     * `2 + VISUAL_HOVER_LIMIT` shots per theme and viewport wherever it offers that many hover
     * targets -- so what one test does varies by nearly three to one across a single set. A
     * per-page constant is therefore two different budgets depending on which page draws it, and
     * the fixed five minutes this replaced was not enough for the largest page in playbook-app's
     * own preview set even on an idle machine: forty-eight shots, ten minutes. On a shared runner
     * the pages lost to it were a different set on every run and always the hover-rich ones, and a
     * capture missing any page cannot pass the A/A gate the README puts before every verdict -- so
     * a run that dropped two pages out of twenty-nine was worth as much as one that dropped all of
     * them, which is nothing.
     *
     * `owed` starts at the fewest shots the matrix can ask for and is raised each time
     * `hoverTargetCount` says one theme/viewport will contribute more than that. The timeout is
     * set AGAIN on every raise because playwright measures the deadline from the start of the
     * test rather than from the call, so re-stating the total is what extends it.
     */
    const budgetMs = shotBudget(process.env['VISUAL_SHOT_BUDGET_MS']);
    let owed = THEMES.length * VIEWPORTS.length * shotStates(1).length;
    testInfo.setTimeout(budgetMs * owed);

    const entries: Record<string, ManifestEntry> = {};
    const uncovered: [string, string][] = [];

    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        const context = await themedContext(browser, theme, viewport, plan.baseUrl);
        try {
          const browserPage = await context.newPage();
          // `themedPath` and not `page.path`: a repo whose fixture surface reads the theme off the
          // url says so there. Where the theme is the localStorage key `themedContext` writes --
          // every real route, in every repo -- it returns the path unchanged.
          if (!(await settle(browserPage, themedPath(page.path, theme)))) {
            uncovered.push([`${page.path} ${theme} ${viewport.name}`, 'page never settled; no shots taken']);
            continue;
          }
          for (const state of STATES) {
            /*
             * `hover` IS NOT ONE SHOT. The first eligible element in document order is
             * deterministic -- which is why it was the original target -- and it is almost never
             * the affordance a `hover:` rule is about, because a form puts its decoration before
             * its submit. So the pointer goes on every eligible element inside the viewport in
             * turn, keyed `hover-0`, `hover-1`, ..., capped by `plan.hoverLimit`. `rest` and
             * `focus` stay one shot each. `hoverTargetCount` carries the measurement (ISS-9603).
             */
            const counted = state === 'hover' ? await hoverTargetCount(browserPage, plan.hoverLimit) : { shots: 1, total: 1 };
            if (counted.shots > 1) {
              // One hover shot per theme and viewport is already in `owed`, because every page
              // contributes at least that; the rest are what THIS page turned out to offer.
              owed += counted.shots - 1;
              testInfo.setTimeout(budgetMs * owed);
            }
            if (counted.total > counted.shots) {
              uncovered.push([
                `${page.path} ${theme} ${viewport.name} hover`,
                `${counted.total} eligible elements, ${counted.shots} captured -- raise VISUAL_HOVER_LIMIT to reach the rest`
              ]);
            }
            /*
             * A page offering NO hover target still records one shot, targeted `none`, exactly as
             * it did when hover was a single state: the day it grows a button, that is a `target`
             * change on a key both captures hold rather than a new key with nothing to compare.
             */
            for (let index = 0; index < Math.max(counted.shots, 1); index += 1) {
              const key = shotKey(page.slug, theme, viewport.name, state === 'hover' ? hoverState(index) : state);
              // `null` means the page could not be shot on font metrics it can reproduce, three
              // documents running -- so every font-relative length on it would be recorded against
              // fallback metrics. The shot is dropped rather than written: a key missing from one
              // side is a compare failure, and a shot recorded on the wrong metrics is a difference
              // the next A/B blames on a stylesheet. See `captureShot`.
              //
              // The style dump BELOW is taken after it returns, and `screenshotFrozen` has put the
              // page back by then -- so the dump still describes the page rather than the harness.
              //
              // ONE ARTEFACT FOLLOWS FROM THAT ORDER, and it is in the diagnostic only: putting the
              // animations back RESTARTS an `animation-fill-mode: both` entrance, so a
              // `--audit opacity` run reports a revealing card at 0 on one side and 1 on the other,
              // in both directions, on shots whose PNGs are identical. The hash is the verdict and
              // it is taken while the page is frozen; read an opacity difference on a revealing
              // card as this, not as a stylesheet change.
              const shot = await captureShot(browserPage, state, index);
              if (shot === null) {
                uncovered.push([key, 'no document resolved ch against the webfont; shot dropped']);
                await clearState(browserPage);
                continue;
              }
              writeFile(paths.png(plan.out, key), shot.png);
              writeStyles(plan.out, key, await dumpStyles(browserPage));
              const size = await browserPage.evaluate(() => ({
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight
              }));
              entries[key] = { sha256: sha256(shot.png), width: size.width, height: size.height, target: shot.target };
              await clearState(browserPage);
            }
          }
        } finally {
          await context.close();
        }
      }
    }

    writeFile(paths.shard(plan.out, page.slug), JSON.stringify({ entries, uncovered }, null, 2));
  });
}
// dry-copy-end
