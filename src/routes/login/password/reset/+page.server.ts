import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { isApiError, safeErrorStatus } from '$lib/api/client';
import { platformApi } from '$lib/server/platformApi';

/**
 * "I forgot my password" — the request half of the reset the platform mails. Its landing page is
 * the sibling `[token]` route, which the platform's own link points at.
 *
 * THE OUTCOME MUST NOT DEPEND ON WHETHER THE ADDRESS HAS AN ACCOUNT. `POST
 * /tenant/:tenant_id/session/password/resets` answers 204 either way for exactly that reason,
 * and a page that said "no such account" for one of them would hand anybody an oracle for which
 * addresses hold hackathon accounts. So a successful call returns the same acknowledgement for
 * every address, and the only errors the page ever shows are ones the address's OWNERSHIP
 * cannot be read out of: an empty field, the platform's blank-email refusal, the rate limit, or
 * the API being unreachable.
 *
 * THERE IS NO `load` AND NO AUTH GATE. Whoever needs this page cannot sign in — that is what
 * they are here about — so a redirect for a signed-in admin would only make the page harder to
 * reach without protecting anything.
 */
export const prerender = false;

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString().trim() ?? '';

    if (email === '') {
      return fail(400, { error: 'Enter your email address.', email, sent: false });
    }

    const response = await platformApi.requestPasswordReset(email);
    if (isApiError(response)) {
      return fail(safeErrorStatus(response.status), {
        error: response.errors[0]?.message || 'Something went wrong. Please try again.',
        email,
        sent: false
      });
    }

    return { error: null, email, sent: true };
  }
} satisfies Actions;
