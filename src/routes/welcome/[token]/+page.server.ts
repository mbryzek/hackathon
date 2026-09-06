import type { Actions, PageServerLoad } from './$types';
import { isApiError } from '$lib/api/client';
import { platformApi } from '$lib/server/platformApi';
import { submitNewPassword } from '$lib/server/setPassword';

/**
 * Where the invitation link the platform mails lands — "Welcome, choose a password".
 *
 * THE PATH IS NOT OURS TO CHOOSE. `UserActivationProcessor` builds the link as
 * `<tenant frontend>/welcome/<token>` for every tenant, and this tenant's frontend is this site
 * (`tenants.domain` is `bthackathon.com`). `src/routes/emailedLinkRoutes.test.ts` pins the set.
 *
 * WHO REACHES IT: somebody invited to a hackathon account, who by definition cannot sign in
 * yet. The token in the URL is the whole credential and the page must render with no session.
 *
 * THE INVITATION IS READ, NOT SPENT, ON GET. `GET /activations/:token` only describes the
 * invitation, so a link scanner following the URL costs nothing; the token is consumed by the
 * form post, which a scanner does not make.
 */
export const prerender = false;

export const load: PageServerLoad = async ({ params }) => {
  const response = await platformApi.getActivation(params.token);

  if (isApiError(response)) {
    // 404 is an invitation already used or expired — the ordinary end of an old link. Anything
    // else leaves the invitation good, so the page says so and offers the link again rather
    // than telling somebody their invitation is gone when it is not.
    return { invitation: null, expired: response.status === 404 };
  }

  return {
    invitation: {
      name: response.data.name ?? null,
      email: response.data.email?.address ?? null
    },
    expired: false
  };
};

export const actions = {
  default: async (event) => submitNewPassword(event, (password) => platformApi.setActivationPassword(event.params.token, password))
} satisfies Actions;
