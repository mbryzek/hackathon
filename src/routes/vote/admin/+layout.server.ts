import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { urls } from '$lib/urls';

/**
 * The auth gate for every admin route.
 *
 * It deliberately returns nothing. It used to return `locals.adminSession` — the raw session
 * id — as page data, which put the credential the httpOnly cookie exists to hide into the
 * hydration payload of every admin page, where any script could read it (ISS-788). The id now
 * stays on the server: each page's own `load` and actions read it from the cookie via
 * `$lib/server/adminSession` and hand the browser the answers instead.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Don't require auth for login page
  if (url.pathname === urls.voteAdminLogin) {
    return;
  }

  // Require authentication for all other admin pages
  if (!locals.adminSession) {
    throw redirect(303, urls.voteAdminLogin);
  }
};
