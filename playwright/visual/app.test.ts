import { describe, expect, it } from 'vitest';
import { fillRouteParams, liveSet, pages, routeParamNames, routeTemplates, seeds, staticSet, type RouteFacts } from './app.ts';

const PAGES = [
  'src/routes/+page.svelte',
  'src/routes/Y26/program/+page.svelte',
  'src/routes/mission/+page.svelte',
  'src/routes/vote/+page.svelte',
  'src/routes/vote/[event_key]/+page.svelte',
  'src/routes/vote/admin/login/+page.svelte',
  'src/routes/welcome/[token]/+page.svelte'
];

function facts(overrides: Partial<RouteFacts> = {}): RouteFacts {
  return { pages: PAGES, serverPages: [], dynamicRoots: [], ...overrides };
}

describe('routeTemplates', () => {
  it('turns page files into sorted route templates', () => {
    expect(routeTemplates(['src/routes/Y26/prizes/+page.svelte', 'src/routes/+page.svelte'])).toEqual(['/', '/Y26/prizes']);
  });
});

describe('routeParamNames / fillRouteParams', () => {
  it('names the parameters and fills them', () => {
    expect(routeParamNames('/vote/[event_key]/thanks')).toEqual(['event_key']);
    expect(fillRouteParams('/vote/[event_key]/thanks', { event_key: 'bths' })).toBe('/vote/bths/thanks');
  });
});

describe('staticSet', () => {
  it('keeps the routes that render with no backend', () => {
    const set = staticSet(facts({ serverPages: ['src/routes/vote/admin/login/+page.server.ts'], dynamicRoots: ['/vote'] }));
    expect(set.paths).toEqual(['/', '/Y26/program', '/mission']);
  });

  /**
   * The three ways a route can need the platform, each REPORTED with its reason rather than
   * silently dropped: a harness that skips half the site and says "all equal" is worse than one
   * that reports a smaller number honestly.
   */
  it('reports every excluded route and why', () => {
    const set = staticSet(facts({ serverPages: ['src/routes/vote/admin/login/+page.server.ts'], dynamicRoots: ['/vote'] }));
    expect(Object.fromEntries(set.uncovered.map(([template, why]) => [template, why.split(':')[0]]))).toEqual({
      '/vote': 'prerender = false under /vote',
      '/vote/[event_key]': 'route parameter [event_key]',
      '/vote/admin/login': '+page.server.ts',
      '/welcome/[token]': 'route parameter [token]'
    });
  });

  it('excludes a whole subtree from one prerender = false, not just the route that declared it', () => {
    const set = staticSet(facts({ dynamicRoots: ['/vote'] }));
    expect(set.paths).not.toContain('/vote/admin/login');
  });

  /** `/vote` must not exclude a sibling whose template merely starts with the same letters. */
  it('matches a dynamic root on path segments rather than on a string prefix', () => {
    const set = staticSet({ pages: ['src/routes/voters/+page.svelte'], serverPages: [], dynamicRoots: ['/vote'] });
    expect(set.paths).toEqual(['/voters']);
  });
});

describe('liveSet', () => {
  it('fills what it has a seed for and reports what it does not', () => {
    const set = liveSet(routeTemplates(PAGES), { event_key: 'bths' });
    expect(set.paths).toContain('/vote/bths');
    expect(set.uncovered).toEqual([['/welcome/[token]', 'no seeded value for [token]']]);
  });

  it('never guesses a rest parameter', () => {
    expect(liveSet(['/files/[...path]'], { path: 'x' }).uncovered).toEqual([
      ['/files/[...path]', 'rest parameter: no single value stands for it']
    ]);
  });
});

describe('seeds', () => {
  it('reads VISUAL_SEEDS as an object of route-parameter values', () => {
    expect(seeds(undefined)).toEqual({});
    expect(seeds('{"event_key":"bths"}')).toEqual({ event_key: 'bths' });
  });

  it('refuses anything that is not an object of strings', () => {
    expect(() => seeds('[1]')).toThrow(/JSON object/);
    expect(() => seeds('{"token":1}')).toThrow(/must be a string/);
  });
});

describe('pages', () => {
  it('answers the static set by default, from the routes tree', () => {
    const list = pages(undefined);
    expect(list.set).toBe('static');
    expect(list.paths).toContain('/Y26');
    expect(list.paths).toContain('/mission');
    expect(list.uncovered).toEqual([]);
  });

  /** This site calls no backend and has no [param] route, so the live set is the static set. */
  it('answers the live set with the same pages, since this site has no backend-served surface', () => {
    expect(pages('live').paths).toEqual(pages('static').paths);
  });

  it('refuses a set this app does not have', () => {
    expect(() => pages('preview')).toThrow(/must be "static" or "live"/);
  });
});
