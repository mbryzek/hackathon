export const config = {
  apiBaseUrl: import.meta.env['VITE_API_BASE_URL'] || 'http://localhost:9300',
  isProduction: import.meta.env['VITE_ENVIRONMENT'] === 'production' || import.meta.env.PROD
} as const;

export const SESSION_COOKIE = 'vote_session_id';

/**
 * The platform tenant this site is the frontend of — `Constants.Tenants.Hackathon` on the
 * platform side, and the row whose `tenants.domain` is `bthackathon.com`.
 *
 * It is needed wherever a call names the tenant rather than inferring it from a session: the
 * password-change endpoint the emailed reset link posts to is `POST
 * /tenant/:tenant_id/session/password/changes`, and a recipient of that link has no session
 * for the platform to read the tenant out of.
 */
export const TENANT_ID = 'hackathon';
