import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { SESSION_COOKIE, config } from '$lib/config';
import { adminApi } from '$lib/api/client';

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

		const response = await adminApi.login(email, password);

		if (response.errors) {
			return fail(response.status, {
				errors: response.errors.map((e) => ({ message: e.message || 'Login failed' })),
				email,
			});
		}

		if (!response.data) {
			return fail(500, {
				errors: [{ message: 'Unexpected error' }],
				email,
			});
		}

		// Set session cookie server-side with httpOnly for security
		cookies.set(SESSION_COOKIE, response.data.session.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: config.isProduction,
			maxAge: 60 * 60 * 8, // 8 hours
		});

		// Redirect to admin dashboard
		throw redirect(303, '/vote/admin');
	},
} satisfies Actions;
