// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { mountComponent } from '$lib/test/mount';
import { urls } from '$lib/urls';
import ForgotPasswordPage from './+page.svelte';
import type { ActionData } from './$types';

/** `use:enhance` needs `$app/forms`; nothing here submits, so the directive is a no-op. */
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy: () => {} }) }));

function render(form: ActionData): HTMLElement {
  return mountComponent(ForgotPasswordPage, { form }).target;
}

describe('the forgot-password page', () => {
  it('offers an email field and no password field', async () => {
    // Whoever is here cannot sign in. A password field would be asking for the thing they came
    // to say they have lost.
    const target = render(null);

    expect(target.querySelector('input[name="email"]')).not.toBeNull();
    expect(target.querySelector('input[type="password"]')).toBeNull();
  });

  it('says the same thing about an address with an account and one without', async () => {
    // The server answers both identically (see `page.server.test.ts`); this is the other half —
    // the rendered words must not vary either, or the page becomes the oracle the 204 avoids.
    const known = render({ error: null, email: 'admin@example.com', sent: true } as ActionData).textContent ?? '';
    const unknown = render({ error: null, email: 'admin@example.com', sent: true } as ActionData).textContent ?? '';

    expect(known).toBe(unknown);
    expect(known).toContain('If admin@example.com has a hackathon account');
  });

  it('replaces the form with the acknowledgement once the request went through', async () => {
    // Leaving the form up invites a second request, and every request invalidates the link the
    // first one mailed.
    const target = render({ error: null, email: 'admin@example.com', sent: true } as ActionData);

    expect(target.querySelector('form')).toBeNull();
  });

  it('keeps the address and shows the message when the request was refused', async () => {
    const target = render({ error: 'Email cannot be blank', email: 'oops', sent: false } as ActionData);

    expect(target.textContent).toContain('Email cannot be blank');
    expect(target.querySelector<HTMLInputElement>('input[name="email"]')?.value).toBe('oops');
  });

  it('offers a way back to sign in', async () => {
    const hrefs = [...render(null).querySelectorAll('a')].map((a) => a.getAttribute('href'));

    expect(hrefs).toContain(urls.voteAdminLogin);
  });
});
