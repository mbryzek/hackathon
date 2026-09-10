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
import { assertColdServer } from './coldServer.ts';
import { capturePlan } from './plan.ts';

export default async function globalSetup(): Promise<void> {
  const plan = capturePlan();

  const response = await fetch(plan.baseUrl, { redirect: 'manual' }).catch((error: unknown) => {
    throw new Error(`visual: nothing answered at ${plan.baseUrl} -- start the server first (${String(error)})`);
  });
  if (response.status >= 500) throw new Error(`visual: ${plan.baseUrl} answered ${response.status}`);

  // BEFORE THE DIRECTORY IS CLEARED: a refusal here should cost the operator nothing but the
  // restart, and clearing first would throw away a capture they may still want to compare against.
  await assertColdServer(plan.baseUrl);

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
}
// dry-copy-end
