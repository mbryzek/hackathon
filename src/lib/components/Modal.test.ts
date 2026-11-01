// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createRawSnippet, flushSync } from 'svelte';
import { mountComponent } from '#lib/test/mount.ts';
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

describe('Modal focus', () => {
  const button = (name: string): HTMLElement => document.querySelector(`[aria-label="${name}"]`) as HTMLElement;
  const dialog = (): HTMLElement => document.querySelector('[role="dialog"]') as HTMLElement;

  function pressTab(shiftKey = false): void {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true }));
    flushSync();
  }

  it('moves focus into the dialog when it opens and names it', () => {
    render();
    flushSync();
    expect(document.activeElement).toBe(dialog());
    expect(dialog().getAttribute('aria-label')).toBe('Photo viewer');
  });

  it('keeps Tab inside the dialog', () => {
    render();
    flushSync();
    const close = button('Close modal');

    pressTab(true);
    expect(document.activeElement).toBe(close);

    pressTab();
    expect(document.activeElement).toBe(close);
  });

  it('gives focus back to what opened it when it closes', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = mountComponent(Modal, {
      open: true,
      onclose: () => {},
      children: createRawSnippet(() => ({ render: () => '<div>Body</div>' }))
    });
    flushSync();
    expect(document.activeElement).not.toBe(opener);

    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
