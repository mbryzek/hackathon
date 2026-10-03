// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { anEvent } from '$lib/test/fixtures';
import { mountComponent } from '$lib/test/mount';
import { submit } from '$lib/test/enhance';
import BulkPage from './+page.svelte';
import type { ActionData, PageData } from './$types';

vi.mock('$app/state', () => ({
  page: { params: { id: 'evt-1' }, url: new URL('http://localhost/vote/admin/events/evt-1/projects/bulk') }
}));
vi.mock('$app/forms', async () => ({ enhance: (await import('$lib/test/enhance')).captureEnhance }));

function render() {
  const data = { event: anEvent(), error: null } as unknown as PageData;
  return mountComponent(BulkPage, { data, form: null as ActionData });
}

function controls(target: HTMLElement) {
  return {
    textarea: target.querySelector<HTMLTextAreaElement>('#csv-data')!,
    button: target.querySelector<HTMLButtonElement>('button[type="submit"]')!
  };
}

describe('the bulk add projects page', () => {
  it('disables the form while the action is in flight and re-enables it after a failure', async () => {
    const { target, settle } = render();
    await settle();
    expect(controls(target).button.disabled).toBe(false);

    const submission = await submit();
    await settle();
    expect(controls(target).button.disabled).toBe(true);
    expect(controls(target).textarea.disabled).toBe(true);
    expect(controls(target).button.textContent).toContain('Adding Projects...');

    await expect(submission.settle(new Error('network'))).rejects.toThrow('network');
    await settle();
    expect(controls(target).button.disabled).toBe(false);
    expect(controls(target).textarea.disabled).toBe(false);
  });

  it('keeps the pasted CSV after the action, as it always has', async () => {
    const { settle } = render();
    await settle();

    const submission = await submit();
    expect(await submission.settle()).toEqual({ reset: false });
  });
});
