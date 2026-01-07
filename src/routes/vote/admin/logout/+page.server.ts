import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { SESSION_COOKIE } from '$lib/config';

export const load: PageServerLoad = async ({ cookies }) => {
	// Clear the session cookie
	cookies.delete(SESSION_COOKIE, { path: '/' });

	// Redirect to login
	throw redirect(303, '/vote/admin/login');
};
