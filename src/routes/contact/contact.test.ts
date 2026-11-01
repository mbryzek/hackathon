// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountComponent } from '#lib/test/mount.ts';
import ContactPage from './+page.svelte';

vi.mock('$app/state', () => ({ page: { url: new URL('https://bthackathon.com/contact') } }));

function stubClipboard(writeText: () => Promise<void>, execCommand: () => boolean): void {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
}

async function clickCopy(): Promise<string> {
  const { target, settle } = mountComponent(ContactPage, {});
  const button = [...target.querySelectorAll('button')].find((b) => b.textContent?.includes('Copy')) as HTMLElement;
  button.click();
  await settle();
  return button.textContent?.trim() ?? '';
}

describe('contact page copy button', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('says Copied when the clipboard took it', async () => {
    stubClipboard(
      () => Promise.resolve(),
      () => false
    );
    expect(await clickCopy()).toBe('Copied!');
  });

  it('says Copied when the fallback took it', async () => {
    stubClipboard(
      () => Promise.reject(new Error('denied')),
      () => true
    );
    expect(await clickCopy()).toBe('Copied!');
  });

  it('does not claim a copy that failed both ways', async () => {
    stubClipboard(
      () => Promise.reject(new Error('denied')),
      () => false
    );
    expect(await clickCopy()).toBe('Copy');
  });
});
