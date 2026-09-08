import { describe, expect, it } from 'vitest';
import { pageTargets, SHOTS_PER_PAGE, shotKey, shotsFor, slugOf, STATES, themeInitScript, THEMES, VIEWPORTS } from './matrix.ts';

describe('slugOf', () => {
  it('turns a url path into a filename-safe slug', () => {
    expect(slugOf('/Y26/program/ad')).toBe('y26-program-ad');
    expect(slugOf('/')).toBe('root');
  });

  /**
   * macOS filesystems are case-insensitive, so a slug that preserved case would let two paths
   * write to one file and the second would silently win. `pageTargets` refuses instead.
   */
  it('refuses two paths that differ only in case rather than letting one overwrite the other', () => {
    expect(() => pageTargets(['/Y26', '/y26'])).toThrow(/both slugify to "y26"/);
  });
});

describe('shotsFor', () => {
  it('produces one shot per theme, viewport and state, in a fixed order', () => {
    const shots = shotsFor({ path: '/mission', slug: 'mission' });
    expect(shots).toHaveLength(SHOTS_PER_PAGE);
    expect(shots[0]?.key).toBe(shotKey('mission', 'default', 'phone', 'rest'));
    expect(new Set(shots.map((shot) => shot.key)).size).toBe(shots.length);
  });

  it('counts the matrix rather than a literal, which is what setup and merge report against', () => {
    expect(SHOTS_PER_PAGE).toBe(THEMES.length * VIEWPORTS.length * STATES.length);
  });
});

describe('themeInitScript', () => {
  /** This site has no dark mode, so there is nothing to inject and the shared capture skips it. */
  it('is empty on a site with one theme', () => {
    expect(themeInitScript('default')).toBe('');
  });
});
