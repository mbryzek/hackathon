/**
 * SvelteKit server hooks
 * Handles session management for vote admin
 */

import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, config } from '$lib/config';
import { createClient } from '$generated/vote-admin/vote-admin';

// Create server-side API client
const PRODUCTION_API_HOST = 'https://api.bthackathon.com';

function createServerApiClient() {
	const customFetch: typeof fetch = (input, init) => {
		if (typeof input === 'string' && config.apiBaseUrl !== PRODUCTION_API_HOST) {
			const url = input.replace(PRODUCTION_API_HOST, config.apiBaseUrl);
			return fetch(url, init);
		}
		return fetch(input, init);
	};
	return createClient({ fetch: customFetch });
}

export const handle: Handle = async ({ event, resolve }) => {
	// Only handle admin routes
	if (!event.url.pathname.startsWith('/vote/admin')) {
		return resolve(event);
	}

	// Skip session check for login page
	if (event.url.pathname === '/vote/admin/login') {
		return resolve(event);
	}

	// Get session ID from cookie
	const sessionId = event.cookies.get(SESSION_COOKIE);

	if (sessionId) {
		try {
			const client = createServerApiClient();
			const response = await client.adminSessions.getSession({
				headers: { Authorization: `Bearer ${sessionId}` },
			});

			if (response.ok && response.body) {
				event.locals.adminSession = {
					id: sessionId,
					user: response.body.user,
				};
			}
		} catch {
			// Session invalid or API error - clear cookie
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	return resolve(event);
};
