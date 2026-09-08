/**
 * WHAT ONE CAPTURE IS GOING TO DO, resolved from the environment and the routes tree (ISS-9327).
 *
 * Read by the spec, by the global setup that clears the output directory, and by the teardown that
 * merges the shards — three places that must agree on the page list. Resolving it once, from
 * inputs that are all explicit, is what stops a capture and its own manifest disagreeing about
 * which pages were meant to be in it.
 */
import { readFileSync } from 'node:fs';
import { liveTargets, routeTemplates, staticTargets, isSetName, type RouteFacts, type SetName } from './pages.ts';
import { listFiles } from './files.ts';
import type { PageTarget } from './matrix.ts';

export interface CapturePlan {
  set: SetName;
  baseUrl: string;
  out: string;
  targets: PageTarget[];
  uncovered: [string, string][];
}

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`visual: ${name} is required`);
  return value;
}

/**
 * `VISUAL_SEEDS` is a JSON object of route-parameter values for the live set, e.g.
 * `{"event_key":"bths-2026","id":"1","token":"abc"}`.
 *
 * A route with no value here is REPORTED, not guessed. See `pages.ts`.
 */
function seeds(): Record<string, string> {
  const raw = process.env['VISUAL_SEEDS'];
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
 * READ OUT OF THE MODULES RATHER THAN LISTED, because the whole point of `staticTargets` is that
 * the static set is the site's own answer to "what needs a backend" and not a second opinion about
 * it. `src/routes/vote/+layout.ts` is the only one today; a subtree that turns prerendering off
 * tomorrow drops out of the static set with nothing edited here.
 *
 * A regex over the source rather than an import: these modules import `$app` and `$env` aliases
 * that only resolve inside a vite build, and the declaration is a top-level literal in every
 * SvelteKit repo because SvelteKit itself has to read it statically.
 */
function dynamicRoots(): string[] {
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

export function capturePlan(): CapturePlan {
  const setName = required('VISUAL_SET');
  if (!isSetName(setName)) throw new Error(`visual: VISUAL_SET must be "static" or "live", got "${setName}"`);
  const baseUrl = required('VISUAL_BASE_URL');
  const out = required('VISUAL_OUT');

  const pages = listFiles('src/routes', '+page.svelte');
  if (setName === 'static') {
    const facts: RouteFacts = { pages, serverPages: listFiles('src/routes', '+page.server.ts'), dynamicRoots: dynamicRoots() };
    const { targets, uncovered } = staticTargets(facts);
    return { set: setName, baseUrl, out, targets, uncovered };
  }
  const { targets, uncovered } = liveTargets(routeTemplates(pages), seeds());
  return { set: setName, baseUrl, out, targets, uncovered };
}
