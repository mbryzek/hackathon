/**
 * SvelteKit server hooks
 * Handles session management for vote admin
 */

import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/config';

export const handle: Handle = async ({ event, resolve }) => {
	// Only handle admin routes
	if (!event.url.pathname.startsWith('/vote/admin')) {
		return resolve(event);
	}

	// Get session ID from cookie and pass it through to pages
	// The actual API calls will validate the session
	const sessionId = event.cookies.get(SESSION_COOKIE);

	if (sessionId) {
		// Store session ID in locals - pages will use it for API calls
		// We don't validate here; let the API calls handle auth
		event.locals.adminSession = {
			id: sessionId,
		};
	}

	return resolve(event);
};
