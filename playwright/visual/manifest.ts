/**
 * THE VERDICT FORMAT (ISS-9319).
 *
 * One capture writes one `manifest.json`: a sha256 per shot key, plus the pixel dimensions and the
 * element each state targeted. The sha IS the verdict — two captures are equal when every key is
 * present on both sides and every sha matches, and there is no tolerance, no threshold and no
 * accepted-diff list anywhere in this directory. That absence is deliberate. A pixel threshold
 * turns "the upgrade changed a border colour by one step" into a pass, and the entire reason to
 * build this rather than eyeball forty pages is that a human eye already fails that test.
 *
 * `width`/`height` and `target` are NOT part of the verdict; they are the first line of the
 * diagnostic, because a full-page screenshot that changed height narrows the search to a layout
 * change immediately, and a `focus`/`hover` shot that targeted a different element is a finding in
 * itself rather than a rendering difference.
 */
// dry-copy: visual-parity/manifest — every copy of this region must match; `dev repo copies` checks it

/** One shot's row in the manifest. */
export interface ManifestEntry {
  /** sha256 of the PNG bytes, hex. The verdict. */
  sha256: string;
  width: number;
  height: number;
  /**
   * How the state was applied: the description of the element that was focused or hovered, or
   * `none` when the page offered no eligible target inside the initial viewport. `rest` always
   * records `n/a`. Diagnostic only.
   */
  target: string;
}

export interface Manifest {
  set: string;
  /** The base url the capture ran against, for the report. Not compared. */
  baseUrl: string;
  /** Wall-clock of the capture. Not compared, and deliberately not part of any key. */
  capturedAt: string;
  /**
   * The cap this capture applied to `hover` shots per page/theme/viewport. Reported, not compared.
   *
   * It is here because it decides the KEY SET: two captures taken under different limits agree on
   * every key up to the smaller one and differ past it, which `compareManifests` reports as shots
   * present on one side only. That is the right verdict and the wrong explanation, so the number
   * is written down and `compare.ts` names it.
   */
  hoverLimit: number;
  /**
   * What this capture was never going to shoot, `[what, why]`. Reported, never compared.
   *
   * TWO CAPTURES OF THE SAME TREE PRODUCE THE SAME LIST, which is what separates this from
   * `dropped` below and is the only property that matters about it. A route with no seeded value,
   * a `[...rest]` template, a dev-only route, a page offering more hover targets than
   * `VISUAL_HOVER_LIMIT` -- each is a gap in what the harness was ASKED for, identical on both
   * sides of an A/B, so it costs the comparison no key and reads as a note rather than a failure.
   */
  uncovered: [string, string][];
  /**
   * Renderings this capture was asked for and did not produce. Reported, and FATAL.
   *
   * A SEPARATE LIST AND A DIFFERENT SHAPE, because the two were one list and read the same
   * (ISS-9985). One capture recorded 114 `uncovered` entries of which 8 were whole theme/viewport
   * contexts that never settled and 106 were benign hover-cap notices -- and the run reported "29
   * passed" and "29 of 29 pages", because a page that loses one of its six contexts still has the
   * other five. The 62 shots those 8 contexts owed turned up in the compare as present on one side
   * only, which is a failed A/A gate that names the stylesheet rather than the runner's load.
   *
   * THIS IS NOT A SMALLER ANSWER, IT IS NO ANSWER, and both readers act on it: `merge.ts` fails the
   * capture, and `compare.ts` refuses a capture that carries one. The second half is the one that
   * is easy to leave out and is the reason this is on the manifest at all -- if BOTH sides drop the
   * same context, no key is missing from either, every remaining shot matches, and the compare
   * passes over a hole. "All equal" across a capture nobody took is the exact sentence this harness
   * exists to stop anybody writing.
   */
  dropped: Dropped[];
  entries: Record<string, ManifestEntry>;
}

/**
 * One rendering that was asked for and not produced.
 *
 * AN OBJECT AND NOT A `[what, why]` TUPLE ON PURPOSE. These sit beside `uncovered` in the artefact
 * a person reads and in the console output, and a tuple would go on reading exactly like the
 * benign notices it is being separated from. The shape is the signal.
 */
export interface Dropped {
  /**
   * How much was lost. `page` is a test that wrote no shard at all; `context` is one theme and
   * viewport of a page, which is a sixth of that page's shots; `shot` is one key.
   */
  scope: 'page' | 'context' | 'shot';
  /** The shot key, or `<path> <theme> <viewport>` for a context, or the page path. */
  what: string;
  /** What was tried and what it came back with, including how many attempts it took to give up. */
  why: string;
}

export interface Comparison {
  equal: string[];
  /** Keys present on both sides whose sha differs. The only thing that fails a compare. */
  mismatched: string[];
  onlyInA: string[];
  onlyInB: string[];
}

/**
 * Compare two manifests.
 *
 * A KEY PRESENT ON ONE SIDE ONLY IS A FAILURE, not a note, and `passes()` below says so. The
 * failure mode it guards is the quiet one: a capture that crashed halfway writes a manifest with
 * three hundred keys instead of eight hundred, and every one of them matches. "All equal" over a
 * third of the console is the exact sentence this harness exists to stop anybody writing.
 */
export function compareManifests(a: Manifest, b: Manifest): Comparison {
  const keysA = Object.keys(a.entries).sort();
  const equal: string[] = [];
  const mismatched: string[] = [];
  const onlyInA: string[] = [];
  for (const key of keysA) {
    const left = a.entries[key];
    const right = b.entries[key];
    if (left === undefined) continue;
    if (right === undefined) {
      onlyInA.push(key);
      continue;
    }
    if (left.sha256 === right.sha256) equal.push(key);
    else mismatched.push(key);
  }
  const onlyInB = Object.keys(b.entries)
    .filter((key) => a.entries[key] === undefined)
    .sort();
  return { equal, mismatched, onlyInA, onlyInB };
}

/**
 * True when a capture produced every rendering it was asked for.
 *
 * ASKED OF EACH SIDE SEPARATELY, and it is not implied by `passes` below. `compareManifests` can
 * only see a key one side has and the other does not, so it catches a context dropped by ONE
 * capture and is blind to the same context dropped by BOTH -- which is the likelier of the two on a
 * runner whose load is what drops them, since a page slow enough to miss the deadline in one
 * capture is slow enough to miss it in the next. Both sides then agree perfectly over the shots
 * that remain (ISS-9985).
 */
export function complete(manifest: Manifest): boolean {
  return manifest.dropped.length === 0;
}

/** True when the two captures are byte-for-byte identical over a non-empty set of shots. */
export function passes(comparison: Comparison): boolean {
  return (
    comparison.mismatched.length === 0 && comparison.onlyInA.length === 0 && comparison.onlyInB.length === 0 && comparison.equal.length > 0
  );
}

/** One line per outcome, the thing a PR body quotes. */
export function summarize(comparison: Comparison): string {
  return (
    `${comparison.equal.length} equal, ${comparison.mismatched.length} mismatched, ` +
    `${comparison.onlyInA.length} only in A, ${comparison.onlyInB.length} only in B`
  );
}
// dry-copy-end
