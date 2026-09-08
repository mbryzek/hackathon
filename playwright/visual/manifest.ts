// dry-copy: sveltekit/visual-parity-manifest — every copy of this region must match; `dev repo copies` checks it (ISS-3894)
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
  /** Route templates this run could not point at, `[template, why]`. Reported, never compared. */
  uncovered: [string, string][];
  entries: Record<string, ManifestEntry>;
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
