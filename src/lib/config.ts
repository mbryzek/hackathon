import { env } from '$env/dynamic/public';

export const config = {
	apiBaseUrl: env['PUBLIC_API_BASE_URL'] || 'http://localhost:9000',
} as const;

export const SESSION_COOKIE = 'vote_session_id';
