/**
 * After a capture: fold the per-page shards into the one `manifest.json` a compare reads (ISS-9319).
 *
 * The shards exist because playwright runs several workers and a shared manifest would lose
 * updates. Merging them here rather than in a separate npm step keeps the invariant that a
 * finished playwright run leaves a directory that is either a complete capture or obviously not
 * one — `readManifest` refuses a directory with no manifest, so a run that died mid-way cannot be
 * mistaken for a small one.
 */
// dry-copy: visual-parity/merge — every copy of this region must match; `dev repo copies` checks it
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { paths, writeFile } from './files.ts';
import type { Manifest, ManifestEntry } from './manifest.ts';
import { capturePlan } from './plan.ts';

interface Shard {
  entries: Record<string, ManifestEntry>;
  /**
   * `[what, why]` for every rendering this page's test could not shoot.
   *
   * The WHY comes from the spec rather than being supplied here, because the reasons are no longer
   * one: a page that never settled, a shot whose webfont was not measurable, and a page offering
   * more hover targets than the limit are three different gaps, and a single sentence written at
   * the merge would be wrong about two of them.
   */
  uncovered: [string, string][];
}

export default async function globalTeardown(): Promise<void> {
  const plan = capturePlan();
  const shardDir = join(plan.out, 'shards');
  const meta = existsSync(paths.meta(plan.out))
    ? (JSON.parse(readFileSync(paths.meta(plan.out), 'utf8')) as { capturedAt: string })
    : { capturedAt: new Date().toISOString() };

  const entries: Record<string, ManifestEntry> = {};
  // A page that would not settle, a shot whose font never resolved and a page with more hover
  // targets than the limit are reported the same way an unseeded route is: as named gaps, in the
  // artefact somebody reads, rather than as a smaller total nobody notices.
  const uncovered: [string, string][] = [...plan.uncovered];
  if (existsSync(shardDir)) {
    for (const file of readdirSync(shardDir).sort()) {
      const shard = JSON.parse(readFileSync(join(shardDir, file), 'utf8')) as Shard;
      Object.assign(entries, shard.entries);
      uncovered.push(...shard.uncovered);
    }
  }

  /*
   * A PAGE THAT WROTE NO SHARD AT ALL IS THE QUIET FAILURE, and it is checked by name rather than
   * by arithmetic. A shot count cannot be predicted any more -- `hover` contributes one shot per
   * eligible element, which only the browser knows -- so "N of an expected M" no longer exists to
   * catch a worker that died. What does catch it is that every planned page owes a shard, and a
   * missing one is recorded as a gap instead of being a smaller total nobody reads.
   */
  const missing = plan.targets.filter((target) => !existsSync(paths.shard(plan.out, target.slug)));
  for (const target of missing) uncovered.push([target.path, "no shard: this page's capture did not finish"]);

  const manifest: Manifest = {
    set: plan.set,
    baseUrl: plan.baseUrl,
    capturedAt: meta.capturedAt,
    hoverLimit: plan.hoverLimit,
    uncovered,
    entries: Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)))
  };
  writeFile(paths.manifest(plan.out), JSON.stringify(manifest, null, 2));

  console.log(
    `visual: ${Object.keys(entries).length} shot(s) across ${plan.targets.length - missing.length} of ${plan.targets.length} page(s) ` +
      `-> ${paths.manifest(plan.out)}`
  );
  if (manifest.uncovered.length > 0)
    console.log(`visual: ${manifest.uncovered.length} uncovered route(s)/page(s) recorded in the manifest`);
}
// dry-copy-end
