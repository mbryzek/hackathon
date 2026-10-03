// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { mountComponent } from '$lib/test/mount';
import { urls } from '$lib/urls';
import VerificationPage from './+page.svelte';
import type { PageData } from './$types';

function render(outcome: PageData['outcome']): HTMLElement {
  return mountComponent(VerificationPage, { data: { outcome, retryUrl: '/email/verifications/abc' } as PageData }).target;
}

describe('the email verification page', () => {
  it.each([
    ['verified', 'email-verification-verified', 'Email verified'],
    ['invalid', 'email-verification-invalid', 'This link is no longer valid'],
    ['unavailable', 'email-verification-unavailable', 'We could not verify your email']
  ] as const)('reports %s as a status notice headed by the page heading', (outcome, testid, heading) => {
    // The notice is the whole of the page's answer, so it is announced and carries the `<h1>`.
    const notice = render(outcome).querySelector(`[data-testid="${testid}"]`);

    expect(notice?.getAttribute('role')).toBe('status');
    expect(notice?.querySelector('h1')?.textContent).toBe(heading);
  });

  it('offers the same link again only when the failure was ours', () => {
    const retries = (outcome: PageData['outcome']) =>
      [...render(outcome).querySelectorAll('a')].filter((a) => a.getAttribute('href') === '/email/verifications/abc').length;

    expect(retries('unavailable')).toBe(1);
    expect(retries('invalid')).toBe(0);
  });

  it('offers a way back to the hackathon site', () => {
    const hrefs = [...render('verified').querySelectorAll('a')].map((a) => a.getAttribute('href'));

    expect(hrefs).toContain(urls.index);
  });
});
