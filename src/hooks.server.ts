/**
 * SvelteKit server hooks
 *
 * Sets the security headers on every response the worker renders, establishes the admin
 * session for /vote/admin pages, and logs every unexpected server error under an id the error
 * page shows the user. Prerendered pages and static assets never reach this hook —
 * see `#lib/security-headers.ts` for how they are covered.
 */

import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, config } from '#lib/config.ts';
import { SECURITY_HEADERS } from '#lib/security-headers.ts';
import { adminApi } from '#lib/server/adminApi.ts';
import { clearSessionCookie } from '#lib/server/adminSession.ts';

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
    clearSessionCookie(event.cookies);
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

/**
 * Every error a request raises passes through here, expected ones included: an `error()` this
 * app threw on purpose, a framework error such as an unmatched route, a validation failure.
 * Those keep the status and message SvelteKit already gave them and are not logged — a 404 is
 * traffic, not a fault.
 *
 * Only an unknown error — something thrown by this app's own code — is logged, as one
 * `[Server Error]` line carrying the `errorId` the error page shows. Workers Logs retains that
 * line, so a user quoting the id names exactly one failure in
 * `dev obs worker-logs --app hackathon`.
 */
export const handleError: HandleServerError = (caught) => {
  if (caught.kind !== 'unknown') return;

  const { error, event } = caught;
  const errorId = crypto.randomUUID();

  console.error('[Server Error]', {
    errorId,
    method: event.request.method,
    path: event.url.pathname,
    route: event.route.id,
    error
  });

  return {
    message: config.isProduction
      ? 'An unexpected error occurred. Please try again.'
      : error instanceof Error
        ? error.message
        : 'Unknown error',
    errorId
  };
};
