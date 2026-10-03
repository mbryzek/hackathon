// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { mountComponent } from '$lib/test/mount';
import { urls } from '$lib/urls';
import WelcomePage from './+page.svelte';
import type { PageData } from './$types';

/** `use:enhance` needs `$app/forms`; nothing here submits, so the directive is a no-op. */
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

function render(data: PageData): HTMLElement {
  return mountComponent(WelcomePage, { data, form: null }).target;
}

describe('the invitation page', () => {
  it('takes a first password for a live invitation', () => {
    const target = render({ invitation: { name: 'Ada', email: null }, expired: false } as PageData);

    expect(target.querySelector('h1')?.textContent).toBe('Welcome to the Bergen Tech Hackathon');
    expect(target.textContent).toContain('finish setting up your account, Ada.');
    expect(target.querySelectorAll('input[type="password"]').length).toBe(2);
  });

  it.each([
    [true, 'welcome-expired', 'This invitation is no longer valid'],
    [false, 'welcome-unavailable', 'We could not open your invitation']
  ])('reports an unusable invitation (expired: %s) as a status notice and no form', (expired, testid, heading) => {
    const target = render({ invitation: null, expired } as PageData);
    const notice = target.querySelector(`[data-testid="${testid}"]`);

    expect(notice?.getAttribute('role')).toBe('status');
    expect(notice?.querySelector('h1')?.textContent).toBe(heading);
    expect(target.querySelector('form')).toBeNull();
    expect([...target.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toContain(urls.index);
  });
});
