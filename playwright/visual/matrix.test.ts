// dry-copy: visual-parity/matrix-test — every copy of this region must match; `dev repo copies` checks it
import { describe, expect, it } from 'vitest';
import { pageTargets, shotKey, shotsFor, slugOf, STATES, THEMES, VIEWPORTS } from './matrix.ts';

/**
 * The bookkeeping, not the browser. What these pin is the property the whole harness rests on: a
 * shot on one side has exactly one counterpart on the other, and the key that pairs them is stable
 * and unique. A collision here does not make a capture fail — it makes two different pages compare
 * EQUAL, which is the one failure mode a green run cannot tell you about.
 */
describe('slugOf', () => {
  it('makes a path filename-safe', () => {
    expect(slugOf('/dev/preview/clubDetail')).toBe('dev-preview-clubdetail');
    expect(slugOf('/admin/clubs/picklejar/integrations/court-reserve')).toBe('admin-clubs-picklejar-integrations-court-reserve');
  });

  it('names the root path rather than returning an empty string', () => {
    expect(slugOf('/')).toBe('root');
  });
});

describe('pageTargets', () => {
  it('pairs every path with its slug', () => {
    expect(pageTargets(['/a/b', '/c'])).toEqual([
      { path: '/a/b', slug: 'a-b' },
      { path: '/c', slug: 'c' }
    ]);
  });

  it('refuses a slug collision, naming both paths', () => {
    // Two preview keys differing only in case would write to one file on a case-insensitive
    // filesystem, and the second would silently win.
    expect(() => pageTargets(['/dev/preview/clubDetail', '/dev/preview/clubdetail'])).toThrow(/both slugify to "dev-preview-clubdetail"/);
  });
});

describe('shotsFor', () => {
  const shots = shotsFor({ path: '/dev/preview', slug: 'dev-preview' });

  it('covers every theme, viewport and state exactly once', () => {
    expect(shots).toHaveLength(THEMES.length * VIEWPORTS.length * STATES.length);
    expect(new Set(shots.map((shot) => shot.key)).size).toBe(shots.length);
  });

  it('keys a shot by page, theme, viewport and state', () => {
    expect(shots[0]?.key).toBe(shotKey('dev-preview', 'dark', 'phone', 'rest'));
    expect(shots.at(-1)?.key).toBe('dev-preview--light--desktop--hover');
  });
});
// dry-copy-end
