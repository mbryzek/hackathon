/**
 * Reading the admin session, on the server and nowhere else.
 *
 * The session id is a bearer credential: anyone holding it is the admin until it expires.
 * It arrives in an httpOnly cookie precisely so that page scripts cannot read it, and it
 * must never be handed back out as page data — doing so put the same secret in the
 * hydration payload, where any script on the page could take it (ISS-788). So the id is
 * read here, used to call `$lib/server/adminApi`, and dropped; pages receive the answers,
 * never the credential.
 */

import { redirect, type Cookies } from '@sveltejs/kit';
import type { ApiResponse } from '$lib/api/client';
import { SESSION_COOKIE } from '$lib/config';
import { urls } from '$lib/urls';

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
    if (!response.errors) continue;
    if (response.status === 401) sessionExpired(event.cookies);
    if (response.status === 404) return notFoundMessage;
    return response.errors[0]?.message || 'Something went wrong. Please try again.';
  }
  return null;
}
