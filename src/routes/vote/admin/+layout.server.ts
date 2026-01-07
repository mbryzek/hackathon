import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Don't require auth for login page
	if (url.pathname === '/vote/admin/login') {
		return {
			adminSession: locals.adminSession,
		};
	}

	// Require authentication for all other admin pages
	if (!locals.adminSession) {
		throw redirect(303, '/vote/admin/login');
	}

	return {
		adminSession: locals.adminSession,
	};
};
