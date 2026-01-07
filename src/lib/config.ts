export const config = {
	apiBaseUrl: import.meta.env['VITE_API_BASE_URL'] || 'http://localhost:9000',
	isProduction: import.meta.env['VITE_ENVIRONMENT'] === 'production' || import.meta.env.PROD,
} as const;

export const SESSION_COOKIE = 'vote_session_id';
