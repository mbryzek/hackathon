export const config = {
	apiBaseUrl: import.meta.env['VITE_API_BASE_URL'] || 'http://localhost:9000',
} as const;

export const SESSION_COOKIE = 'vote_session_id';
