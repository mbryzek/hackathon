/**
 * SvelteKit server hooks
 *
 * Sets the security headers on every response the worker renders, and threads the admin
 * session cookie through to /vote/admin pages. Prerendered pages and static assets never
 * reach this hook — see `$lib/security-headers` for how they are covered.
 */

import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/config';
import { SECURITY_HEADERS } from '$lib/security-headers';

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/vote/admin')) {
    // Store the session ID in locals - pages will use it for API calls.
    // We don't validate here; let the API calls handle auth.
    const sessionId = event.cookies.get(SESSION_COOKIE);

    if (sessionId) {
      event.locals.adminSession = {
        id: sessionId
      };
    }
  }

  const response = await resolve(event);

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  return response;
};
