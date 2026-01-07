import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
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

export const load: PageServerLoad = async ({ locals }) => {
	// If already logged in, redirect to admin dashboard
	if (locals.adminSession) {
		throw redirect(303, '/vote/admin');
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim();
		const password = formData.get('password')?.toString();

		if (!email) {
			return fail(400, {
				errors: [{ field: 'email', message: 'Email is required' }],
				email: '',
			});
		}

		if (!password) {
			return fail(400, {
				errors: [{ field: 'password', message: 'Password is required' }],
				email,
			});
		}

		try {
			const client = createServerApiClient();
			const response = await client.adminSessions.postSessionsAndLogins({
				body: { email, password },
			});

			if (!response.ok) {
				const errors = Array.isArray(response.body) ? response.body : [response.body];
				return fail(response.status, {
					errors: errors.map((e) => ({ message: e.message || 'Login failed' })),
					email,
				});
			}

			// Set session cookie server-side with httpOnly for security
			cookies.set(SESSION_COOKIE, response.body.session.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: config.isProduction,
				maxAge: 60 * 60 * 8, // 8 hours
			});

			// Redirect to admin dashboard
			throw redirect(303, '/vote/admin');
		} catch (error) {
			// Re-throw redirects
			if (error instanceof Response || (error as { status?: number })?.status === 303) {
				throw error;
			}

			return fail(500, {
				errors: [{ message: 'An unexpected error occurred' }],
				email,
			});
		}
	},
} satisfies Actions;
