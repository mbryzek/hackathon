// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'svelte';
import { mountComponent } from '$lib/test/mount';
import Button from './Button.svelte';

type Props = ComponentProps<typeof Button>;

function render(props: Props): HTMLElement {
  return mountComponent(Button, props).target.firstElementChild as HTMLElement;
}

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    expect(render({ label: 'Go' }).getAttribute('type')).toBe('button');
  });

  it('renders a submit button when asked', () => {
    expect(render({ label: 'Save', type: 'submit' }).getAttribute('type')).toBe('submit');
  });

  it('styles the vote variant yellow-400 on gray-900, bold and flat', () => {
    const classes = render({ label: 'Vote', variant: 'vote' }).classList;
    expect(classes).toContain('bg-yellow-400');
    expect(classes).toContain('text-gray-900');
    expect(classes).toContain('font-bold');
    expect(classes).not.toContain('shadow-md');
    expect(classes).not.toContain('hover:scale-105');
  });

  it('keeps the marketing primary variant as it was', () => {
    const classes = render({ label: 'Donate' }).classList;
    expect(classes).toContain('bg-yellow-500');
    expect(classes).toContain('text-white');
    expect(classes).toContain('font-semibold');
    expect(classes).toContain('shadow-md');
  });

  it('disables the button and shows a spinner while loading', () => {
    const button = render({ label: 'Saving...', variant: 'vote', loading: true }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.querySelector('svg.animate-spin')).not.toBeNull();
    expect(button.classList).toContain('opacity-50');
  });

  it('renders a link with the test id when given an href', () => {
    const link = render({ label: 'More', href: '/x', external: true, testId: 'cta', variant: 'vote' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('data-testid')).toBe('cta');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
