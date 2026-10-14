/**
 * SvelteKit server hooks
 *
 * Sets the security headers on every response the worker renders, and logs every unexpected
 * server error under an id the error page shows the user. Prerendered pages and static assets
 * never reach this hook — see `#lib/security-headers.ts` for how they are covered.
 */

import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { config } from '#lib/config.ts';
import { SECURITY_HEADERS } from '#lib/security-headers.ts';

export const handle: Handle = async ({ event, resolve }) => {
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
