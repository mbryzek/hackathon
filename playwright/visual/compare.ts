/**
 * THE VERDICT (ISS-9319). `npm run visual:compare -- <dirA> <dirB>`.
 *
 * Exits non-zero when the two captures are not identical, and prints, for every shot that moved,
 * the computed-style differences that explain it. There is no threshold and no ignore list: the
 * upgrade this was written for is claimed to be a no-op, and the only number that can support that
 * claim is zero.
 *
 * IT ALSO FAILS ON AN EMPTY COMPARE. Two directories with no shots in them agree perfectly, and a
 * harness that reported that as a pass would be at its most convincing exactly when it had
 * measured nothing (`passes()` in `manifest.ts` states the same rule).
 *
 * Run by node directly rather than through a bundler -- node executes TypeScript by stripping the
 * types, so the compare tool needs no build step and no dependency the repo does not already have.
 */
// dry-copy: visual-parity/compare — every copy of this region must match; `dev repo copies` checks it
import { compareManifests, passes, summarize, type Manifest } from './manifest.ts';
import { readManifest, readStyles } from './files.ts';
import { describeElement, diffStyles } from './styles.ts';

/** How many mismatched shots get a full style diff before the rest are just listed. */
const DETAILED = 4;

/** How many distinct `property: before -> after` groups to print per shot. */
const GROUPS = 40;

/**
 * `--audit cursor,pointer-events` — properties a SCREENSHOT CANNOT SEE.
 *
 * The verdict is a pixel hash, and a pixel hash is blind to `cursor`, `pointer-events`,
 * `user-select` and `touch-action`. That is a real hole rather than a hypothetical one for exactly
 * the change this harness was built for: Tailwind 4 changes the default button cursor from
 * `pointer` to `default`, and a capture with every hash matching would have said nothing about it.
 *
 * So this walks the computed-style dumps of shots that ALREADY MATCHED and reports differences in
 * the named properties. It is not part of the verdict — it prints, and the exit code is still the
 * hashes — because a property list is an argument about what matters, and the verdict deliberately
 * is not.
 */
