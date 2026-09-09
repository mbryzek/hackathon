// dry-copy: visual-parity/capture-test — every copy of this region must match; `dev repo copies` checks it
import type { Page } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import { captureShot, type Shot } from './capture.ts';

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
function stubPage(structures: readonly number[], options: { chWidth?: () => number } = {}): { page: Page; journal: Journal } {
  const journal: Journal = { screenshots: 0, statesApplied: 0, reloads: 0, clears: 0 };
  let structureReads = 0;
  const chWidth = options.chWidth ?? ((): number => 56);

  const evaluate = async (fn: unknown): Promise<unknown> => {
    const source = String(fn);
    // The order matters: several of these read a box, and only one of them is the target finder.
    if (source.includes('wantFocus')) {
      journal.statesApplied += 1;
      return { description: 'rect', x: 10, y: 20 };
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
    mouse: { move: async (): Promise<void> => undefined },
    waitForTimeout: async (): Promise<void> => undefined,
    waitForLoadState: async (): Promise<void> => undefined,
    url: (): string => 'http://localhost/x',
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
    expect(journal).toEqual({ screenshots: 1, statesApplied: 1, reloads: 0, clears: 0 });
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
// dry-copy-end
