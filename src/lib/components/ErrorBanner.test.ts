// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount } from 'svelte';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ErrorBanner from './ErrorBanner.svelte';

let mounted: Record<string, unknown> | null = null;
let target: HTMLElement;

function render(props: { message: string; class?: string }): void {
  target = document.createElement('div');
  document.body.appendChild(target);
  mounted = mount(ErrorBanner, { target, props });
}

/** The element throws rather than optional-chaining: a `?.` here would compare `undefined`
 * and report the value it wanted instead of the element that went away (ISS-1596). */
function banner(): HTMLElement {
  const el = target.querySelector('div');
  if (!el) throw new Error('ErrorBanner rendered no element.');
  return el;
}

afterEach(() => {
  if (mounted) unmount(mounted);
  mounted = null;
  target?.remove();
});

describe('ErrorBanner', () => {
  it('announces itself, which is the whole reason it exists', () => {
    render({ message: 'Something went wrong.' });
    // Eleven admin copies of this markup carried no role, so a failed action was silent to a
    // screen reader: the banner swaps in without a navigation and focus never moves to it.
    expect(banner().getAttribute('role')).toBe('alert');
  });

  it('renders the message', () => {
    render({ message: 'Event not found' });
    expect(banner().textContent?.trim()).toBe('Event not found');
  });

  it('keeps the shared look and appends the caller-supplied layout classes', () => {
    render({ message: 'x', class: 'mb-6' });
    const classes = banner().className;
    expect(classes).toContain('bg-red-50');
    expect(classes).toContain('mb-6');
  });

  it('needs no layout class', () => {
    render({ message: 'x' });
    expect(banner().className).not.toContain('undefined');
  });
});

/**
 * The component only helps while it is the one copy. This is what fails when a fourteenth is
 * pasted in — the failure mode being fixed here was not that the markup was duplicated, it was
 * that eleven of the duplicates silently lacked `role="alert"`, which nothing detected for
 * months.
 */
function svelteFilesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return svelteFilesUnder(path);
    return path.endsWith('.svelte') ? [path] : [];
  });
}

describe('no hand-rolled error banners', () => {
  // `process.cwd()` is the project root under vitest. `import.meta.url` is not usable here:
  // in the jsdom environment it resolves to a vite-style `/src/...` path rather than a file url.
  const SRC = join(process.cwd(), 'src');
  const MARKUP = 'bg-red-50 border border-red-200';

  it('is the only definition of the error-banner markup in src/', () => {
    const offenders = svelteFilesUnder(SRC)
      .filter((path) => readFileSync(path, 'utf8').includes(MARKUP))
      .map((path) => path.slice(SRC.length + 1));

    expect(offenders).toEqual(['lib/components/ErrorBanner.svelte']);
  });
});