function audit(dirA: string, dirB: string, keys: string[], properties: string[]): void {
  console.log(`\naudit of ${properties.join(', ')} across ${keys.length} matching shot(s):`);
  const counts = new Map<string, number>();
  const examples = new Map<string, string>();
  for (const key of keys) {
    const stylesA = readStyles(dirA, key);
    const stylesB = readStyles(dirB, key);
    if (stylesA === null || stylesB === null) continue;
    const diff = diffStyles(stylesA, stylesB, Number.MAX_SAFE_INTEGER);
    for (const difference of diff.differences) {
      if (!properties.includes(difference.property)) continue;
      const label = `${difference.property}: ${difference.a} -> ${difference.b}`;
      counts.set(label, (counts.get(label) ?? 0) + 1);
      if (!examples.has(label)) examples.set(label, `${key} ${describeElement(difference.element)}`);
    }
  }
  if (counts.size === 0) {
    console.log('  no difference in any audited property');
    return;
  }
  for (const [label, count] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count.toString().padStart(6)}x ${label}   e.g. ${examples.get(label)}`);
  }
}

/** `one-line summary of a value` — long values are what a font stack and a shadow both are. */
function short(value: string): string {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length > 90 ? `${flat.slice(0, 87)}...` : flat;
}

/**
 * Turn a list of failed shots into something to act on.
 *
 * GROUPED BY `property: before -> after`, NOT LISTED PER ELEMENT, and that is not cosmetic. A
 * stylesheet change reaches a page through a handful of rules and lands on hundreds of elements —
 * an inherited custom property lands on ALL of them — so the per-element listing this started as
 * printed the same finding four hundred times and pushed every other finding off the end of the
 * cap. Measured on the first real A/B run here: one whitespace difference in an inherited font
 * stack filled the entire output and hid every genuine difference behind it.
 *
 * The count is the second half of the value: "1 element" and "612 elements" are different
 * findings even when the property and the two values are the same one.
 */
function explain(dirA: string, dirB: string, a: Manifest, b: Manifest, mismatched: string[]): void {
  console.error(`\n${mismatched.length} shot(s) differ:`);
  for (const key of mismatched) console.error(`  ${key}`);

  /*
   * THE WHOLE-RUN ROLL-UP COMES FIRST, and it is the view to act on. A stylesheet change lands on
   * every page at once, so the same handful of `property: before -> after` facts recur across two
   * hundred shots -- and reading them one shot at a time invites fixing the page instead of the
   * rule. The per-shot detail below is for when a difference appears on ONE page and the roll-up
   * has already been worked through.
   */
  const across = new Map<string, { shots: number; elements: number; example: string }>();
  for (const key of mismatched) {
    const stylesA = readStyles(dirA, key);
    const stylesB = readStyles(dirB, key);
    if (stylesA === null || stylesB === null) continue;
    const seenHere = new Set<string>();
    for (const difference of diffStyles(stylesA, stylesB, Number.MAX_SAFE_INTEGER).differences) {
      const label = `${difference.property}: ${short(difference.a)} -> ${short(difference.b)}`;
      const row = across.get(label) ?? { shots: 0, elements: 0, example: `${key} ${describeElement(difference.element)}` };
      row.elements += 1;
      if (!seenHere.has(label)) {
        row.shots += 1;
        seenHere.add(label);
      }
      across.set(label, row);
    }
  }
  console.error(`\n${across.size} distinct computed-style difference(s) across all ${mismatched.length} shot(s):`);
  for (const [label, row] of [...across].sort((x, y) => y[1].shots - x[1].shots).slice(0, GROUPS)) {
    console.error(`  ${String(row.shots).padStart(4)} shots ${String(row.elements).padStart(6)} elements  ${label}   e.g. ${row.example}`);
  }
  if (across.size > GROUPS) console.error(`  (${across.size - GROUPS} further distinct difference(s))`);

  for (const key of mismatched.slice(0, DETAILED)) {
    const left = a.entries[key];
    const right = b.entries[key];
    console.error(`\n--- ${key}`);
    if (left && right) {
      if (left.width !== right.width || left.height !== right.height) {
        console.error(`  document ${left.width}x${left.height} -> ${right.width}x${right.height}`);
      }
      if (left.target !== right.target) console.error(`  state target ${left.target} -> ${right.target}`);
    }
    const stylesA = readStyles(dirA, key);
    const stylesB = readStyles(dirB, key);
    if (stylesA === null || stylesB === null) {
      console.error('  (no style dump on one side)');
      continue;
    }
    const diff = diffStyles(stylesA, stylesB, Number.MAX_SAFE_INTEGER);
    if (diff.notes.length > 0) console.error(`  ${diff.notes.length} property name(s) exist on one side only (e.g. ${diff.notes[0]})`);
    if (diff.differences.length === 0 && diff.notes.length === 0) {
      console.error('  no computed-style difference -- look at the PNGs: a paint-only change (image, gradient, font fallback)');
    }
    const grouped = new Map<string, { count: number; example: string }>();
    for (const difference of diff.differences) {
      const label = `${difference.property}: ${short(difference.a)} -> ${short(difference.b)}`;
      const seen = grouped.get(label);
      if (seen) seen.count += 1;
      else grouped.set(label, { count: 1, example: describeElement(difference.element) });
    }
    for (const [label, { count, example }] of [...grouped].sort((x, y) => y[1].count - x[1].count).slice(0, GROUPS)) {
      console.error(`  ${String(count).padStart(5)}x ${label}   e.g. ${example}`);
    }
    if (grouped.size > GROUPS) console.error(`  (${grouped.size - GROUPS} further distinct difference(s))`);
  }
  if (mismatched.length > DETAILED) console.error(`\n(${mismatched.length - DETAILED} further mismatched shot(s) not detailed)`);
}

function main(): number {
  const argv = process.argv.slice(2);
  const auditAt = argv.indexOf('--audit');
  const auditProperties = auditAt === -1 ? [] : (argv[auditAt + 1] ?? '').split(',').filter(Boolean);
  const positional = auditAt === -1 ? argv : [...argv.slice(0, auditAt), ...argv.slice(auditAt + 2)];
  const [dirA, dirB] = positional;
  if (dirA === undefined || dirB === undefined) {
    console.error('usage: npm run visual:compare -- <baseline-dir> <candidate-dir> [--audit cursor,pointer-events]');
    return 2;
  }

  const a = readManifest(dirA);
  const b = readManifest(dirB);
  if (a.set !== b.set) console.error(`WARNING: comparing the "${a.set}" set against the "${b.set}" set`);

  const comparison = compareManifests(a, b);
  console.log(`A ${dirA} (${a.set}, ${a.capturedAt})`);
  console.log(`B ${dirB} (${b.set}, ${b.capturedAt})`);
  console.log(summarize(comparison));

  for (const [name, keys] of [
    ['only in A', comparison.onlyInA],
    ['only in B', comparison.onlyInB]
  ] as const) {
    if (keys.length > 0) console.error(`\n${keys.length} shot(s) ${name}:\n  ${keys.join('\n  ')}`);
  }

  if (comparison.mismatched.length > 0) explain(dirA, dirB, a, b, comparison.mismatched);
  if (auditProperties.length > 0) audit(dirA, dirB, comparison.equal, auditProperties);

  if (comparison.equal.length === 0) {
    console.error('\nFAIL: nothing was compared. Two captures that contain no shots are not evidence of anything.');
    return 1;
  }
  if (!passes(comparison)) {
    console.error('\nFAIL: the two captures are not identical.');
    return 1;
  }
  console.log('\nPASS: every shot is byte-for-byte identical.');
  return 0;
}

process.exitCode = main();
// dry-copy-end
