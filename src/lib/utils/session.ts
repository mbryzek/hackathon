import { SESSION_COOKIE } from '$lib/config';

/**
 * Retrieves the session ID from the browser cookie
 * @returns The session ID or null if not found
 */
export function getSessionId(): string | null {
	if (typeof document === 'undefined') return null;
	const match = document.cookie.match(new RegExp(`(^| )${SESSION_COOKIE}=([^;]+)`));
	return match?.[2] ?? null;
}

/**
 * Sets the session cookie
 * @param sessionId - The session ID to store
 * @param maxAgeSeconds - Cookie expiration in seconds (default: 8 hours)
 */
export function setSessionCookie(sessionId: string, maxAgeSeconds = 60 * 60 * 8): void {
	const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
	document.cookie = `${SESSION_COOKIE}=${sessionId}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

/**
 * Clears the session cookie
 */
export function clearSessionCookie(): void {
	document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}
