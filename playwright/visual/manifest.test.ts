// dry-copy: visual-parity/manifest-test — every copy of this region must match; `dev repo copies` checks it
import { describe, expect, it } from 'vitest';
import {
  compareManifests,
  complete,
  passes,
  scopeToSelection,
  summarize,
  type Dropped,
  type Manifest,
  type ManifestEntry
} from './manifest.ts';
import type { Selection } from './matrix.ts';

function entry(sha256: string): ManifestEntry {
  return { sha256, width: 1920, height: 900, target: 'n/a' };
}

function manifest(entries: Record<string, ManifestEntry>, dropped: Dropped[] = [], selection: Selection | null = null): Manifest {
  return {
    set: 'preview',
    baseUrl: 'http://localhost:5173',
    capturedAt: '2025-06-15T12:00:00.000Z',
    hoverLimit: 6,
    uncovered: [],
    dropped,
    selection,
    entries
  };
}

const lostContext: Dropped = {
  scope: 'context',
  what: '/dev-viz?page=forecasting light desktop',
  why: 'page never settled in 2 attempt(s); no shots taken'
};

describe('compareManifests', () => {
  it('is all-equal when every shot matches', () => {
    const comparison = compareManifests(manifest({ a: entry('1'), b: entry('2') }), manifest({ a: entry('1'), b: entry('2') }));
    expect(comparison).toEqual({ equal: ['a', 'b'], mismatched: [], onlyInA: [], onlyInB: [] });
    expect(passes(comparison)).toBe(true);
  });

  it('reports a changed sha as a mismatch', () => {
    const comparison = compareManifests(manifest({ a: entry('1') }), manifest({ a: entry('9') }));
    expect(comparison.mismatched).toEqual(['a']);
    expect(passes(comparison)).toBe(false);
  });

  it('compares on the sha alone, so a document that grew is a mismatch and nothing else is', () => {
    const grew = { ...entry('1'), height: 4000 };
    expect(passes(compareManifests(manifest({ a: entry('1') }), manifest({ a: grew })))).toBe(true);
  });

  /**
   * The quiet failure this exists for: a capture that died halfway writes a small manifest, and
   * every shot in it matches. "All equal" over a third of the console is not a pass.
   */
  it('fails when a shot is present on one side only', () => {
    const comparison = compareManifests(manifest({ a: entry('1'), b: entry('2') }), manifest({ a: entry('1') }));
    expect(comparison.onlyInA).toEqual(['b']);
    expect(passes(comparison)).toBe(false);

    const other = compareManifests(manifest({ a: entry('1') }), manifest({ a: entry('1'), b: entry('2') }));
    expect(other.onlyInB).toEqual(['b']);
    expect(passes(other)).toBe(false);
  });

  it('fails when nothing was compared at all', () => {
    expect(passes(compareManifests(manifest({}), manifest({})))).toBe(false);
  });
});

describe('complete', () => {
  it('is true of a capture that produced every rendering it was asked for', () => {
    expect(complete(manifest({ a: entry('1') }))).toBe(true);
  });

  it('is false of a capture that dropped one', () => {
    expect(complete(manifest({ a: entry('1') }, [lostContext]))).toBe(false);
  });

  /**
   * THE HOLE `compareManifests` CANNOT SEE (ISS-9985), and the reason this is a separate question
   * asked of each side rather than a property of the comparison. A context dropped by ONE capture
   * shows up as a key present on one side only; a context dropped by BOTH leaves no key on either,
   * so every remaining shot matches and the compare says "all equal" over a console it did not
   * finish rendering. Both sides dropping it is the LIKELIER case, because the cause is the
   * runner's load and a page slow enough to miss the deadline once is slow enough to miss it twice.
   */
  it('is the only thing that can see a context both captures dropped', () => {
    const a = manifest({ a: entry('1') }, [lostContext]);
    const b = manifest({ a: entry('1') }, [lostContext]);
    expect(passes(compareManifests(a, b))).toBe(true);
    expect(complete(a) && complete(b)).toBe(false);
  });
});

describe('summarize', () => {
  it('states all four counts, which is what a PR body quotes', () => {
    expect(summarize(compareManifests(manifest({ a: entry('1'), b: entry('2') }), manifest({ a: entry('1'), b: entry('3') })))).toBe(
      '1 equal, 1 mismatched, 0 only in A, 0 only in B'
    );
  });
});

describe('scopeToSelection', () => {
  const full = (): Manifest =>
    manifest({ 'home--dark--phone--rest': entry('1'), 'about--dark--phone--rest': entry('2'), 'faq--dark--phone--rest': entry('3') });
  const sample = (slugs: string[], entries: Record<string, ManifestEntry>): Manifest =>
    manifest(entries, [], { pattern: slugs.join('|'), slugs });

  it('leaves two full captures alone', () => {
    const scope = scopeToSelection(full(), full());
    expect(scope).toEqual({ a: full(), b: full(), pages: null, outsideA: 0, outsideB: 0 });
  });

  /**
   * The A/A gate on a set too large to capture three times (ISS-15761): a full capture of main
   * against a sampled second one. Unscoped, every page the sample left out is shots in A only.
   */
  it('compares a full capture against a subset over the subset alone', () => {
    const b = sample(['home', 'faq'], { 'home--dark--phone--rest': entry('1'), 'faq--dark--phone--rest': entry('3') });
    expect(passes(compareManifests(full(), b))).toBe(false);

    const scope = scopeToSelection(full(), b);
    expect(scope.pages).toEqual(['faq', 'home']);
    expect([scope.outsideA, scope.outsideB]).toEqual([1, 0]);
    expect(passes(compareManifests(scope.a, scope.b))).toBe(true);
  });

  it('takes the intersection when both sides are subsets', () => {
    const a = sample(['home', 'about'], { 'home--dark--phone--rest': entry('1'), 'about--dark--phone--rest': entry('2') });
    const b = sample(['home', 'faq'], { 'home--dark--phone--rest': entry('1'), 'faq--dark--phone--rest': entry('3') });
    const scope = scopeToSelection(a, b);
    expect(scope.pages).toEqual(['home']);
    expect(compareManifests(scope.a, scope.b)).toEqual({ equal: ['home--dark--phone--rest'], mismatched: [], onlyInA: [], onlyInB: [] });
  });

  it('forgives nothing inside the scope: a selected page the other side lacks is still one-sided', () => {
    const a = manifest({ 'home--dark--phone--rest': entry('1') });
    const b = sample(['home', 'faq'], { 'home--dark--phone--rest': entry('1'), 'faq--dark--phone--rest': entry('3') });
    const scope = scopeToSelection(a, b);
    expect(compareManifests(scope.a, scope.b).onlyInB).toEqual(['faq--dark--phone--rest']);
  });

  it('compares nothing when the two subsets share no page, which fails', () => {
    const a = sample(['about'], { 'about--dark--phone--rest': entry('2') });
    const b = sample(['faq'], { 'faq--dark--phone--rest': entry('3') });
    const scope = scopeToSelection(a, b);
    expect(passes(compareManifests(scope.a, scope.b))).toBe(false);
  });
});
// dry-copy-end
