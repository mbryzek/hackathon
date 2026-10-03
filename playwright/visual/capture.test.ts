// dry-copy: visual-parity/capture-test — every copy of this region must match; `dev repo copies` checks it
import type { Page } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import { canonicalStyleOrder, captureShot, documentSize, NavigatedAway, refuseIfNavigated, type Shot } from './capture.ts';

/*
 * WHAT A SHOT DOES WHEN THE PAGE MOVES UNDER IT (ISS-9986).
 *
 * `captureShot` is the one part of the harness that decides anything: it holds the two repairs for
 * the two ways a shot can come back unusable, and they are OPPOSITE ACTS. A page carrying a `ch`
 * resolved against a face it no longer has needs a FRESH DOCUMENT and nothing else will do. A page
 * whose state was destroyed by its own screenshot needs the STATE PUT BACK on the document that is
 * already there, and reloading for it costs a navigation and lands back in the same coin flip.
 * Getting that pair the wrong way round is invisible in a capture -- it just comes back slower, or
 * with shots missing -- so it is asserted here rather than left to a reading of the code.
 *
 * THE PAGE IS A STUB AND ITS `evaluate` DISPATCHES ON WHAT IT WAS ASKED, not on how many times it
 * has been called. Everything `captureShot` reaches goes through `page.evaluate` with a different
 * function each time, so matching a phrase out of each one is what keeps this test readable when
 * the order of those calls changes -- which it does, and should be free to.
 */

/** `captureShot`'s success arm, so a test asserting on the shot says what went wrong when it failed. */
function taken(result: Shot | string): Shot {
  if (typeof result === 'string') throw new Error(`expected a shot, got the failure "${result}"`);
  return result;
}

/** What the stub page was asked to do, so a test can say how a shot was repaired and not just that it was. */
interface Journal {
  screenshots: number;
  statesApplied: number;
  reloads: number;
  clears: number;
  /** Every viewport the page was given, in order, and what had happened by then. */
  resizes: { width: number; height: number; screenshotsBefore: number; statesBefore: number }[];
  /** The fold each target search was told to choose above. */
  folds: { width: number; height: number }[];
}

/** The viewport every stub page is opened at, which is the fold its targets are chosen above. */
const FOLD = { width: 1280, height: 720 };

/** Where the stub page believes it is until something moves it. */
const SETTLED_URL = 'http://localhost/x';

/**
 * PLAYWRIGHT'S OWN WORDS for a context that went away under a call, quoted rather than paraphrased.
 *
 * The harness has nothing else to go on -- these failures are not typed -- so the phrase IS the
 * interface, and a test that invented its own wording would pass while the harness went on losing
 * pages to the real one (ISS-10052).
 */
const DESTROYED = 'page.evaluate: Execution context was destroyed, most likely because of a navigation';

/** One call the stub page refuses to answer, standing for whatever took the document away. */
interface Interrupt {
  /** A phrase out of the page function that must not be answered. */
  source: string;
  /** What the call fails with. */
  message: string;
  /** Where the page turns out to be afterwards, when the interruption was a navigation. */
  to?: string;
}

/**
 * A page that answers everything `captureShot` asks, and reports its structure as `structures[n]`
 * for the n-th time it is asked.
 *
 * `structures` IS THE WHOLE INPUT. `screenshotFrozen` reads it either side of the raster, so a
 * pair of equal readings is a shot that survived and a pair of different ones is a shot the
 * screenshot's own viewport transient disturbed. `[1, 1]` is one clean shot; `[1, 2, 3, 3]` is one
 * disturbed shot followed by a clean one.
 */
