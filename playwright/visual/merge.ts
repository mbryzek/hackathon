// dry-copy: sveltekit/visual-parity-merge — every copy of this region must match; `dev repo copies` checks it (ISS-3894)
/**
 * After a capture: fold the per-page shards into the one `manifest.json` a compare reads (ISS-9319).
 *
 * The shards exist because playwright runs several workers and a shared manifest would lose
 * updates. Merging them here rather than in a separate npm step keeps the invariant that a
 * finished playwright run leaves a directory that is either a complete capture or obviously not
 * one — `readManifest` refuses a directory with no manifest, so a run that died mid-way cannot be
 * mistaken for a small one.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { paths, writeFile } from './files.ts';
import { SHOTS_PER_PAGE } from './matrix.ts';
import type { Manifest, ManifestEntry } from './manifest.ts';
import { capturePlan } from './plan.ts';

interface Shard {
  entries: Record<string, ManifestEntry>;
  skipped: string[];
}

export default async function globalTeardown(): Promise<void> {
  const plan = capturePlan();
  const shardDir = join(plan.out, 'shards');
  const meta = existsSync(paths.meta(plan.out))
    ? (JSON.parse(readFileSync(paths.meta(plan.out), 'utf8')) as { capturedAt: string })
    : { capturedAt: new Date().toISOString() };

  const entries: Record<string, ManifestEntry> = {};
  const skipped: string[] = [];
  if (existsSync(shardDir)) {
    for (const file of readdirSync(shardDir).sort()) {
      const shard = JSON.parse(readFileSync(join(shardDir, file), 'utf8')) as Shard;
      Object.assign(entries, shard.entries);
      skipped.push(...shard.skipped);
    }
  }

  const manifest: Manifest = {
    set: plan.set,
    baseUrl: plan.baseUrl,
    capturedAt: meta.capturedAt,
    // A page that would not settle is reported the same way an unseeded route is: as a named gap,
    // in the artefact somebody reads, rather than as a smaller total nobody notices.
    uncovered: [...plan.uncovered, ...skipped.map((note): [string, string] => [note, 'page never settled; no shots taken'])],
    entries: Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)))
  };
  writeFile(paths.manifest(plan.out), JSON.stringify(manifest, null, 2));

  const expected = plan.targets.length * SHOTS_PER_PAGE;
  console.log(`visual: ${Object.keys(entries).length} of ${expected} shots captured -> ${paths.manifest(plan.out)}`);
  if (manifest.uncovered.length > 0)
    console.log(`visual: ${manifest.uncovered.length} uncovered route(s)/page(s) recorded in the manifest`);
}
// dry-copy-end
