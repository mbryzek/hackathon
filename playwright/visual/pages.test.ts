import { describe, expect, it } from 'vitest';
import { fillRouteParams, liveTargets, routeParamNames, routeTemplates, staticTargets, type RouteFacts } from './pages.ts';

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

describe('staticTargets', () => {
  it('keeps the routes that render with no backend', () => {
    const set = staticTargets(facts({ serverPages: ['src/routes/vote/admin/login/+page.server.ts'], dynamicRoots: ['/vote'] }));
    expect(set.targets.map((target) => target.path)).toEqual(['/', '/Y26/program', '/mission']);
  });

  /**
   * The three ways a route can need the platform, each REPORTED with its reason rather than
   * silently dropped: a harness that skips half the site and says "all equal" is worse than one
   * that reports a smaller number honestly.
   */
  it('reports every excluded route and why', () => {
    const set = staticTargets(facts({ serverPages: ['src/routes/vote/admin/login/+page.server.ts'], dynamicRoots: ['/vote'] }));
    expect(Object.fromEntries(set.uncovered.map(([template, why]) => [template, why.split(':')[0]]))).toEqual({
      '/vote': 'prerender = false under /vote',
      '/vote/[event_key]': 'route parameter [event_key]',
      '/vote/admin/login': '+page.server.ts',
      '/welcome/[token]': 'route parameter [token]'
    });
  });

  it('excludes a whole subtree from one prerender = false, not just the route that declared it', () => {
    const set = staticTargets(facts({ dynamicRoots: ['/vote'] }));
    expect(set.targets.map((target) => target.path)).not.toContain('/vote/admin/login');
  });

  /** `/vote` must not exclude a sibling whose template merely starts with the same letters. */
  it('matches a dynamic root on path segments rather than on a string prefix', () => {
    const set = staticTargets({ pages: ['src/routes/voters/+page.svelte'], serverPages: [], dynamicRoots: ['/vote'] });
    expect(set.targets.map((target) => target.path)).toEqual(['/voters']);
  });
});

describe('liveTargets', () => {
  it('fills what it has a seed for and reports what it does not', () => {
    const set = liveTargets(routeTemplates(PAGES), { event_key: 'bths' });
    expect(set.targets.map((target) => target.path)).toContain('/vote/bths');
    expect(set.uncovered).toEqual([['/welcome/[token]', 'no seeded value for [token]']]);
  });

  it('never guesses a rest parameter', () => {
    expect(liveTargets(['/files/[...path]'], { path: 'x' }).uncovered).toEqual([
      ['/files/[...path]', 'rest parameter: no single value stands for it']
    ]);
  });
});
