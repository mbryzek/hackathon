// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createRawSnippet } from 'svelte';
import { mountComponent } from '$lib/test/mount';
import Modal from './Modal.svelte';

const POSITIONED = ['relative', 'absolute', 'fixed', 'sticky'];

function render(size: 'sm' | 'md' | 'lg' = 'md'): HTMLElement {
  return mountComponent(Modal, {
    open: true,
    onclose: () => {},
    size,
    children: createRawSnippet(() => ({ render: () => '<div>Body</div>' }))
  }).target;
}

/**
 * jsdom does no layout, so the containing block is asserted structurally: an absolutely
 * positioned element resolves against its nearest ancestor that is itself positioned.
 */
function nearestPositionedAncestor(el: HTMLElement): HTMLElement {
  let node = el.parentElement;
  while (node && node !== document.body) {
    if (POSITIONED.some((cls) => node!.classList.contains(cls))) return node;
    node = node.parentElement;
  }
  throw new Error('No positioned ancestor found.');
}

describe('Modal close button placement', () => {
  it('resolves against the modal card, not the full-viewport backdrop', () => {
    const target = render('md');

    const close = target.querySelector('button[aria-label="Close modal"]') as HTMLElement;
    expect(close.classList.contains('absolute')).toBe(true);

    const container = nearestPositionedAncestor(close);

    // The card. Were this the backdrop instead, `top-4 right-4` would put the X in the corner
    // of the browser window rather than the corner of the dialog.
    expect(container.classList.contains('max-w-md')).toBe(true);
    expect(container.classList.contains('inset-0')).toBe(false);
  });

  it('keeps the card positioned at every size', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const target = render(size);
      const card = target.querySelector(`.max-w-${size}`) as HTMLElement;
      expect(card.classList.contains('relative')).toBe(true);
    }
  });
});
