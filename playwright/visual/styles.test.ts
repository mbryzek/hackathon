// dry-copy: sveltekit/visual-parity-styles-test — every copy of this region must match; `dev repo copies` checks it (ISS-3894)
import { describe, expect, it } from 'vitest';
import { decodeStyles, describeElement, diffStyles, encodeStyles, type RawElement } from './styles.ts';

const PROPS = ['color', 'border-color'];

function element(index: number, values: string[], extra: Partial<RawElement> = {}): RawElement {
  return { index, tag: 'div', values, ...extra };
}

describe('encodeStyles / decodeStyles', () => {
  it('round-trips', () => {
    const elements = [element(0, ['red', 'blue']), element(1, ['red', 'blue'], { id: 'main' }), element(2, ['green', 'blue'])];
    expect(decodeStyles(encodeStyles(PROPS, elements))).toEqual(elements);
  });

  it('stores one vector per distinct style, which is what makes a capture fit on disk', () => {
    const dump = encodeStyles(PROPS, [element(0, ['red', 'blue']), element(1, ['red', 'blue']), element(2, ['green', 'blue'])]);
    expect(dump.vectors).toHaveLength(2);
    expect(dump.elements.map((e) => e.vector)).toEqual([0, 0, 1]);
  });

  /**
   * A computed value routinely contains a comma (`rgba(0, 0, 0, 0.5)`, a font stack), so a
   * comma-joined intern key would collide two different vectors into one -- and two
   * differently-styled elements would then compare EQUAL in the diagnostic.
   */
  it('does not collide two vectors whose values contain the delimiter', () => {
    const dump = encodeStyles(PROPS, [element(0, ['a,b', 'c']), element(1, ['a', 'b,c'])]);
    expect(dump.vectors).toHaveLength(2);
  });
});

describe('diffStyles', () => {
  it('finds nothing when the dumps agree', () => {
    const dump = encodeStyles(PROPS, [element(0, ['red', 'blue'])]);
    expect(diffStyles(dump, dump)).toEqual({ notes: [], differences: [] });
  });

  it('names the element and the property that moved', () => {
    const a = encodeStyles(PROPS, [element(0, ['red', 'blue'], { className: 'card' })]);
    const b = encodeStyles(PROPS, [element(0, ['red', 'black'], { className: 'card' })]);
    expect(diffStyles(a, b).differences).toEqual([
      { element: { index: 0, tag: 'div', className: 'card' }, property: 'border-color', a: 'blue', b: 'black' }
    ]);
  });

  it('reports a structural change as one line rather than as a hundred property differences', () => {
    const a = encodeStyles(PROPS, [element(0, ['red', 'blue'])]);
    const b = encodeStyles(PROPS, [element(0, ['red', 'blue']), element(1, ['red', 'blue'])]);
    expect(diffStyles(a, b).notes).toEqual(['element count differs: 1 vs 2 -- a node was added or removed, not restyled']);
    expect(diffStyles(a, b).differences).toEqual([]);
  });

  /**
   * The upgrade this harness was built for registers ~100 custom properties of its own, which
   * Chromium then enumerates alongside the longhands. Refusing to compare on that basis would
   * report nothing useful on precisely the change the harness exists for.
   */
  it('compares the properties both sides describe and notes the ones only one side has', () => {
    const a = encodeStyles(['color', 'border-color'], [element(0, ['red', 'blue'])]);
    const b = encodeStyles(['border-color', '--tw-shadow', 'color'], [element(0, ['black', 'none', 'red'])]);
    const diff = diffStyles(a, b);
    expect(diff.notes).toEqual(['property only in B: --tw-shadow']);
    expect(diff.differences.map((difference) => [difference.property, difference.a, difference.b])).toEqual([
      ['border-color', 'blue', 'black']
    ]);
  });

  it('caps how much it prints', () => {
    const props = Array.from({ length: 100 }, (_unused, index) => `p${index}`);
    const a = encodeStyles(props, [
      element(
        0,
        props.map(() => 'a')
      )
    ]);
    const b = encodeStyles(props, [
      element(
        0,
        props.map(() => 'b')
      )
    ]);
    expect(diffStyles(a, b, 5).differences).toHaveLength(5);
  });
});

describe('describeElement', () => {
  it('reads as a selector a human can find', () => {
    expect(describeElement({ index: 7, tag: 'button', id: 'save', testId: 'save-button', className: 'btn primary' })).toBe(
      'button#save[data-testid=save-button].btn.primary (#7)'
    );
  });
});
// dry-copy-end
