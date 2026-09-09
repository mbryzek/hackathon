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
import type { Page } from '@playwright/test';
import {
  captureShot,
  clearState,
  documentSize,
  dumpStyles,
  hoverTargetCount,
  NAVIGATION_ATTEMPTS,
  NavigatedAway,
  refuseIfNavigated,
  SETTLE_ATTEMPTS,
  settledPage,
  themedContext
} from './capture.ts';
import { themedPath } from './pages.ts';
import { paths, sha256, writeFile, writeStyles } from './files.ts';
import { hoverState, shotBudget, shotKey, shotStates, STATES, THEMES, VIEWPORTS } from './matrix.ts';
import type { StateName } from './matrix.ts';
import type { Dropped, ManifestEntry } from './manifest.ts';
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
    /*
     * WHAT THIS PAGE WAS ASKED FOR AND DID NOT PRODUCE, kept apart from `uncovered` and FAILING THE
     * TEST at the bottom of this file (ISS-9985).
     *
     * A PAGE THAT LOSES ONE CONTEXT LOOKS EXACTLY LIKE A PAGE THAT LOST NOTHING, which is the half
     * of this that made the loss quiet: the other five contexts still shoot, so the page still
     * writes a shard, playwright still counts the test as passed, and `merge.ts` still says "29 of
     * 29 pages". The only trace was one more line in a list that already had a hundred benign ones
     * in it. Measured: 8 lost contexts among 114 `uncovered` entries, and 62 shots that then turned
     * up in the compare as present on one side only.
     */
    const dropped: Dropped[] = [];

    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        const context = await themedContext(browser, theme, viewport, plan.baseUrl);
        // `themedPath` and not `page.path`: a repo whose fixture surface reads the theme off the
        // url says so there. Where the theme is the localStorage key `themedContext` writes --
        // every real route, in every repo -- it returns the path unchanged.
        const target = themedPath(page.path, theme);
        const where = `${page.path} ${theme} ${viewport.name}`;
        try {
          // `settledPage` and not `newPage` + `settle`: a context that produced nothing gets a
          // second document at a longer deadline before it is given up on, because the measured
          // cause of a context that will not settle is the runner's load rather than the page
          // (ISS-9985). It closes the page it gave up on, so the `finally` below has nothing of its
          // to clean up.
          let browserPage = await settledPage(context, target);
          if (browserPage === null) {
            dropped.push({
              scope: 'context',
              what: where,
              why: `page never settled in ${SETTLE_ATTEMPTS} attempt(s); no shots taken -- raise VISUAL_SETTLE_TIMEOUT_MS on a loaded machine`
            });
            continue;
          }

          /*
           * WHAT THIS CONTEXT OWES, COUNTED ONCE AND KEPT ACROSS A RE-SETTLE.
           *
           * The count decides the KEY SET, so re-asking a fresh document for it would let one
           * context's key set change half way through the context -- and `owed` and `uncovered`
           * would both be added to twice for one theme and viewport. The first document to answer
           * is the answer.
           */
          const counted = new Map<StateName, { shots: number; total: number }>();

          /*
           * WHAT THIS CONTEXT WAS ASKED FOR AND DID NOT PRODUCE, keyed so a shot is recorded as
           * lost ONCE however many documents this context went through. Folded into `dropped`
           * below.
           */
          const lost = new Map<string, string>();

          /*
           * EVERY SHOT THIS CONTEXT OWES, ONTO A DOCUMENT THAT MUST STILL BE THE ONE IT SETTLED ON.
           *
           * A FUNCTION BECAUSE IT IS RESUMABLE, which is the whole of the repair for a navigation:
           * `NavigatedAway` comes out of the middle of it, the caller settles a fresh document at
           * `target`, and this is called again on that document. A shot already ANSWERED -- written
           * to `entries`, or recorded in `lost` after `captureShot` spent its three documents and
           * twelve retakes on it -- is skipped rather than taken again. Re-rendering a shot that
           * already succeeded is the one retry `playwright.visual.config.ts` forbids outright, and
           * re-running a shot that has already exhausted its own repairs buys nothing but time off
           * the page budget.
           */
          const shoot = async (open: Page, settledAt: string): Promise<void> => {
            for (const state of STATES) {
              /*
               * `hover` IS NOT ONE SHOT. The first eligible element in document order is
               * deterministic -- which is why it was the original target -- and it is almost never
               * the affordance a `hover:` rule is about, because a form puts its decoration before
               * its submit. So the pointer goes on every eligible element inside the viewport in
               * turn, keyed `hover-0`, `hover-1`, ..., capped by `plan.hoverLimit`. `rest` and
               * `focus` stay one shot each. `hoverTargetCount` carries the measurement (ISS-9603).
               */
              let shots = counted.get(state);
              if (shots === undefined) {
                shots = state === 'hover' ? await hoverTargetCount(open, plan.hoverLimit) : { shots: 1, total: 1 };
                counted.set(state, shots);
                if (shots.shots > 1) {
                  // One hover shot per theme and viewport is already in `owed`, because every page
                  // contributes at least that; the rest are what THIS page turned out to offer.
                  owed += shots.shots - 1;
                  testInfo.setTimeout(budgetMs * owed);
                }
                if (shots.total > shots.shots) {
                  uncovered.push([
                    `${where} hover`,
                    `${shots.total} eligible elements, ${shots.shots} captured -- raise VISUAL_HOVER_LIMIT to reach the rest`
                  ]);
                }
              }
              /*
               * A page offering NO hover target still records one shot, targeted `none`, exactly as
               * it did when hover was a single state: the day it grows a button, that is a `target`
               * change on a key both captures hold rather than a new key with nothing to compare.
               */
              for (let index = 0; index < Math.max(shots.shots, 1); index += 1) {
                const key = shotKey(page.slug, theme, viewport.name, state === 'hover' ? hoverState(index) : state);
                if (key in entries || lost.has(key)) continue;
                // ASKED ON BOTH SIDES OF THE SHOT, like `structure` is asked on both sides of the
                // raster and for the same reason: a navigation that destroyed nothing leaves every
                // later read answering happily about a document these keys are not about.
                refuseIfNavigated(open, settledAt);
                // A `ShotFailure` rather than a `Shot` means the page could not be shot in the state
                // it was asked for, three documents running -- either every font-relative length on
                // it would be recorded against fallback metrics, or the screenshot's own viewport
                // transient destroyed the state every time it was applied. The shot is dropped rather
                // than written: a key missing from one side is a compare failure, and a shot recorded
                // on the wrong metrics, or of a state nobody asked for, is a difference the next A/B
                // blames on a stylesheet. WHICH of the two is recorded, because they send whoever
                // reads the manifest to opposite halves of `capture.ts`. See `captureShot`.
                const shot = await captureShot(open, state, index);
                refuseIfNavigated(open, settledAt);
                if (typeof shot === 'string') {
                  lost.set(
                    key,
                    shot === 'metrics'
                      ? 'no document resolved ch against the webfont; shot dropped'
                      : 'every shot of this state was disturbed by its own raster; shot dropped'
                  );
                  await clearState(open);
                  continue;
                }
                /*
                 * EVERY READ OF THE PAGE COMES BACK BEFORE ANYTHING IS WRITTEN, so a navigation
                 * landing between them leaves no half-recorded shot behind: a png on disk with no
                 * manifest row, or a row whose size was read off a document the png is not of.
                 *
                 * The style dump is taken after `captureShot` returns, and `screenshotFrozen` has
                 * put the page back by then -- so the dump still describes the page rather than the
                 * harness.
                 *
                 * ONE ARTEFACT FOLLOWS FROM THAT ORDER, and it is in the diagnostic only: putting the
                 * animations back RESTARTS an `animation-fill-mode: both` entrance, so a
                 * `--audit opacity` run reports a revealing card at 0 on one side and 1 on the other,
                 * in both directions, on shots whose PNGs are identical. The hash is the verdict and
                 * it is taken while the page is frozen; read an opacity difference on a revealing
                 * card as this, not as a stylesheet change.
                 */
                const styles = await dumpStyles(open);
                const size = await documentSize(open);
                writeFile(paths.png(plan.out, key), shot.png);
                writeStyles(plan.out, key, styles);
                entries[key] = { sha256: sha256(shot.png), width: size.width, height: size.height, target: shot.target };
                await clearState(open);
              }
            }
          };

          /*
           * A NAVIGATION COSTS THIS CONTEXT A DOCUMENT, NOT THE PAGE (ISS-10052).
           *
           * The page can leave the route half way through its own capture -- a client-side redirect
           * that lost its race with the settle, or a dev server reloading the document because
           * something regenerated `.svelte-kit` under it. Every read of the page then fails, and
           * left as a throw that failure leaves this test: the shots already taken are orphaned, no
           * shard is written, and `merge.ts` records the whole page as dropped. Measured at five of
           * twenty-nine pages on one run, which is a capture that cannot pass an A/A gate and
           * therefore bought nothing at all.
           *
           * So the repair is a fresh document at `target`, in the SAME context -- which keeps the
           * theme, the viewport, the pinned clock, the cookies and the warm face cache -- and
           * `shoot` picks up at the first shot it has no answer for.
           */
          for (let landing = 0; ; landing += 1) {
            const settledAt = browserPage.url();
            try {
              await shoot(browserPage, settledAt);
              break;
            } catch (error) {
              if (!(error instanceof NavigatedAway)) throw error;
              const taken = Object.keys(entries).filter((key) => key.startsWith(`${page.slug}--${theme}--${viewport.name}--`)).length;
              if (landing + 1 >= NAVIGATION_ATTEMPTS) {
                dropped.push({
                  scope: 'context',
                  what: where,
                  why: `${error.message}, on all ${NAVIGATION_ATTEMPTS} document(s) it was given; ${taken} shot(s) of this context kept, the rest not taken`
                });
                break;
              }
              // The page is where the failure is; the context is what must not be rebuilt. A close
              // that fails has nothing left to clean up, so it must not become the error this
              // context is recorded under.
              await browserPage.close().catch(() => undefined);
              const next = await settledPage(context, target);
              if (next === null) {
                dropped.push({
                  scope: 'context',
                  what: where,
                  why: `${error.message}, and the route would not settle again in ${SETTLE_ATTEMPTS} attempt(s); ${taken} shot(s) of this context kept, the rest not taken`
                });
                break;
              }
              browserPage = next;
              /*
               * A re-settle is work the per-page budget never counted, and the deadline is measured
               * from the start of the test -- so it is restated here exactly as it is when a page
               * turns out to owe more hover shots than the floor. TWO SHOTS' WORTH, because
               * `settledPage` gives a context `VISUAL_SETTLE_TIMEOUT_MS * (1 + 2)` before it gives
               * up, which at the defaults is 90 seconds and is exactly two shot budgets. The shots
               * this document still owes are already in `owed`; only the settle is new.
               */
              owed += 2;
              testInfo.setTimeout(budgetMs * owed);
            }
          }

          for (const [key, why] of lost) dropped.push({ scope: 'shot', what: key, why });
        } finally {
          await context.close();
        }
      }
    }

    /*
     * THE SHARD IS WRITTEN BEFORE THE FAILURE, and the order is the whole of what makes failing
     * safe. Everything this page did shoot is on disk and in `merge.ts`'s roll-up whatever happens
     * on the next line, so a caller still gets a capture directory to look at and a manifest that
     * names what is missing from it -- the failure adds a signal rather than taking the artefacts
     * away.
     */
    writeFile(paths.shard(plan.out, page.slug), JSON.stringify({ entries, uncovered, dropped }, null, 2));

    /*
     * A DROPPED RENDERING FAILS THIS TEST, which is the signal a caller reading the summary
     * actually gets (ISS-9985). The alternative -- recording it and passing -- is what a run
     * reporting "29 passed" over eight lost contexts did, and the number a caller reads is the
     * number they act on. `merge.ts` fails the whole capture again from the merged manifest, for
     * the loss that no test can see: a page whose test died before writing a shard at all.
     */
    if (dropped.length > 0) {
      throw new Error(
        `visual: ${dropped.length} rendering(s) dropped on ${page.path} -- this capture cannot pass an A/A gate:\n` +
          dropped.map((loss) => `  [${loss.scope}] ${loss.what}: ${loss.why}`).join('\n')
      );
    }
  });
}
// dry-copy-end