function stubPage(
  structures: readonly number[],
  options: { chWidth?: () => number; interrupt?: Interrupt; hoverHolds?: boolean; faceFailed?: boolean; unreachable?: boolean } = {}
): { page: Page; journal: Journal } {
  const journal: Journal = { screenshots: 0, statesApplied: 0, reloads: 0, clears: 0, resizes: [], folds: [] };
  let structureReads = 0;
  let url = SETTLED_URL;
  let viewport = { ...FOLD };
  const chWidth = options.chWidth ?? ((): number => 56);

  const evaluate = async (fn: unknown, arg?: unknown): Promise<unknown> => {
    const source = String(fn);
    // The interruption goes FIRST, because what it stands for is the document going away: whatever
    // this call was about, it is not going to be answered.
    if (options.interrupt !== undefined && source.includes(options.interrupt.source)) {
      if (options.interrupt.to !== undefined) url = options.interrupt.to;
      throw new Error(options.interrupt.message);
    }
    if (source.includes('scrollWidth')) return { width: 1280, height: 4096 };
    if (source.includes('face.status')) return options.faceFailed ?? false;
    // The stylesheet-order read: a page with no dev-server stylesheets, so nothing is moved.
    if (source.includes('data-vite-dev-id')) return [];
    // The order matters: several of these read a box, and only one of them is the target finder.
    if (source.includes('wantFocus')) {
      journal.statesApplied += 1;
      journal.folds.push((arg as { fold: { width: number; height: number } }).fold);
      return options.unreachable === true ? { description: 'rect', x: null, y: null } : { description: 'rect', x: 10, y: 20 };
    }
    if (source.includes('elementFromPoint')) return options.hoverHolds ?? true;
    if (source.includes('cssText')) return { width: chWidth(), em: 1 };
    if (source.includes('getElementById') && source.includes('getComputedStyle')) return { width: chWidth(), em: 1 };
    if (source.includes('tagName')) {
      const at = Math.min(structureReads, structures.length - 1);
      structureReads += 1;
      return structures[at];
    }
    if (source.includes('activeElement')) {
      journal.clears += 1;
      return undefined;
    }
    return undefined;
  };

  const page = {
    evaluate,
    mouse: { move: async (): Promise<void> => undefined },
    waitForTimeout: async (): Promise<void> => undefined,
    waitForLoadState: async (): Promise<void> => undefined,
    waitForFunction: async (): Promise<void> => undefined,
    url: (): string => url,
    viewportSize: (): { width: number; height: number } => viewport,
    setViewportSize: async (size: { width: number; height: number }): Promise<void> => {
      viewport = { ...size };
      journal.resizes.push({ ...size, screenshotsBefore: journal.screenshots, statesBefore: journal.statesApplied });
    },
    reload: async (): Promise<void> => {
      journal.reloads += 1;
    },
    screenshot: async (): Promise<Buffer> => {
      journal.screenshots += 1;
      return Buffer.from('png');
    }
  };
  return { page: page as unknown as Page, journal };
}

