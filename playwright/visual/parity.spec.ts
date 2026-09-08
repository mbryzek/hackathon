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
import { applyState, clearState, dumpStyles, screenshotFrozen, settle, themedContext } from './capture.ts';
import { themedPath } from './pages.ts';
import { paths, sha256, writeFile, writeStyles } from './files.ts';
import { shotKey, STATES, THEMES, VIEWPORTS } from './matrix.ts';
import type { ManifestEntry } from './manifest.ts';
import { capturePlan } from './plan.ts';

const plan = capturePlan();

test.describe.configure({ mode: 'parallel' });

for (const page of plan.targets) {
  test(`${plan.set} ${page.path}`, async ({ browser }, testInfo) => {
    // A page is six navigations and eighteen full-page screenshots; the default 30s is for a test
    // that does one thing. This budget is generous because a slow page must not silently drop
    // shots -- a missing key is a compare failure, which is the loudest outcome and the right one.
    testInfo.setTimeout(5 * 60_000);

    const entries: Record<string, ManifestEntry> = {};
    const skipped: string[] = [];

    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        const context = await themedContext(browser, theme, viewport, plan.baseUrl);
        try {
          const browserPage = await context.newPage();
          // `themedPath` and not `page.path`: a repo whose fixture surface reads the theme off the
          // url says so there. Where the theme is the localStorage key `themedContext` writes --
          // every real route, in every repo -- it returns the path unchanged.
          if (!(await settle(browserPage, themedPath(page.path, theme)))) {
            skipped.push(`${page.path} ${theme} ${viewport.name}: never reached a quiet state`);
            continue;
          }
          for (const state of STATES) {
            const target = await applyState(browserPage, state);
            const key = shotKey(page.slug, theme, viewport.name, state);
            // `null` means the webfont was not measurable when the shot was due, so every
            // font-relative length on the page would be recorded against fallback metrics. The
            // shot is dropped rather than written: a key missing from one side is a compare
            // failure, and a shot recorded on the wrong metrics is a difference the next A/B
            // blames on a stylesheet. See `awaitMeasurableFont`.
            if (target === null) {
              skipped.push(`${page.path} ${theme} ${viewport.name} ${state}: webfont never became measurable`);
              await clearState(browserPage);
              continue;
            }
            // The style dump BELOW is taken after this returns, and `screenshotFrozen` has put the
            // page back by then -- so the dump still describes the page rather than the harness.
            //
            // ONE ARTEFACT FOLLOWS FROM THAT ORDER, and it is in the diagnostic only: putting the
            // animations back RESTARTS an `animation-fill-mode: both` entrance, so a
            // `--audit opacity` run reports a revealing card at 0 on one side and 1 on the other,
            // in both directions, on shots whose PNGs are identical. The hash is the verdict and it
            // is taken while the page is frozen; read an opacity difference on a revealing card as
            // this, not as a stylesheet change.
            const png = await screenshotFrozen(browserPage);
            writeFile(paths.png(plan.out, key), png);
            writeStyles(plan.out, key, await dumpStyles(browserPage));
            const size = await browserPage.evaluate(() => ({
              width: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight
            }));
            entries[key] = { sha256: sha256(png), width: size.width, height: size.height, target };
            await clearState(browserPage);
          }
        } finally {
          await context.close();
        }
      }
    }

    writeFile(paths.shard(plan.out, page.slug), JSON.stringify({ entries, skipped }, null, 2));
  });
}
// dry-copy-end
