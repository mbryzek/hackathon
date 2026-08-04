import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { SESSION_COOKIE } from '$lib/config';
import { urls } from '$lib/urls';

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
  default: async ({ cookies }) => {
    cookies.delete(SESSION_COOKIE, { path: '/' });
    throw redirect(303, urls.voteAdminLogin);
  }
} satisfies Actions;
