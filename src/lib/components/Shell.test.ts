// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet, flushSync } from 'svelte';
import { mountComponent } from '#lib/test/mount.ts';
import { urls } from '#lib/urls.ts';
import Shell from './Shell.svelte';

const location = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('$app/state', () => ({
  page: {
    get url() {
      return new URL(`https://bthackathon.com${location.pathname}`);
    }
  }
}));

const children = createRawSnippet(() => ({ render: () => '<p>content</p>' }));

function render(pathname: string): HTMLElement {
  location.pathname = pathname;
  return mountComponent(Shell, { title: 'Prizes', children }).target;
}

const current = (root: Element) => [...root.querySelectorAll('a[aria-current="page"]')].map((a) => a.textContent?.trim());

describe('Shell', () => {
  it('marks a year landing page current, at the path SvelteKit serves it from', () => {
    const target = render('/Y26');
    expect(current(target.querySelector('#mobile-menu') as Element)).toEqual(['2026', 'Event']);
  });

  it('marks a sub-page current without marking its year as the page', () => {
    const target = render('/Y25/prizes');
    expect(current(target.querySelector('#mobile-menu') as Element)).toEqual(['Prizes']);
  });

  it('takes the closed mobile menu out of the tab order, and puts it back when opened', () => {
    const target = render('/mission');
    const menu = target.querySelector('#mobile-menu') as HTMLElement;
    expect(menu.inert).toBe(true);

    (target.querySelector('button[aria-controls="mobile-menu"]') as HTMLElement).click();
    flushSync();
    expect(menu.inert).toBe(false);
  });

  it('titles the document after the page', () => {
    render('/mission');
    flushSync();
    expect(document.title).toBe('Prizes — Bergen Tech Hackathon');
  });
});

describe('urls', () => {
  it('names internal pages without the trailing slash SvelteKit redirects away', () => {
    const internal = Object.values(urls).filter((url) => url.startsWith('/') && url !== '/');
    expect(internal.filter((url) => url.endsWith('/'))).toEqual([]);
  });
});
