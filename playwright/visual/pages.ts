/**
 * WHICH PAGES A CAPTURE COVERS, derived rather than listed (ISS-9327).
 *
 * A hand-written page list is a list that stops being the site. This derives both sets from the
 * routes tree, so a page added to the site is a page the next parity capture judges, with nothing
 * edited here.
 *
 * TWO SETS, because this site has two rendering surfaces and only one of them is free:
 *
 *   - `static` — every route SvelteKit can render with NO BACKEND: no route parameter, no
 *     `+page.server.ts`, and not inside a subtree that turned prerendering off. That is exactly
 *     the set `npm run build` prerenders to html, and it is 22 of this site's 38 routes: the whole
 *     Y24/Y25/Y26 programme, the sponsor, prize, rubric, photo and demo pages, and
 *     mission/press/contact/donate. It needs `npm run dev` and nothing else, which is what makes
 *     it the set a CSS change is actually judged on — the same 22 pages render identically from
 *     any checkout, which is what an A/B requires.
 *   - `live` — every `+page.svelte` under `src/routes`, served against a real platform. That adds
 *     the voting and admin surface at the cost of a backend and a seeded event, and two runs
 *     against one differ in row ids and timestamps, which read as CSS regressions.
 *
 * A ROUTE THAT IS NOT CAPTURED IS REPORTED AS UNCOVERED, never silently dropped, and the reason
 * travels with it. The failure this exists to stop is a harness that quietly skips half the site
 * and reports "all equal": only the smaller honest number is worth anything.
 */
import { pageTargets, type PageTarget, type ThemeName } from './matrix.ts';

/** The two sets a capture can be asked for. */
export const SETS = ['static', 'live'] as const;
export type SetName = (typeof SETS)[number];

export function isSetName(value: string): value is SetName {
  return (SETS as readonly string[]).includes(value);
}

/**
 * The url to navigate to for one target in one theme.
 *
 * REPO-SPECIFIC, and on this site it is the identity — twice over. There is no theme here at all
 * (see `matrix.ts` on why the axis is kept degenerate), so there is nothing for a url to carry.
 *
 * It exists because that is not true everywhere. A fixture surface that runs OUTSIDE the shell
 * owning the theme toggle has to set `data-theme` itself, and then it reads the theme off the url:
 * playbook-app's `/dev-viz` takes `?theme=`, and a capture there that relied on localStorage would
 * render every preview in one theme and compare the dark half against a copy of the light one.
 * Keeping the question in `pages.ts` is what lets `parity.spec.ts` stay shared byte for byte
 * across the repos (ISS-9323).
 */
export function themedPath(path: string, _theme: ThemeName): string {
  return path;
}

/**
 * `src/routes/Y26/program/ad/+page.svelte` -> `/Y26/program/ad`.
 *
 * Takes paths relative to the repo root, in any order, and returns sorted route TEMPLATES.
 * SvelteKit group directories `(group)` contribute no url segment. This site has none today, and
 * the line costs nothing against the day it grows one.
 */
export function routeTemplates(pageFiles: readonly string[]): string[] {
  const templates = pageFiles
    .filter((file) => file.endsWith('/+page.svelte'))
    .map((file) => {
      const withoutRoot = file.replace(/^.*?src\/routes/, '').replace(/\/\+page\.svelte$/, '');
      const segments = withoutRoot.split('/').filter((segment) => segment !== '' && !/^\(.*\)$/.test(segment));
      return `/${segments.join('/')}`;
    });
  return [...new Set(templates)].sort();
}

/** `/vote/admin/events/[id]/edit` -> `['id']`. */
export function routeParamNames(template: string): string[] {
  return [...template.matchAll(/\[([^\]]+)\]/g)].map((match) => (match[1] ?? '').replace(/^\.\.\./, ''));
}

/** `/vote/[event_key]` + `{event_key: 'demo'}` -> `/vote/demo`. */
export function fillRouteParams(template: string, values: Record<string, string>): string {
  return template.replace(/\[([^\]]+)\]/g, (whole, raw: string) => values[raw.replace(/^\.\.\./, '')] ?? whole);
}

export interface RouteSet {
  targets: PageTarget[];
  /** `[template, why]` for every route this run could not point at. Goes in the report verbatim. */
  uncovered: [string, string][];
}

/**
 * What the routes tree says about how each route is served. All three lists are repo-relative
 * paths as `listFiles` returns them; `plan.ts` reads them off disk.
 */
export interface RouteFacts {
  /** `src/routes/**\/+page.svelte` */
  pages: readonly string[];
  /** `src/routes/**\/+page.server.ts` — a route with one runs a server load against the platform. */
  serverPages: readonly string[];
  /** Route templates of the directories whose `+layout`/`+page` module sets `prerender = false`. */
  dynamicRoots: readonly string[];
}

/**
 * The static set: every route that renders with no backend, plus the reason for each that does not.
 *
 * THE THREE EXCLUSIONS ARE THE THREE WAYS A ROUTE CAN NEED THE PLATFORM, and they are read off the
 * tree rather than asserted, because a list of "the marketing pages" is a list that goes stale the
 * first time somebody adds one. What comes out agrees exactly with what `npm run build`
 * prerenders, which is the independent check that the rule is the right rule.
 *
 * The redirect at `/` is IN the set on purpose: it is a real url of this site, SvelteKit
 * prerenders it, and following it renders the same document `/Y26` does. Two keys for one
 * rendering is not a problem for an A/B — both sides do it — and a capture where `/` stopped
 * redirecting would be a finding worth seeing.
 */
export function staticTargets(facts: RouteFacts): RouteSet {
  const serverLoaded = new Set(routeTemplates(facts.serverPages.map((file) => file.replace(/\+page\.server\.ts$/, '+page.svelte'))));
  const paths: string[] = [];
  const uncovered: [string, string][] = [];
  for (const template of routeTemplates(facts.pages)) {
    const params = routeParamNames(template);
    if (params.length > 0) {
      uncovered.push([
        template,
        `route parameter ${params.map((name) => `[${name}]`).join(', ')}: needs a seeded row; the live set covers it`
      ]);
      continue;
    }
    if (serverLoaded.has(template)) {
      uncovered.push([template, '+page.server.ts: the load runs against a live platform']);
      continue;
    }
    const root = facts.dynamicRoots.find((dynamic) => template === dynamic || template.startsWith(`${dynamic}/`));
    if (root !== undefined) {
      uncovered.push([template, `prerender = false under ${root}: needs a live platform`]);
      continue;
    }
    paths.push(template);
  }
  return { targets: pageTargets(paths), uncovered };
}

/**
 * The live set: every template a value could be found for, plus the uncovered list.
 *
 * `[...rest]` routes are uncovered by construction — a rest parameter stands for an arbitrary
 * number of segments, so there is no single value that "fills" it and a guess would navigate to a
 * path the route does not really serve.
 */
export function liveTargets(templates: readonly string[], values: Record<string, string>): RouteSet {
  const paths: string[] = [];
  const uncovered: [string, string][] = [];
  for (const template of templates) {
    if (template.includes('[...')) {
      uncovered.push([template, 'rest parameter: no single value stands for it']);
      continue;
    }
    const missing = routeParamNames(template).filter((name) => values[name] === undefined || values[name] === '');
    if (missing.length > 0) {
      uncovered.push([template, `no seeded value for ${missing.map((name) => `[${name}]`).join(', ')}`]);
      continue;
    }
    paths.push(fillRouteParams(template, values));
  }
  return { targets: pageTargets(paths), uncovered };
}
