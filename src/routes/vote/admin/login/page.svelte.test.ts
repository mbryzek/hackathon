// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { mountComponent } from '$lib/test/mount';
import { urls } from '$lib/urls';
import LoginPage from './+page.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

/**
 * The sign-in page is the only place a locked-out admin looks. A reset page nothing links to is
 * a page nobody finds: before this link existed the only route to a reset was a platform admin
 * triggering one by hand.
 */
describe('the vote admin sign-in page', () => {
  it('links to the forgot-password page', () => {
    const target = mountComponent(LoginPage, { form: null }).target;
    const hrefs = [...target.querySelectorAll('a')].map((a) => a.getAttribute('href'));

    expect(hrefs).toContain(urls.passwordResetRequest);
  });
});
