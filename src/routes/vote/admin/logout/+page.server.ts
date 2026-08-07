import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { SESSION_COOKIE } from '$lib/config';
import { urls } from '$lib/urls';
import { adminApi } from '$lib/server/adminApi';

/**
 * Logging out is destructive, so it must never happen on a GET. `app.html` sets
 * `data-sveltekit-preload-data="hover"`, which makes SvelteKit fetch a route's load
 * function as soon as the user hovers its link — a `load` that cleared the cookie here
 * logged the admin out just for pointing at the Logout link. A GET is also trivially
 * forgeable from another origin (an `<img src>` is enough). The cookie is only cleared
 * by the POST action below.
 */
export const load: PageServerLoad = async () => {
  throw redirect(303, urls.voteAdmin);
};

export const actions = {
  default: async ({ cookies, locals }) => {
    const sessionId = locals.adminSession?.id;

    // Deleting the cookie only makes THIS browser forget the session id; the session itself
    // stays valid on the API until it expires (8 hours, per the login action's maxAge). Any
    // copy of the id that got out — a proxy or access log, a shared machine, the value the
    // admin pages read from `data.adminSession.id` in client-side JS — would keep working
    // after a logout that only cleared the cookie. Delete the session server-side too.
    //
    // The result is deliberately ignored rather than surfaced: the admin asked to leave, and
    // an API hiccup must not strand them in a logged-in-looking state. `adminApi.logout`
    // funnels every failure into a returned ApiResponse instead of throwing, so the cookie
    // delete and the redirect below always run — a failed call degrades to exactly the old
    // cookie-only behaviour.
    if (sessionId) {
      await adminApi.logout(sessionId);
    }

    cookies.delete(SESSION_COOKIE, { path: '/' });
    throw redirect(303, urls.voteAdminLogin);
  }
} satisfies Actions;
