/**
 * THE DIAGNOSTIC HALF (ISS-9319).
 *
 * The sha256 in `manifest.json` says WHETHER two renderings differ. It says nothing about what to
 * fix, and on a stylesheet upgrade "page X moved" is close to useless: the console draws forty
 * pages out of one design system, so one changed default reaches every page at once and forty red
 * screenshots are one bug wearing forty hats. So every shot also writes the full
 * `getComputedStyle` map of every element it rendered, and the compare tool turns a sha mismatch
 * into `border-color: rgb(229,233,241) -> rgb(0,0,0)` against a named element, which points at the
 * rule.
 *
 * This is NEVER a verdict. A computed-style dump cannot see a background image, a font fallback or
 * a sub-pixel layout shift, and a harness that graded on it would pass changes the screenshot
 * catches. It is read only after the screenshot has already failed.
 *
 * STORED DEDUPLICATED, and that is not premature. A capture is ~800 shots; an admin page is
 * hundreds of elements; Chromium reports ~350 longhand properties per element. Written naively
 * that is gigabytes of JSON per capture, of which almost all is repetition -- a table's cells have
 * byte-identical computed styles, and so do most of a page's divs. Interning the value vectors
 * turns each file into one property-name list, a handful of distinct vectors, and one integer per
 * element. The transform is lossless and `decodeStyles` is its inverse, which is what the unit
 * test pins.
 */
// dry-copy: visual-parity/styles — every copy of this region must match; `dev repo copies` checks it

/** One element as the dump identifies it. Not a selector -- a descriptor a human reads. */
export interface ElementRef {
  /** Position in document order among captured elements. The pairing key across two captures. */
  index: number;
  tag: string;
  id?: string;
  testId?: string;
  /** The class attribute with its tokens SORTED -- see `describeElement`. */
  className?: string;
}

/** The on-disk shape: property names once, distinct value vectors once, one vector id per element. */
export interface StyleDump {
  props: string[];
  vectors: string[][];
  elements: (ElementRef & { vector: number })[];
}

/** One element's computed styles as the browser handed them over, before interning. */
export interface RawElement extends ElementRef {
  values: string[];
}

/**
 * Intern the value vectors.
 *
 * The join used as the map key is newline-delimited rather than comma-delimited: a computed value
 * routinely contains a comma (`rgba(0, 0, 0, 0.5)`, a font stack, a multi-layer shadow), and a
 * delimiter that occurs in the data collides two different vectors into one -- which would make
 * two differently-styled elements compare equal in the diagnostic, in the one direction nobody
 * would think to check.
 */
export function encodeStyles(props: string[], elements: readonly RawElement[]): StyleDump {
  const vectors: string[][] = [];
  const byJoined = new Map<string, number>();
  const encoded = elements.map((element) => {
    const joined = element.values.join('\n');
    let vector = byJoined.get(joined);
    if (vector === undefined) {
      vector = vectors.length;
      vectors.push(element.values);
      byJoined.set(joined, vector);
    }
    const { values: _values, ...ref } = element;
    return { ...ref, vector };
  });
  return { props, vectors, elements: encoded };
}

/** The inverse of `encodeStyles`. */
export function decodeStyles(dump: StyleDump): RawElement[] {
  return dump.elements.map(({ vector, ...ref }) => ({ ...ref, values: dump.vectors[vector] ?? [] }));
}

/** One property that differs, on one element. */
export interface StyleDifference {
  element: ElementRef;
  property: string;
  a: string;
  b: string;
}

/** `div#main.card (#12)` -- what a difference is reported against. */
export function describeElement(ref: ElementRef): string {
  const id = ref.id ? `#${ref.id}` : '';
  const testId = ref.testId ? `[data-testid=${ref.testId}]` : '';
  const classes = ref.className ? `.${ref.className.split(/\s+/).filter(Boolean).slice(0, 6).join('.')}` : '';
  return `${ref.tag}${id}${testId}${classes} (#${ref.index})`;
}

/** What `diffStyles` found: structural notes, plus the property-level differences. */
export interface StyleDiff {
  notes: string[];
  differences: StyleDifference[];
}

/**
 * Every property difference between two dumps of the same shot, capped.
 *
 * PAIRED BY DOCUMENT INDEX, which is the honest choice and not the clever one: a selector-based
 * pairing would quietly re-pair elements across a structural change and report a hundred property
 * differences for what is really one inserted node. When the element counts differ at all, that IS
 * the finding, and it is reported as such and nothing further is compared -- a shifted index makes
 * every subsequent element look different and buries the one line that matters.
 *
 * THE TWO PROPERTY LISTS ARE EXPECTED TO DIFFER, which is why this intersects them rather than
 * refusing. Chromium enumerates REGISTERED custom properties alongside the longhands, and the
 * whole subject of this harness's first job is an upgrade that registers a hundred of its own
 * (`--tw-*`). A dump-to-dump comparison that stopped at "the property lists differ" would report
 * nothing useful on precisely the change it was built for; the added and removed names go in the
 * notes, and the properties both sides describe are compared as normal.
 */
export function diffStyles(a: StyleDump, b: StyleDump, limit = 40): StyleDiff {
  if (a.elements.length !== b.elements.length) {
    return {
      notes: [`element count differs: ${a.elements.length} vs ${b.elements.length} -- a node was added or removed, not restyled`],
      differences: []
    };
  }
  const notes: string[] = [];
  const indexB = new Map(b.props.map((property, index) => [property, index]));
  const shared: [string, number, number][] = [];
  for (const [indexInA, property] of a.props.entries()) {
    const inB = indexB.get(property);
    if (inB === undefined) notes.push(`property only in A: ${property}`);
    else shared.push([property, indexInA, inB]);
  }
  for (const property of b.props) if (!a.props.includes(property)) notes.push(`property only in B: ${property}`);

  const differences: StyleDifference[] = [];
  for (let i = 0; i < a.elements.length && differences.length < limit; i += 1) {
    const left = a.elements[i];
    const right = b.elements[i];
    if (left === undefined || right === undefined) break;
    const leftValues = a.vectors[left.vector];
    const rightValues = b.vectors[right.vector];
    if (leftValues === undefined || rightValues === undefined) continue;
    for (const [property, indexInA, indexInB] of shared) {
      if (differences.length >= limit) break;
      const leftValue = leftValues[indexInA] ?? '';
      const rightValue = rightValues[indexInB] ?? '';
      if (leftValue !== rightValue) {
        const { vector: _vector, ...ref } = left;
        differences.push({ element: ref, property, a: leftValue, b: rightValue });
      }
    }
  }
  return { notes: notes.slice(0, 20), differences };
}
// dry-copy-end