describe('captureShot', () => {
  it('takes one screenshot when the document does not move across the raster', async () => {
    const { page, journal } = stubPage([1, 1]);
    expect(taken(await captureShot(page, 'hover', 3)).target).toBe('rect');
    expect(journal).toMatchObject({ screenshots: 1, statesApplied: 1, reloads: 0, clears: 0 });
  });

  /**
   * THE RESIZE COMES BEFORE THE STATE. A full-page screenshot of a document taller than the
   * viewport re-lays the page out at the document's size for the raster, and every one of those
   * layouts re-decides what is under the pointer -- so a hover applied first is lost to the shot.
   * Giving the page its document's size while it is at rest is what leaves the raster nothing to
   * resize.
   */
  it('gives the page its document size before the state is applied, so the raster has nothing to resize', async () => {
    const { page, journal } = stubPage([1, 1]);
    taken(await captureShot(page, 'hover', 3));
    // The stub's document is 1280x4096 against a 1280x720 fold.
    expect(journal.resizes).toContainEqual({ width: 1280, height: 4096, screenshotsBefore: 0, statesBefore: 0 });
    expect(page.viewportSize()).toEqual({ width: 1280, height: 4096 });
  });

  /**
   * A DOCUMENT SHRUNK BACK TO THE FOLD DOES NOT ANSWER HONESTLY FOR SEVERAL FRAMES -- an element laid
   * out against `100dvh` keeps the old height -- so the size is read once, on a page that has never
   * been resized, and every later shot of that page is taken at it.
   */
  it('measures the document once, at the fold, and does not shrink the page back for the next shot', async () => {
    const { page, journal } = stubPage([1, 1, 1, 1]);
    taken(await captureShot(page, 'rest'));
    taken(await captureShot(page, 'hover', 2));
    expect(journal.resizes.map(({ width, height }) => ({ width, height }))).toEqual([{ width: 1280, height: 4096 }]);
  });

  /**
   * AND THE TARGET IS STILL CHOSEN ABOVE THE FOLD the page was opened at. Once the viewport is the
   * whole document, `window.innerHeight` is the whole document too, and testing against it would
   * put the pointer on elements a visitor has to scroll to.
   */
  it('chooses the target above the fold the page was opened at, not the fitted viewport', async () => {
    const { page, journal } = stubPage([1, 1, 1, 1]);
    taken(await captureShot(page, 'hover', 3));
    taken(await captureShot(page, 'hover', 4));
    expect(journal.folds).toEqual([FOLD, FOLD]);
  });

  /**
   * A HOVER THAT IS NOT A FIXED POINT IS AN ANSWER, NOT A FAILURE TO RETRY. A `hover:` rule that
   * moves its own target out from under the pointer alternates between two layouts for as long as
   * the pointer stays there, and which one a raster catches is timing. Neither a retake nor a
   * reload changes that, so neither may be spent on it, and nothing may be shot.
   */
  it('reports a hover that moves its target out from under the pointer as unstable, without shooting it', async () => {
    const { page, journal } = stubPage([1, 1], { hoverHolds: false });
    expect(await captureShot(page, 'hover', 3)).toBe('unstable');
    expect(journal.screenshots).toBe(0);
    expect(journal.reloads).toBe(0);
    expect(journal.statesApplied).toBe(1);
  });

  /**
   * A WEBFONT THAT FAILED TO ARRIVE IS NOT A MOMENTARY GAP. The document does not fetch the face
   * again and lays the text out on the fallback, whose `0` glyph the `ch` probe measures as happily
   * as the real one's -- so the only repair is a fresh document, and the shot must never be taken
   * on the fallback in the meantime.
   */
  it('reloads rather than shooting a document whose webfont failed to load', async () => {
    const { page, journal } = stubPage([1, 1, 1, 1, 1, 1], { faceFailed: true });
    expect(await captureShot(page, 'rest')).toBe('metrics');
    expect(journal.screenshots).toBe(0);
    expect(journal.reloads).toBeGreaterThanOrEqual(2);
  });

  /**
   * A TARGET THE POINTER CANNOT LAND ON HAS NO HOVER STATE TO SHOOT. Sending the pointer to the
   * centre of its box anyway hovers whatever is there instead -- the hole of a donut, the gap
   * between a wrapped link's lines -- and files that under this element's key.
   */
  it('reports a target no point of which is under the pointer as unreachable, without shooting it', async () => {
    const { page, journal } = stubPage([1, 1], { unreachable: true });
    expect(await captureShot(page, 'hover', 3)).toBe('unreachable');
    expect(journal.screenshots).toBe(0);
    expect(journal.reloads).toBe(0);
  });

  it('does not ask a focus state whether the pointer holds it', async () => {
    const { page } = stubPage([1, 1], { hoverHolds: false });
    expect(taken(await captureShot(page, 'focus', 0)).target).toBe('rect');
  });

  /**
   * The defect. A full-page screenshot resizes the viewport, the app loses the pointer and tears
   * its hover-mounted node down, and the png that comes back is of a page in a state nobody asked
   * for -- so it must not be recorded under that key.
   */
  it('retakes a shot whose document changed across its own raster', async () => {
    const { page, journal } = stubPage([1, 2, 3, 3]);
    expect(taken(await captureShot(page, 'hover', 3)).target).toBe('rect');
    expect(journal.screenshots).toBe(2);
    expect(journal.reloads).toBe(0);
  });

  /**
   * RE-APPLYING IS THE WHOLE REPAIR. Once a hover-mounted node has been torn down the pointer never
   * moves again, so a second screenshot of the same page is a second screenshot of the torn-down
   * state -- measured directly, eight consecutive shots of one hovered chart band with the bubble
   * gone from the fourth onward. The retake therefore clears the state and applies it again.
   */
  it('puts the state back before retaking rather than shooting the same page twice', async () => {
    const { page, journal } = stubPage([1, 2, 3, 3]);
    await captureShot(page, 'hover', 3);
    expect(journal.statesApplied).toBe(2);
    expect(journal.clears).toBe(1);
  });

  it('reloads only after the retakes on one document are spent', async () => {
    // Every reading differs from the one before it, so every shot is disturbed and none survives.
    const { page, journal } = stubPage([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
    // The REASON comes back, not a bare failure: `parity.spec.ts` writes it into the manifest, and
    // `disturbed` and `metrics` send whoever reads that to opposite halves of `capture.ts`.
    expect(await captureShot(page, 'hover', 3)).toBe('disturbed');
    expect(journal.reloads).toBe(2);
    expect(journal.screenshots).toBe(journal.statesApplied);
    expect(journal.screenshots).toBeGreaterThan(3);
  });

  /**
   * The other repair, and the reason the two failures are told apart at all: a `ch` is resolved at
   * layout and kept, so a document carrying a resolution it cannot reproduce is not repaired by
   * anything done to it. Retaking on that document would be pure waste, so it must not happen.
   */
  it('reloads without retaking when the page cannot be shot on metrics it can reproduce', async () => {
    let reads = 0;
    // A fresh `100ch` box measuring exactly 50em is what CSS says `ch` means with no face to
    // measure, which is the reading `metrics` calls `no-face` and gives up on.
    const { page, journal } = stubPage([1, 1, 1, 1, 1, 1, 1, 1], {
      chWidth: () => {
        reads += 1;
        return 50;
      }
    });
    expect(await captureShot(page, 'hover', 3)).toBe('metrics');
    expect(reads).toBeGreaterThan(0);
    expect(journal.screenshots).toBe(0);
    expect(journal.reloads).toBe(2);
  });
});

/*
 * WHAT HAPPENS WHEN THE PAGE LEAVES THE ROUTE MID-CAPTURE (ISS-10052).
 *
 * The document can go away under any read of the page -- a client-side redirect that lost its race
 * with the settle, or a dev server reloading because something regenerated `.svelte-kit` while a
 * capture was in flight. Playwright reports that as an ordinary failure of whichever call was in
 * flight, and left as a throw it leaves the TEST: every shot the page had already written is
 * orphaned, no shard is written, and the whole page is recorded as dropped. Measured at five of
 * twenty-nine pages on one run, three call sites deep.
 *
 * So it is reported as `NavigatedAway`, which is the one condition `parity.spec.ts` repairs by
 * settling a fresh document at the route it was asked for. The two properties asserted here are the
 * ones the repair leans on: that the condition is RECOGNISED wherever it lands, and that nothing
 * else is mistaken for it.
 */
describe('a page that navigates under the harness', () => {
  it('reports a context destroyed inside the shot as NavigatedAway, naming where the document went', async () => {
    // `Math.imul` is `structure`'s alone, so the document goes away between the raster and the
    // reading that would have said whether the shot survived it.
    const { page, journal } = stubPage([1, 1], { interrupt: { source: 'Math.imul', message: DESTROYED, to: 'http://localhost/login' } });
    const raised = await captureShot(page, 'hover', 3).then(
      () => null,
      (error: unknown) => error
    );
    expect(raised).toBeInstanceOf(NavigatedAway);
    expect((raised as NavigatedAway).from).toBe(SETTLED_URL);
    expect((raised as NavigatedAway).to).toBe('http://localhost/login');
    // A RELOAD IS THE WRONG REPAIR AND MUST NOT BE SPENT ON IT: reloading a page that has navigated
    // reloads the page it navigated TO, so every shot after it would be filed under this route's
    // keys while depicting another document. Only the caller knows the route.
    expect(journal.reloads).toBe(0);
  });

  it('reports the same condition reached through the font load, which is a different call site', async () => {
    // `document.fonts` is `loadDeclaredFaces`, which `screenshotFrozen` reaches before the raster.
    const { page } = stubPage([1, 1], { interrupt: { source: 'document.fonts', message: DESTROYED, to: 'http://localhost/login' } });
    await expect(captureShot(page, 'hover', 3)).rejects.toBeInstanceOf(NavigatedAway);
  });

  it('reports the diagnostic size read the same way, so a diagnostic cannot cost a page', async () => {
    const { page } = stubPage([1, 1], { interrupt: { source: 'scrollWidth', message: DESTROYED, to: 'http://localhost/login' } });
    await expect(documentSize(page)).rejects.toBeInstanceOf(NavigatedAway);
  });

  it('answers the size read normally when nothing takes the document away', async () => {
    const { page } = stubPage([1, 1]);
    expect(await documentSize(page)).toEqual({ width: 1280, height: 4096 });
  });

  /**
   * THE NARROWNESS IS THE POINT. `NavigatedAway` means "settle this route again", so anything else
   * mistaken for it becomes a re-settle loop over a failure re-settling cannot touch -- a closed
   * browser, a page function that throws -- and the real reason never reaches the manifest.
   */
  it('lets a failure that is not a navigation through as itself', async () => {
    const { page } = stubPage([1, 1], {
      interrupt: { source: 'Math.imul', message: 'page.evaluate: ReferenceError: renderChart is not defined' }
    });
    const raised = await captureShot(page, 'hover', 3).then(
      () => null,
      (error: unknown) => error
    );
    expect(raised).not.toBeInstanceOf(NavigatedAway);
    expect((raised as Error).message).toContain('renderChart is not defined');
  });
});

/*
 * THE HALF THAT DESTROYS NOTHING, and the reason `page.url()` is read at all.
 *
 * A navigation that lands in a gap between two of the harness's own calls throws nothing: the next
 * read answers happily, about the new document. Every remaining shot of that context is then filed
 * under this route's keys while depicting another page -- which is worse than the loud failure,
 * because the compare blames it on a stylesheet.
 */
describe('refuseIfNavigated', () => {
  it('says nothing while the page is still on the url its context settled on', () => {
    const { page } = stubPage([1, 1]);
    expect(() => refuseIfNavigated(page, SETTLED_URL)).not.toThrow();
  });

  it('raises NavigatedAway for a document that was replaced without failing anything', () => {
    const { page } = stubPage([1, 1]);
    expect(() => refuseIfNavigated(page, 'http://localhost/members')).toThrow(NavigatedAway);
  });
});
/*
 * THE ORDER THE DEV SERVER'S STYLESHEETS ARE PUT IN (ISS-15642).
 *
 * Vite's dev client appends each stylesheet when its module evaluates, so the order is the
 * runner's timing -- and wherever a global rule and a component rule tie on specificity, the order
 * IS the cascade. These pin the one order every capture is shot in, whatever order it arrived in.
 */
describe('canonicalStyleOrder', () => {
  const APP = '/r/src/app.css';
  const FONT = '/r/node_modules/@fontsource/x/index.css';
  const LAYOUT = '/r/src/routes/+layout.svelte?svelte&type=style&lang.css';
  const PAGE = '/r/src/routes/x/+page.svelte?svelte&type=style&lang.css';

  it('puts the plain stylesheets ahead of every component style, as a production build links them', () => {
    expect(canonicalStyleOrder([PAGE, APP, LAYOUT, FONT])).toEqual([FONT, APP, LAYOUT, PAGE]);
  });

  /** The defect: the same four sheets, arriving in the two orders one runner produced under load. */
  it('answers the same order for every order the sheets can arrive in', () => {
    expect(canonicalStyleOrder([LAYOUT, FONT, APP, PAGE])).toEqual(canonicalStyleOrder([PAGE, APP, FONT, LAYOUT]));
  });

  it('leaves a page with no dev-server stylesheets alone', () => {
    expect(canonicalStyleOrder([])).toEqual([]);
  });
});
// dry-copy-end
