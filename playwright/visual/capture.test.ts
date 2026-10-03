// dry-copy: visual-parity/capture-test — every copy of this region must match; `dev repo copies` checks it
import type { Page, Request } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import {
  canonicalStyleOrder,
  captureShot,
  HOVER_HOLD_FRAMES,
  KEYBOARD_MODALITY_KEY,
  type FetchedImage,
  hasUnmeasuredImage,
  markUnmeasured,
  measureForeignImage,
  NavigatedAway,
  refuseIfNavigated,
  settle,
  type Shot
} from './capture.ts';

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
  /** How many frames the hover fixed-point check read. */
  hoverReads: number;
  /** Every reload, hydration wait and screenshot, in order. */
  events: ('reload' | 'hydrated' | 'screenshot')[];
  /** Every viewport the page was given, in order, and what had happened by then. */
  resizes: { width: number; height: number; screenshotsBefore: number; statesBefore: number }[];
  /** The fold each target search was told to choose above. */
  folds: { width: number; height: number }[];
  /** Every key pressed, and how many states had been applied by then. */
  keys: { key: string; statesBefore: number }[];
}

/** The viewport every stub page is opened at, which is the fold its targets are chosen above. */
const FOLD = { width: 1280, height: 720 };

/**
 * Whether the page's pointer events were sealed at each moment that matters, so a test can say the
 * raster was taken sealed and that the harness's own pointer moves were not.
 */
interface PointerSeal {
  atScreenshot: boolean[];
  atPointerMove: boolean[];
  sealed: boolean;
}

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

/** The head of a PNG `width` x `height`, which is every byte `imageSize` reads and one more. */
function pngOf(size: { width: number; height: number }): Buffer {
  const head = Buffer.alloc(25);
  head.writeUInt32BE(0x89504e47, 0);
  head.writeUInt32BE(size.width, 16);
  head.writeUInt32BE(size.height, 20);
  return head;
}

