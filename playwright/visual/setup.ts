/**
 * Before a capture: prove the server is there, prove it is COLD, and start from an empty
 * directory (ISS-9319, ISS-10161).
 *
 * THE EMPTY DIRECTORY IS THE LOAD-BEARING HALF. A capture that reuses a directory inherits the
 * previous run's shots for every page the current run fails on, and those stale shots are
 * indistinguishable from fresh ones — so a compare would pass on a page nobody rendered. Clearing
 * is what makes "present on one side only" mean what `compareManifests` treats it as meaning.
 *
 * THE COLD-SERVER PROOF IS THE OTHER HALF, and it is the one the A/A gate structurally cannot
 * cover, because the gate runs before anybody has edited anything. `coldServer.ts` carries it and
 * the argument for it.
 */
// dry-copy: visual-parity/setup — every copy of this region must match; `dev repo copies` checks it
import { rmSync } from 'node:fs';
import { paths, writeFile } from './files.ts';
import { plantedCookies } from './capture.ts';
import { assertColdServer } from './coldServer.ts';
import type { PageTarget } from './matrix.ts';
import { APP_MARKER, capturePlan } from './plan.ts';

/** What the reachability, identity and cold-server probes ask the server for. */
export interface CaptureProbe {
  url: string;
  init: RequestInit;
}

/**
 * The first page this capture is going to open, asked for with the cookies it will open it with
 * (ISS-19745).
 *
 * NOT THE BASE URL. An app whose sign-in lives in the account app answers a signed-out request
 * for its root with a redirect to another origin, and the document that lands carries the ACCOUNT
 * app's marker -- so a probe of the root refused every capture of such an app, on main as on any
 * branch, before it shot a page. A page the set captures is the one url whose document the harness
 * is about to photograph anyway: the preview set's own entry serves the app with no session, and a
 * live set's guarded page serves it with the `VISUAL_COOKIES` session the capture plants. If that
 * page does not carry the marker, no shot of it would have been of this app either.
 *
 * The base url is the fallback only for a plan with no page in it, which a capture refuses later.
 */
export function captureProbe(baseUrl: string, targets: readonly PageTarget[]): CaptureProbe {
  const first = targets[0];
  const url = first === undefined ? baseUrl : new URL(first.path, baseUrl).href;
  const cookie = plantedCookies(baseUrl)
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
  return { url, init: cookie === '' ? {} : { headers: { cookie } } };
}

/**
 * Refuse a capture of a server that is not serving THIS app (ISS-15766).
 *
 * SOMETHING ANSWERING IS NOT EVIDENCE IT IS THIS APP. On a shared runner a sibling session runs the
 * same harness against the same constants, and `localhost` resolves to both `::1` and `127.0.0.1`:
 * a server bound on one address family and a sibling's bound on the other share the port number,
 * and the capture photographs whichever answered. Nothing fails. The capture is complete and
 * self-consistent, and the compare reports every shot mismatched with element counts differing,
 * which reads as a catastrophic stylesheet regression.
 *
 * `marker` is `APP_MARKER` from this repo's own `plan.ts`, which its `src/app.html` carries, so it
 * is in every document the app serves. `url` is `captureProbe`'s, a page the capture opens, and
 * this follows redirects as the browser will. It tells this app from any other; it cannot tell two
 * working trees of this app apart, which is what the random port and the url `dev agent serve`
 * prints are for.
 */
export async function assertServesThisApp(url: string, marker: string, init: RequestInit = {}): Promise<void> {
  const response = await fetch(url, init).catch(() => null);
  const document = response === null ? '' : await response.text().catch(() => '');
  if (document.includes(marker)) {
    console.log(`visual: app identity -- ${url} serves this app (its document carries ${marker})`);
    return;
  }
  const landed = response !== null && response.url !== '' && response.url !== url ? ` (redirected to ${response.url})` : '';
  const offOrigin = response !== null && response.url !== '' && new URL(response.url).origin !== new URL(url).origin;
  throw new Error(
    `visual: ${url} is not serving this app -- the document it answered${landed} does not carry ${marker}, ` +
      "which this repo's src/app.html puts in every page (APP_MARKER in playwright/visual/plan.ts). " +
      (offOrigin
        ? 'It redirected to another origin, which is a sign-in guard: this is the first page the capture opens, so a live ' +
          'set needs the session in VISUAL_COOKIES -- see the README.'
        : 'On a shared runner a fixed port, or a localhost that resolves to a sibling listening on the other address family, ' +
          'captures a different app and the compare reports every shot mismatched. Start the server with dev agent serve on a ' +
          'random port bound to 127.0.0.1 and capture from the url it prints -- see the README.')
  );
}

export default async function globalSetup(): Promise<void> {
  const plan = capturePlan();
  const probe = captureProbe(plan.baseUrl, plan.targets);

  const response = await fetch(probe.url, { ...probe.init, redirect: 'manual' }).catch((error: unknown) => {
    throw new Error(`visual: nothing answered at ${probe.url} -- start the server first (${String(error)})`);
  });
  if (response.status >= 500) throw new Error(`visual: ${probe.url} answered ${response.status}`);

  // BEFORE THE COLD-SERVER PROOF: a sibling's app is no evidence about this server's HMR state, and
  // a refusal naming the wrong cause sends the operator to restart a server that was never the one
  // being captured.
  await assertServesThisApp(probe.url, APP_MARKER, probe.init);

  // BEFORE THE DIRECTORY IS CLEARED: a refusal here should cost the operator nothing but the
  // restart, and clearing first would throw away a capture they may still want to compare against.
  await assertColdServer(probe.url, 'before', probe.init);

  rmSync(plan.out, { recursive: true, force: true });
  writeFile(
    paths.meta(plan.out),
    JSON.stringify({ set: plan.set, baseUrl: plan.baseUrl, capturedAt: new Date().toISOString(), uncovered: plan.uncovered }, null, 2)
  );

  // "N pages" and not "N shots": `hover` contributes one shot per interactive element the page
  // offers inside the viewport, which only the browser knows. The floor is stated instead, so the
  // line cannot be read as a total the run then quietly fails to reach.
  console.log(
    `visual: capturing the ${plan.set} set -- ${plan.targets.length} pages, at least ${plan.targets.length * 12} shots ` +
      `(plus one per hover target, up to ${plan.hoverLimit} each) -> ${plan.out}`
  );
  if (plan.uncovered.length > 0) console.log(`visual: ${plan.uncovered.length} route(s) uncovered; see manifest.json`);
  if (plan.selection) console.log(`visual: VISUAL_PAGES=${plan.selection.pattern} selects ${plan.targets.length} page(s)`);
}
// dry-copy-end
