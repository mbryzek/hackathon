/**
 * SvelteKit server hooks
 *
 * Sets the security headers on every response the worker renders, and establishes the admin
 * session for /vote/admin pages. Prerendered pages and static assets never reach this hook —
 * see `$lib/security-headers` for how they are covered.
 */

import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/config';
import { SECURITY_HEADERS } from '$lib/security-headers';
import { adminApi } from '$lib/server/adminApi';

const ADMIN_PATH_PREFIX = '/vote/admin';

/**
 * Establishes `locals.adminSession` for an admin request, meaning "a session the API
 * confirmed" rather than "a cookie exists" (ISS-792).
 *
 * The distinction is what keeps the login page reachable. A cookie that outlives its
 * server-side session — logged out on another device, revoked, or simply older than the
 * session's own TTL — used to set `locals.adminSession` on its mere presence, and
 * `/vote/admin/login` redirects to `/vote/admin` whenever that is set. Nothing in that path
 * cleared the cookie, so the admin bounced between the two with the login form permanently
 * out of reach.
 *
 * This has to happen in the hook rather than in `+layout.server.ts`: SvelteKit runs the
 * layout and page loads concurrently, so a layout clearing the session would race the login
 * page's own load and decide nothing. The hook runs strictly before both.
 *
 * Only a 401 signs the admin out. Any other failure keeps the session and lets the page's
 * own API calls surface the problem — a platform blip must not log every admin out.
 */
async function resolveAdminSession(event: Parameters<Handle>[0]['event']): Promise<void> {
  const sessionId = event.cookies.get(SESSION_COOKIE);
  if (!sessionId) return;

  const response = await adminApi.getSession(sessionId);

  if (response.status === 401) {
    event.cookies.delete(SESSION_COOKIE, { path: '/' });
    return;
  }

  event.locals.adminSession = { id: sessionId };
}

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith(ADMIN_PATH_PREFIX)) {
    await resolveAdminSession(event);
  }

  const response = await resolve(event);

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  return response;
};
