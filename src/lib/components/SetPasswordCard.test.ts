// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { mountComponent } from '$lib/test/mount';
import { submit } from '$lib/test/enhance';
import SetPasswordCard from './SetPasswordCard.svelte';

vi.mock('$app/forms', async () => ({ enhance: (await import('$lib/test/enhance')).captureEnhance }));

describe('SetPasswordCard', () => {
  it('disables the form while the action is in flight and re-enables it after a failure', async () => {
    const { target, settle } = mountComponent(SetPasswordCard, { heading: 'Choose a password', submitLabel: 'Set password' });
    await settle();
    const button = () => target.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const password = () => target.querySelector<HTMLInputElement>('#password')!;
    expect(button().disabled).toBe(false);

    const submission = await submit();
    await settle();
    expect(button().disabled).toBe(true);
    expect(password().disabled).toBe(true);
    expect(button().textContent).toContain('Saving...');

    await expect(submission.settle(new Error('network'))).rejects.toThrow('network');
    await settle();
    expect(button().disabled).toBe(false);
    expect(password().disabled).toBe(false);
    expect(button().textContent).toContain('Set password');
  });
});
