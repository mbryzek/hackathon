import type { PageServerLoad } from './$types';
import { isApiSuccess } from '$lib/api/client';
import { platformApi } from '$lib/server/platformApi';

/**
 * Where the "Verify your email" link the platform mails lands.
 *
 * THE PATH IS NOT OURS TO CHOOSE. `EmailVerificationProcessor` builds the link as
 * `<tenant frontend>/email/verifications/<token>` for every tenant, and this tenant's frontend
 * is this site (`tenants.domain` is `bthackathon.com`), so the route has to sit at exactly that
 * spelling — anything else is a 404 for everyone who clicks, and nothing on the platform can
 * see it happen: the mail is sent, the task completes, and the dead end is in a browser nobody
 * is watching. `src/routes/emailedLinkRoutes.test.ts` pins the whole set of mailed paths.
 *
 * WHO REACHES IT: every person the platform holds an email address for is mailed this link, and
 * `InternalPeopleDao` asks for one by default — so the recipient may have no account at all and
 * the page must render with no session.
 *
 * SPENDING THE TOKEN ON GET IS DELIBERATE. A link scanner that follows the URL produces exactly
 * the state the recipient clicked for, and the URL can only be reached from mail delivered to
 * the address being proven. The platform leaves the token usable after it is spent, so a
 * refresh, a second click and a scanner's fetch-then-click all land on the same "verified".
 */
export const prerender = false;

type VerificationOutcome = 'verified' | 'invalid' | 'unavailable';

export const load: PageServerLoad = async ({ params, url }) => {
  const response = await platformApi.verifyEmail(params.token);

  // 404 is the token resolving to nothing, which is what an old or superseded link looks like
  // and is not a fault. Everything else — the API down, a gateway in the way — leaves the link
  // good, so it is worth offering again rather than telling somebody their link is dead.
  const outcome: VerificationOutcome = isApiSuccess(response) ? 'verified' : response.status === 404 ? 'invalid' : 'unavailable';

  return {
    outcome,
    // The same URL, for the retry link on a transient failure. Carried from the load rather than
    // read from `$app/state` so the retry works with no JavaScript.
    retryUrl: url.pathname
  };
};
