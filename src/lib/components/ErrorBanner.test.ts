// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount } from 'svelte';
import ErrorBanner from './ErrorBanner.svelte';

let mounted: Record<string, unknown> | null = null;
let target: HTMLElement;

function render(props: { error: string; class?: string }): HTMLElement {
  target = document.createElement('div');
  document.body.appendChild(target);
  mounted = mount(ErrorBanner, { target, props });
  return target.firstElementChild as HTMLElement;
}

afterEach(async () => {
  if (mounted) await unmount(mounted);
  mounted = null;
  target?.remove();
});

describe('ErrorBanner', () => {
  it('announces itself, so a screen-reader user is told the page or submission failed', () => {
    const banner = render({ error: 'Invalid code' });

    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.textContent?.trim()).toBe('Invalid code');
  });

  it('appends caller classes without dropping the banner styling', () => {
    const banner = render({ error: 'Nope', class: 'mb-6' });

    expect(banner.classList.contains('mb-6')).toBe(true);
    expect(banner.classList.contains('bg-red-50')).toBe(true);
  });
});