/** A request the stub page made, as the image route sees one. */
function requestFrom(page: Page): Request {
  return { frame: () => ({ page: () => page }) } as unknown as Request;
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
  options: {
    chWidth?: () => number;
    interrupt?: Interrupt;
    hoverHolds?: boolean | readonly boolean[];
    faceFailed?: boolean;
    unreachable?: boolean;
    /** Whether the n-th focus comes back matching `:focus-visible`; every one does by default. */
    ring?: (n: number) => boolean;
    /** What the fresh document does on arriving, which is where a foreign image is asked for again. */
    onReload?: (page: Page) => void;
    /** The size of the n-th raster, where it is not the viewport's: a page resized under the shot. */
    rasters?: readonly ({ width: number; height: number } | null)[];
    /** Called at the n-th wait the harness makes, which is where a document can be replaced under it. */
    onWait?: (wait: number) => void;
  } = {}
): { page: Page; journal: Journal; seal: PointerSeal; newDocument: () => void } {
  const journal: Journal = {
    screenshots: 0,
    statesApplied: 0,
    reloads: 0,
    clears: 0,
    hoverReads: 0,
    events: [],
    resizes: [],
    folds: [],
    keys: []
  };
  // One answer per frame the fixed-point check reads, the last one repeating.
  const hoverAnswers = typeof options.hoverHolds === 'boolean' ? [options.hoverHolds] : (options.hoverHolds ?? [true]);
  const seal: PointerSeal = { atScreenshot: [], atPointerMove: [], sealed: false };
  let structureReads = 0;
  let waits = 0;
  let url = SETTLED_URL;
  const mainFrame = {};
  const requestListeners: ((request: Request) => void)[] = [];
  /** A new document asked for by the main frame -- a reload, the dev server's or the harness's own. */
  const newDocument = (): void => {
    const request = { isNavigationRequest: () => true, frame: () => mainFrame } as unknown as Request;
    for (const listener of requestListeners) listener(request);
  };
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
    // The seal is written by the two calls that plant and remove the freeze stylesheet, which name
    // it as their argument; the one that removes it is the one that writes `false`.
    if (typeof arg === 'object' && arg !== null && 'seal' in arg) {
      seal.sealed = !source.includes('false');
      return undefined;
    }
    if (source.includes('scrollWidth')) return { width: 1280, height: 4096 };
    if (source.includes('face.status')) return options.faceFailed ?? false;
    // The stylesheet-order read: a page with no dev-server stylesheets, so nothing is moved.
    if (source.includes('data-vite-dev-id')) return [];
    // The order matters: several of these read a box, and only one of them is the target finder.
    if (source.includes('wantFocus')) {
      journal.statesApplied += 1;
      journal.folds.push((arg as { fold: { width: number; height: number } }).fold);
      if (options.unreachable === true) return { description: 'rect', x: null, y: null };
      return { description: 'rect', x: 10, y: 20, ring: options.ring?.(journal.statesApplied) ?? true };
    }
    if (source.includes('elementFromPoint')) {
      const holds = hoverAnswers[Math.min(journal.hoverReads, hoverAnswers.length - 1)];
      journal.hoverReads += 1;
      // The check answers why it failed, or nothing when it held.
      return holds === true ? null : 'not :hover';
    }
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
    mouse: {
      move: async (): Promise<void> => {
        seal.atPointerMove.push(seal.sealed);
      }
    },
    keyboard: {
      press: async (key: string): Promise<void> => {
        journal.keys.push({ key, statesBefore: journal.statesApplied });
      }
    },
    waitForTimeout: async (): Promise<void> => {
      options.onWait?.(waits);
      waits += 1;
    },
    waitForLoadState: async (): Promise<void> => undefined,
    waitForFunction: async (fn: unknown): Promise<void> => {
      if (String(fn).includes('getElementById')) journal.events.push('hydrated');
    },
    url: (): string => url,
    mainFrame: (): object => mainFrame,
    on: (event: string, listener: (request: Request) => void): void => {
      if (event === 'request') requestListeners.push(listener);
    },
    goto: async (): Promise<void> => {
      newDocument();
    },
    viewportSize: (): { width: number; height: number } => viewport,
    setViewportSize: async (size: { width: number; height: number }): Promise<void> => {
      viewport = { ...size };
      journal.resizes.push({ ...size, screenshotsBefore: journal.screenshots, statesBefore: journal.statesApplied });
    },
    reload: async (): Promise<void> => {
      journal.reloads += 1;
      journal.events.push('reload');
      newDocument();
      options.onReload?.(page as unknown as Page);
    },
    screenshot: async (): Promise<Buffer> => {
      journal.screenshots += 1;
      journal.events.push('screenshot');
      seal.atScreenshot.push(seal.sealed);
      return pngOf(options.rasters?.[journal.screenshots - 1] ?? viewport);
    }
  };
  return { page: page as unknown as Page, journal, seal, newDocument };
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
    expect(journal.hoverReads).toBe(HOVER_HOLD_FRAMES);
  });

  /**
   * ONE READ IS A RACE, NOT A VERDICT. Under load the first read after the settle can land before
   * the browser has re-resolved hover state, so a hover that IS a fixed point reads as broken once
   * (ISS-15877). Only a check that fails on every frame it is read is a hover that cancels itself.
   */
  it('shoots a hover whose fixed-point check fails on its first frames and then holds', async () => {
    const { page, journal } = stubPage([1, 1], { hoverHolds: [false, false, true] });
    expect(taken(await captureShot(page, 'hover', 3)).target).toBe('rect');
    expect(journal.hoverReads).toBe(3);
    expect(journal.screenshots).toBe(1);
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
   * A FOREIGN IMAGE WHOSE SIZE PROBE NEVER ANSWERED IS A FAILED FACE BY ANOTHER NAME (ISS-15866). The
   * request was refused rather than painted, so the document is carrying a broken image the other
   * side of an A/B may not have -- and only a fresh document asks for it again.
   */
  it('reloads and retakes a document that refused a foreign image it could not measure', async () => {
    const { page, journal } = stubPage([1, 1]);
    markUnmeasured(requestFrom(page));
    taken(await captureShot(page, 'rest'));
    expect(journal).toMatchObject({ screenshots: 1, reloads: 1 });
    expect(hasUnmeasuredImage(page)).toBe(false);
  });

  it('drops the shot rather than taking one while every document refuses the image', async () => {
    const { page, journal } = stubPage([1, 1], { onReload: (reloaded) => markUnmeasured(requestFrom(reloaded)) });
    markUnmeasured(requestFrom(page));
    expect(await captureShot(page, 'rest')).toBe('metrics');
    expect(journal.screenshots).toBe(0);
    expect(journal.reloads).toBeGreaterThanOrEqual(2);
  });

  /**
   * A TARGET NO POINT OF WHICH INSIDE THE FOLD HITS ANYTHING HAS NO HOVER STATE TO SHOOT. A target
   * merely covered is not this: the finder hovers whatever covers it, as a chart's plot-wide hit
   * area is its marks' hover.
   */
  it('reports a target with no point inside the fold as unreachable, without shooting it', async () => {
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
   * A SCRIPTED FOCUS DRAWS ITS RING BY THE DOCUMENT'S INPUT HISTORY (ISS-15883). Chromium matches
   * `:focus-visible` on a scripted focus only under keyboard modality, so the same focus shot drew
   * the UA ring on one capture and none on the next. A key goes down immediately before every
   * focus, and never before a hover, where it would be a keypress the page did not ask for.
   */
  it('sets keyboard modality before every focus and never before a hover', async () => {
    const focused = stubPage([1, 1]);
    taken(await captureShot(focused.page, 'focus', 0));
    expect(focused.journal.keys).toEqual([{ key: KEYBOARD_MODALITY_KEY, statesBefore: 0 }]);

    const hovered = stubPage([1, 1]);
    taken(await captureShot(hovered.page, 'hover', 0));
    expect(hovered.journal.keys).toEqual([]);
  });

  it('retakes a focus that came back without its ring on the same document, and shoots the one that has it', async () => {
    const { page, journal } = stubPage([1, 1], { ring: (n) => n > 1 });
    expect(taken(await captureShot(page, 'focus', 0)).target).toBe('rect');
    expect(journal).toMatchObject({ screenshots: 1, statesApplied: 2, reloads: 0, clears: 1 });
    expect(journal.keys.map((press) => press.statesBefore)).toEqual([0, 1]);
  });

  it('never shoots a focus that will not draw its ring', async () => {
    const { page, journal } = stubPage([1, 1], { ring: () => false });
    expect(await captureShot(page, 'focus', 0)).toBe('disturbed');
    expect(journal.screenshots).toBe(0);
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
   * A RELOADED DOCUMENT IS SHOT HYDRATED OR NOT AT ALL. `networkidle` says the modules arrived, not
   * that the root has mounted, and under load a reloaded document was shot as the server rendered it
   * (ISS-15877).
   */
  it('waits for every reloaded document to hydrate before shooting it', async () => {
    const { page, journal } = stubPage([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
    await captureShot(page, 'hover', 3);
    expect(journal.reloads).toBe(2);
    journal.events.forEach((event, at) => {
      if (event === 'reload') expect(journal.events[at + 1]).toBe('hydrated');
    });
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
 * THE POINTER IS SEALED OFF FROM THE PAGE FOR THE LENGTH OF THE RASTER, AND ONLY THEN (ISS-15799).
 *
 * The screenshot's 1x1 viewport transient puts the pointer outside the page, and Chromium tells the
 * page so with `pointerout` and `mouseleave` at a pointer that never moved -- which is what tore the
 * hover-mounted tooltips down. Sealed, the page never hears it. The harness's OWN pointer moves are
 * the inputs a hover shot is made of, so they must never land while the seal is on, and a seal left
 * on after the shot would swallow the move `clearState` makes to take the hover away.
 */
describe('the pointer seal', () => {
  it('takes every raster sealed and lifts the seal before captureShot returns', async () => {
    const { page, seal } = stubPage([1, 1]);
    await captureShot(page, 'hover', 3);
    expect(seal.atScreenshot).toEqual([true]);
    expect(seal.sealed).toBe(false);
  });

  it('puts the hover back unsealed when a disturbed shot is retaken', async () => {
    const { page, seal } = stubPage([1, 2, 3, 3]);
    await captureShot(page, 'hover', 3);
    expect(seal.atScreenshot).toEqual([true, true]);
    // `applyState`'s move onto the target, twice, and `clearState`'s move off it in between.
    expect(seal.atPointerMove).toEqual([false, false, false]);
    expect(seal.sealed).toBe(false);
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
 * A NEW DOCUMENT AT THE SAME URL (ISS-15888).
 *
 * A dev server's full page reload replaces the document and leaves the url alone, and a
 * client-rendered page is then an empty shell for as long as it takes to mount again. Measured on
 * trips' A/A: rest and focus of one context shot as two identical PNGs of the bare viewport, with
 * no focus target. Nothing about the url says so, so the document is counted.
 */
describe('a page whose document is replaced at the same url', () => {
  it('is refused after it settled, though the url never moved', async () => {
    const { page, newDocument } = stubPage([1, 1]);
    expect(await settle(page, SETTLED_URL)).toBe(true);
    expect(() => refuseIfNavigated(page, SETTLED_URL)).not.toThrow();
    newDocument();
    expect(() => refuseIfNavigated(page, SETTLED_URL)).toThrow(NavigatedAway);
  });

  it('refuses the shot taken off the replacement, rather than returning it', async () => {
    const { page, newDocument } = stubPage([1, 1]);
    expect(await settle(page, SETTLED_URL)).toBe(true);
    newDocument();
    await expect(captureShot(page, 'rest')).rejects.toBeInstanceOf(NavigatedAway);
  });

  /** A hover read across a reload finds its target gone, which says nothing about the hover. */
  it('refuses an unstable hover read off a document replaced while it was read', async () => {
    const { page, newDocument } = stubPage([1, 1], { hoverHolds: false });
    expect(await settle(page, SETTLED_URL)).toBe(true);
    const read = captureShot(page, 'hover', 3);
    newDocument();
    await expect(read).rejects.toBeInstanceOf(NavigatedAway);
  });

  it('settles the replacement when the replacement arrives during the settle', async () => {
    let replacer = (): void => undefined;
    const { page, newDocument } = stubPage([1, 1], { onWait: (wait) => wait === 0 && replacer() });
    replacer = newDocument;
    expect(await settle(page, SETTLED_URL)).toBe(true);
    // The document the settle finally answered for is the one the page is on.
    expect(() => refuseIfNavigated(page, SETTLED_URL)).not.toThrow();
  });

  it('gives a page up that is replaced on every settle', async () => {
    let replacer = (): void => undefined;
    const { page, newDocument } = stubPage([1, 1], { onWait: () => replacer() });
    replacer = newDocument;
    expect(await settle(page, SETTLED_URL)).toBe(false);
  });

  it('does not count the reload the harness makes itself', async () => {
    const { page, journal } = stubPage([1, 1]);
    expect(await settle(page, SETTLED_URL)).toBe(true);
    // A refused foreign image, so `captureShot` reloads the document itself before it shoots.
    markUnmeasured(requestFrom(page));
    taken(await captureShot(page, 'rest'));
    expect(journal.reloads).toBe(1);
    expect(() => refuseIfNavigated(page, SETTLED_URL)).not.toThrow();
  });
});

/*
 * THE MANIFEST'S SIZE IS THE PNG'S (ISS-15888).
 *
 * The row's sha is of the png, so its size must be too. A raster that is not the size the document
 * was measured at is of a page that was resized under the shot, and is refused and retaken.
 */
describe('the size of a shot', () => {
  it('is the size of its png, which is the size the document measured', async () => {
    const shot = taken(await captureShot(stubPage([1, 1]).page, 'rest'));
    expect({ width: shot.width, height: shot.height }).toEqual({ width: 1280, height: 4096 });
  });

  it('retakes a raster whose size disagrees with the measured document', async () => {
    const { page, journal } = stubPage([1, 1], { rasters: [{ width: 1280, height: 720 }] });
    const shot = taken(await captureShot(page, 'rest'));
    expect(journal.screenshots).toBe(2);
    expect(shot.height).toBe(4096);
  });

  it('drops the shot, as disturbed, when no raster ever agrees', async () => {
    const { page } = stubPage([1, 1], { rasters: Array.from({ length: 64 }, () => ({ width: 1280, height: 720 })) });
    expect(await captureShot(page, 'rest')).toBe('disturbed');
  });
});
/*
 * WHAT A FOREIGN IMAGE'S SIZE PROBE IS ALLOWED TO CONCLUDE (ISS-15866).
 *
 * The stub is only reproducible if the probe's answer is about the IMAGE. A host that did not
 * answer, or answered 5xx, said something about its own minute -- so it is asked again, and an
 * image it never answers for is never handed to the page to paint.
 */
describe('measureForeignImage', () => {
  /** The first 24 bytes of a 640x480 PNG, which is all `imageSize` reads. */
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]),
    Buffer.from([0, 0, 2, 128, 0, 0, 1, 224, 8])
  ]);
  const ok = (body: Buffer, status = 200): FetchedImage => ({ status, headers: { 'content-type': 'image/png' }, body });
  const noPause = async (): Promise<void> => undefined;

  /** A probe answering `answers` in order, and counting how often it was asked. */
  function probe(answers: readonly (FetchedImage | null)[]): { fetch: () => Promise<FetchedImage | null>; asked: () => number } {
    let asked = 0;
    return {
      fetch: async () => {
        const answer = answers[Math.min(asked, answers.length - 1)] ?? null;
        asked += 1;
        return answer;
      },
      asked: () => asked
    };
  }

  it('measures the image on the first answer', async () => {
    const host = probe([ok(PNG)]);
    expect(await measureForeignImage(host.fetch, noPause)).toEqual({ kind: 'sized', width: 640, height: 480 });
    expect(host.asked()).toBe(1);
  });

  /** The defect: one probe lost to the runner's load used to paint the real photograph. */
  it('asks again when the host did not answer, rather than handing the page the real image', async () => {
    const host = probe([null, ok(Buffer.alloc(0), 503), ok(PNG)]);
    expect(await measureForeignImage(host.fetch, noPause)).toEqual({ kind: 'sized', width: 640, height: 480 });
    expect(host.asked()).toBe(3);
  });

  it('gives up as unreachable when no attempt is answered', async () => {
    const host = probe([null]);
    expect(await measureForeignImage(host.fetch, noPause)).toEqual({ kind: 'unreachable' });
    expect(host.asked()).toBe(3);
  });

  it('serves an answer about the image itself as it came back, without asking again', async () => {
    const missing = probe([ok(Buffer.from('not found'), 404)]);
    expect(await measureForeignImage(missing.fetch, noPause)).toMatchObject({ kind: 'unsized', status: 404 });
    expect(missing.asked()).toBe(1);
    const webp = probe([ok(Buffer.from('RIFF....WEBP'))]);
    expect(await measureForeignImage(webp.fetch, noPause)).toMatchObject({ kind: 'unsized', status: 200 });
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
