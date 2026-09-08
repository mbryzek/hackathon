// dry-copy: visual-parity/matrix-test — every copy of this region must match; `dev repo copies` checks it
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HOVER_LIMIT,
  hoverLimit,
  pageTargets,
  shotKey,
  shotsFor,
  shotStates,
  slugOf,
  STATES,
  THEMES,
  VIEWPORTS
} from './matrix.ts';

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

describe('shotStates', () => {
  it('expands hover into one state per target and leaves the singletons alone', () => {
    expect(shotStates(3)).toEqual(['rest', 'focus', 'hover-0', 'hover-1', 'hover-2']);
  });

  /**
   * A page with no button still contributes `hover-0`, targeted `none`. The alternative -- no
   * hover key at all -- makes the day the page grows a button a key present on one side only,
   * where it should be a `target` change on a key both captures hold.
   */
  it('still contributes one hover shot for a page that offers no target', () => {
    expect(shotStates(0)).toEqual(['rest', 'focus', 'hover-0']);
  });
});

describe('shotsFor', () => {
  const shots = shotsFor({ path: '/dev/preview', slug: 'dev-preview' }, 2);

  it('covers every theme, viewport and state exactly once', () => {
    expect(shots).toHaveLength(THEMES.length * VIEWPORTS.length * shotStates(2).length);
    expect(new Set(shots.map((shot) => shot.key)).size).toBe(shots.length);
  });

  it('keys a shot by page, theme, viewport and state', () => {
    expect(shots[0]?.key).toBe(shotKey('dev-preview', 'dark', 'phone', 'rest'));
    expect(shots.at(-1)?.key).toBe('dev-preview--light--desktop--hover-1');
  });

  /** STATES is still the axis; hover is the one member of it that is not a single shot. */
  it('leaves rest and focus at one shot each however many hover targets there are', () => {
    const many = shotsFor({ path: '/dev/preview', slug: 'dev-preview' }, 9);
    expect(many.filter((shot) => shot.state === 'rest')).toHaveLength(THEMES.length * VIEWPORTS.length);
    expect(STATES).toEqual(['rest', 'focus', 'hover']);
  });
});

describe('hoverLimit', () => {
  it('defaults when VISUAL_HOVER_LIMIT is unset or empty', () => {
    expect(hoverLimit(undefined)).toBe(DEFAULT_HOVER_LIMIT);
    expect(hoverLimit('')).toBe(DEFAULT_HOVER_LIMIT);
  });

  it('takes a positive integer', () => {
    expect(hoverLimit('12')).toBe(12);
  });

  /**
   * A typo that silently became the default would write a capture whose keys stop where the other
   * side's do not, and the compare would report hundreds of shots present on one side only -- the
   * right verdict, attributed to the wrong cause.
   */
  it('refuses anything that is not one, naming what it was given', () => {
    expect(() => hoverLimit('0')).toThrow(/positive integer, got "0"/);
    expect(() => hoverLimit('-1')).toThrow(/positive integer/);
    expect(() => hoverLimit('2.5')).toThrow(/positive integer/);
    expect(() => hoverLimit('six')).toThrow(/positive integer/);
  });
});
// dry-copy-end
