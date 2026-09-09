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
import type { Dropped, Manifest, ManifestEntry } from './manifest.ts';
import { capturePlan } from './plan.ts';

interface Shard {
  entries: Record<string, ManifestEntry>;
  /**
   * `[what, why]` for what this page was never going to shoot: a hover cap reached, and whatever
   * else a repo's own plan declares out of reach.
   *
   * The WHY comes from the spec rather than being supplied here, because the reasons are not one,
   * and a single sentence written at the merge would be wrong about most of them.
   */
  uncovered: [string, string][];
  /** What this page's test was asked for and did not produce. Fatal; see `Dropped`. */
  dropped: Dropped[];
}

export default async function globalTeardown(): Promise<void> {
  const plan = capturePlan();
  const shardDir = join(plan.out, 'shards');
  const meta = existsSync(paths.meta(plan.out))
    ? (JSON.parse(readFileSync(paths.meta(plan.out), 'utf8')) as { capturedAt: string })
    : { capturedAt: new Date().toISOString() };

  const entries: Record<string, ManifestEntry> = {};
  // A route this set was never going to point at and a hover cap that was reached are the same
  // kind of thing: named gaps in what was ASKED for, identical in every capture of this tree, so
  // they go in the artefact somebody reads and change no verdict.
  const uncovered: [string, string][] = [...plan.uncovered];
  // What was asked for and did not arrive is the other kind, and it is kept apart because the two
  // read the same when they are in one list -- 8 lost contexts among 114 lines of benign notice is
  // how a capture came to report itself complete over a hole 62 shots wide (ISS-9985).
  const dropped: Dropped[] = [];
  if (existsSync(shardDir)) {
    for (const file of readdirSync(shardDir).sort()) {
      const shard = JSON.parse(readFileSync(join(shardDir, file), 'utf8')) as Shard;
      Object.assign(entries, shard.entries);
      uncovered.push(...shard.uncovered);
      dropped.push(...shard.dropped);
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
  for (const target of missing) {
    dropped.push({ scope: 'page', what: target.path, why: "no shard: this page's capture did not finish" });
  }

  const manifest: Manifest = {
    set: plan.set,
    baseUrl: plan.baseUrl,
    capturedAt: meta.capturedAt,
    hoverLimit: plan.hoverLimit,
    uncovered,
    dropped,
    entries: Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)))
  };
  writeFile(paths.manifest(plan.out), JSON.stringify(manifest, null, 2));

  console.log(
    `visual: ${Object.keys(entries).length} shot(s) across ${plan.targets.length - missing.length} of ${plan.targets.length} page(s) ` +
      `-> ${paths.manifest(plan.out)}`
  );
  if (manifest.uncovered.length > 0)
    console.log(`visual: ${manifest.uncovered.length} uncovered route(s)/page(s) recorded in the manifest`);

  /*
   * THE COUNT ABOVE CANNOT SAY THIS, and that is why the line below is separate and why it throws.
   *
   * "N shots across 29 of 29 pages" is true of a capture that lost eight whole theme/viewport
   * contexts: a page keeps its shard and its place in that count as long as ONE of its six contexts
   * shot, so the page total is 29 either way and the shot total is a number nobody can predict, `hover`
   * being one shot per element. A caller reading the summary of the run that lost 62 shots got no
   * signal at all (ISS-9985).
   *
   * THROWN AFTER THE MANIFEST IS WRITTEN, so the capture directory and everything in it survives:
   * playwright reports the teardown failure and exits non-zero, which is the answer a caller
   * needs -- a capture with a hole in it must not be handed to `visual:compare` as a baseline, and
   * `compare.ts` refuses one for the case where it is anyway.
   */
  if (dropped.length > 0) {
    for (const loss of dropped) console.error(`visual: DROPPED [${loss.scope}] ${loss.what}: ${loss.why}`);
    throw new Error(
      `visual: ${dropped.length} rendering(s) dropped -- this capture is INCOMPLETE and cannot pass an A/A gate. ` +
        `A dropped rendering is not a smaller answer, it is no answer. See ${paths.manifest(plan.out)}.`
    );
  }
}
// dry-copy-end
