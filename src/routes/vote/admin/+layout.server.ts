import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { urls } from '#lib/urls.ts';

/** Who is signed in, as the account menu and the profile page show them. */
export interface SignedInAdmin {
  name: string | null;
  email: string | null;
}

/**
 * The auth gate for every admin route, and the signed-in admin's name and email.
 *
 * It never returns the session id. Returning `locals.adminSession` whole put the credential the
 * httpOnly cookie exists to hide into the hydration payload of every admin page, where any
 * script could read it (ISS-788). The id stays on the server: each page's own `load` and actions
 * read it from the cookie via `#lib/server/adminSession.ts` and hand the browser the answers
 * instead. The name and email are such an answer.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Don't require auth for login page
  if (url.pathname === urls.voteAdminLogin) {
    return { admin: null };
  }

  // Require authentication for all other admin pages
  const session = locals.adminSession;
  if (!session) {
    throw redirect(303, urls.voteAdminLogin);
  }

  const admin: SignedInAdmin = { name: session.name ?? null, email: session.email ?? null };
  return { admin };
};
