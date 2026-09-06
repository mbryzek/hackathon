/**
 * Reading and establishing the admin session, on the server and nowhere else.
 *
 * The session id is a bearer credential: anyone holding it is the admin until it expires.
 * It arrives in an httpOnly cookie precisely so that page scripts cannot read it, and it
 * must never be handed back out as page data — doing so put the same secret in the
 * hydration payload, where any script on the page could take it (ISS-788). So the id is
 * read here, used to call `$lib/server/adminApi`, and dropped; pages receive the answers,
 * never the credential.
 */

import { redirect, type Cookies } from '@sveltejs/kit';
import { isApiError, isApiSuccess, type ApiResponse } from '$lib/api/client';
import { SESSION_COOKIE, config } from '$lib/config';
import { adminApi } from '$lib/server/adminApi';
import { urls } from '$lib/urls';
import { isTenantSession, type SessionState } from '../../generated/com-bryzek-platform';

/**
 * How long a browser keeps the session id. The session itself expires on the platform's own
 * schedule; this only decides when the browser stops presenting it.
 */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * Remembers a session id in this browser.
 *
 * One place, because three different flows now mint a session — signing in, activating an
 * invitation, and completing a password reset — and a cookie written with different options in
 * each is three different sessions from the browser's point of view. `httpOnly` is the load
 * bearing one: it is what keeps page scripts away from a bearer credential (ISS-788).
 */
export function setSessionCookie(cookies: Cookies, sessionId: string): void {
  cookies.set(SESSION_COOKIE, sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

/**
 * Signs the holder of a freshly minted platform session in to the vote admin when that session
 * is one the vote admin will accept, and reports whether it did.
 *
 * The session the platform hands back from an activation or a password change is the same kind
 * of row `/vote/admin/sessions/logins` mints, so setting the cookie is the whole of a sign-in.
 * What it is NOT is a guarantee of access: the vote admin admits a hackathon user whose role is
 * Admin and nobody else, and `hooks.server.ts` clears the cookie on the 401 a non-admin's
 * session earns. Setting it unconditionally would bounce such a person between /vote/admin and
 * its login page holding a password they had just successfully set — so the session is offered
 * to the admin API first and the cookie is set only for the answer that means it works.
 *
 * A `user_inactive` state carries no session at all: nothing was minted, so there is nothing to
 * remember.
 */
export async function startAdminSessionIfAdmin(cookies: Cookies, state: SessionState): Promise<boolean> {
  if (!isTenantSession(state)) {
    return false;
  }

  const sessionId = state.session.id;
  if (!isApiSuccess(await adminApi.getSession(sessionId))) {
    return false;
  }

  setSessionCookie(cookies, sessionId);
  return true;
}

/** The part of a `RequestEvent` these need — every load and action has both. */
type SessionEvent = { locals: App.Locals; cookies: Cookies };

/** The session id for this request. There is no session-less admin page, so no session is a redirect. */
export function requireSessionId({ locals }: SessionEvent): string {
  const sessionId = locals.adminSession?.id;
  if (!sessionId) {
    throw redirect(303, urls.voteAdminLogin);
  }
  return sessionId;
}

/**
 * Clears the cookie the API has just rejected and sends the admin back to log in. Never
 * returns: leaving a dead cookie in place would send them round the layout's auth check
 * and straight back to the page that cannot load.
 */
function sessionExpired(cookies: Cookies): never {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  throw redirect(303, urls.voteAdminLogin);
}

/**
 * The banner a page shows for the first of these calls that failed, or null when they all
 * succeeded — in a `load` and in an action alike, the latter pairing it with `fail(status, …)`
 * so the action can also hand back whatever the admin had typed.
 *
 * A 401 never comes back from here: the session is gone, and the only thing that fixes that
 * is logging in again.
 */
export function firstError(event: SessionEvent, responses: ApiResponse<unknown>[], notFoundMessage: string = 'Not found'): string | null {
  for (const response of responses) {
    if (!isApiError(response)) continue;
    if (response.status === 401) sessionExpired(event.cookies);
    if (response.status === 404) return notFoundMessage;
    return response.errors[0]?.message || 'Something went wrong. Please try again.';
  }
  return null;
}
