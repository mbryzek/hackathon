/**
 * WHAT THE VISUAL-PARITY HARNESS NEEDS TO KNOW ABOUT HACKATHON, and nothing else (ISS-20188).
 *
 * The harness ships with the devops release and runs as `dev visual capture|compare|test`; its
 * README (`dev visual path` prints where it is) is the contract this file meets. This file must
 * import nothing from the harness: the repo's lint and type check never see it.
 *
 * WHICH PAGES A CAPTURE COVERS is derived rather than listed (ISS-9327). A hand-written page list is
 * a list that stops being the site, so the routes tree is the source: a page added under
 * `src/routes` is a page the next parity capture judges, with nothing edited here.
 *
 * TWO SETS. This site has one rendering surface today, and every route on it is free:
 *
 *   - `static` (the default) — every route SvelteKit can render with NO BACKEND: no route parameter,
 *     no `+page.server.ts`, and not inside a subtree that turned prerendering off. That is exactly
 *     the set `npm run build` prerenders to html, and it is every route this site has: the whole
 *     Y24/Y25/Y26 programme, the sponsor, prize, rubric, photo and demo pages, and
 *     mission/press/contact/donate. It needs `npm run dev` and nothing else, which is what makes it
 *     the set a CSS change is actually judged on — the same pages render identically from any
 *     checkout, which is what an A/B requires.
 *   - `live` — every `+page.svelte` under `src/routes`, with `[param]` routes filled from
 *     `VISUAL_SEEDS`. It is the set for a site with a backend-served surface; this site has none, so
 *     it captures what `static` does.
 *
 * A ROUTE THAT IS NOT CAPTURED IS REPORTED AS UNCOVERED, never silently dropped, and the reason
 * travels with it. The failure this exists to stop is a harness that quietly skips half the site
 * and reports "all equal": only the smaller honest number is worth anything.
 *
 * THE SERVER HALF OF DETERMINISM IS THIS REPO'S TOO. The site shuffles its photo and video galleries
 * during SSR, so the server under capture is started with `server-determinism.mjs` preloaded beside
 * this file; `README.md` has the command.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * WHICH APP THIS IS, in a form the served document can be asked for (ISS-15766). `src/app.html`
 * carries it, so every page this app serves does; the harness refuses a capture of a server whose
 * document lacks it.
 */
export const APP_MARKER = '<!-- visual-parity app: hackathon -->';

/**
 * The `localStorage` key a context boots its theme under. THIS SITE HAS NO THEME — no `dark:`
 * utility, no `data-theme`, no toggle — so nothing reads it.
 */
export const THEME_STORAGE_KEY = 'playbook-theme';

/**
 * The two values a context boots under. Both render identically here, and the degenerate axis is
 * kept because two shots that must be equal are a free control on the harness itself: a `dark` hash
 * that differs from its `light` twin inside ONE capture is a harness fault.
 */
export const THEMES = ['dark', 'light'] as const;
export type ThemeName = (typeof THEMES)[number];

/**
 * Phone, tablet, desktop. `desktop` is 1920x1080 because that is what `playwright.config.ts` already
 * uses, so a shot taken here is the same page the e2e suite sees. 375 and 768 are Tailwind's own
 * `sm` and `md` boundaries — below `sm`, and exactly ON `md` — so a responsive variant that changed
 * the width it applies at lands on one of the three rather than between them. Every page here is a
 * `sm:`/`md:`/`lg:` grid over a mobile column, and `app.css` declares no `@media` block of its own,
 * so Tailwind's are the only breakpoints there are.
 */
export const VIEWPORTS: readonly { name: string; width: number; height: number }[] = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
] as const;

/** The two sets a capture can be asked for. Named rather than implied, because it goes in the manifest. */
export const SETS = ['static', 'live'] as const;
export type SetName = (typeof SETS)[number];

export function isSetName(value: string): value is SetName {
  return (SETS as readonly string[]).includes(value);
}

/** Every path under `root` whose filename ends with `suffix`, sorted, repo-relative. */
export function listFiles(root: string, suffix: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith(suffix))
    .map((entry) => join(root, entry))
    .sort();
}

/**
 * The url to navigate to for one path in one theme. There is no theme here at all, so it is the
 * identity.
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
  paths: string[];
  /** `[template, why]` for every route this run could not point at. Goes in the report verbatim. */
  uncovered: [string, string][];
}

/**
 * What the routes tree says about how each route is served. All three lists are repo-relative
 * paths as `listFiles` returns them; `pages` reads them off disk.
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
export function staticSet(facts: RouteFacts): RouteSet {
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
  return { paths, uncovered };
}

/**
 * The live set: every template a value could be found for, plus the uncovered list.
 *
 * `[...rest]` routes are uncovered by construction — a rest parameter stands for an arbitrary
 * number of segments, so there is no single value that "fills" it and a guess would navigate to a
 * path the route does not really serve.
 */
export function liveSet(templates: readonly string[], values: Record<string, string>): RouteSet {
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
  return { paths, uncovered };
}

/**
 * `VISUAL_SEEDS` is a JSON object of route-parameter values for the live set, e.g.
 * `{"event_key":"bths-2026","id":"1","token":"abc"}`. A route with no value here is REPORTED, not
 * guessed.
 */
export function seeds(raw: string | undefined): Record<string, string> {
  if (raw === undefined || raw === '') return {};
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('visual: VISUAL_SEEDS must be a JSON object of route-parameter values');
  }
  const values: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== 'string') throw new Error(`visual: VISUAL_SEEDS.${name} must be a string`);
    values[name] = value;
  }
  return values;
}

/**
 * The `prerender = false` declarations, as the route templates they apply to.
 *
 * READ OUT OF THE MODULES RATHER THAN LISTED, because the whole point of `staticSet` is that the
 * static set is the site's own answer to "what needs a backend" and not a second opinion about it.
 * There is none today; a subtree that turns prerendering off tomorrow drops out of the static set
 * with nothing edited here.
 *
 * A regex over the source rather than an import: these modules import `$app` and `$env` aliases
 * that only resolve inside a vite build, and the declaration is a top-level literal in every
 * SvelteKit repo because SvelteKit itself has to read it statically.
 */
export function dynamicRoots(): string[] {
  const roots: string[] = [];
  for (const suffix of ['+layout.ts', '+layout.server.ts', '+page.ts']) {
    for (const file of listFiles('src/routes', suffix)) {
      if (!/export\s+const\s+prerender\s*=\s*false/.test(readFileSync(file, 'utf8'))) continue;
      const directory = file.slice(0, file.lastIndexOf('/'));
      const template = routeTemplates([`${directory}/+page.svelte`])[0];
      if (template !== undefined) roots.push(template);
    }
  }
  return [...new Set(roots)].sort();
}

/** The page list for a set: the harness's one question of this repo. `static` when none is named. */
export function pages(set: string | undefined): { set: SetName; paths: string[]; uncovered: [string, string][] } {
  const name = set ?? 'static';
  if (!isSetName(name)) throw new Error(`visual: VISUAL_SET must be "static" or "live", got "${name}"`);
  const pageFiles = listFiles('src/routes', '+page.svelte');
  if (name === 'static') {
    const facts: RouteFacts = { pages: pageFiles, serverPages: listFiles('src/routes', '+page.server.ts'), dynamicRoots: dynamicRoots() };
    return { set: name, ...staticSet(facts) };
  }
  return { set: name, ...liveSet(routeTemplates(pageFiles), seeds(process.env['VISUAL_SEEDS'])) };
}
