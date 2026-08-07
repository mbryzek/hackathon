import { goto, invalidateAll } from '$app/navigation';
import { urls } from '$lib/urls';

/**
 * Shared handling for an admin page whose session is gone.
 *
 * The four-line 401 block below was copy-pasted eight times across six pages, and the copies
 * had already drifted: the codes page's generate and delete handlers never checked 401 at all,
 * so a session that expired between page load and clicking Delete surfaced a raw error string
 * instead of sending the admin to the login page.
 */

/** Shown when a page loads with no session at all, instead of leaving a spinner up forever. */
export const EXPIRED_SESSION_MESSAGE = 'Your session has expired. Please sign in again.';

/**
 * Sends the admin to the login page if any of `responses` came back 401, and reports whether
 * it did. Callers `return` on true.
 *
 * `invalidateAll()` first so the layout's server load re-runs and drops the dead session from
 * page data — without it, navigating back would rehydrate the same expired id.
 */
export async function redirectIfUnauthorized(...responses: { status: number }[]): Promise<boolean> {
  if (!responses.some((response) => response.status === 401)) return false;

  await invalidateAll();
  await goto(urls.voteAdminLogin);
  return true;
}
