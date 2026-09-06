/**
 * The platform's own API, for the links the platform MAILS a person of this tenant.
 *
 * WHY THIS EXISTS SEPARATELY FROM `adminApi`. Every operation there authenticates with an
 * admin session id; every operation here is reached by somebody who has NO session — proving
 * an address, or choosing a first password precisely because they cannot sign in. The token in
 * the URL is the whole credential, and it is single-use.
 *
 * It still lives under `$lib/server`, for the same reason `adminApi` does: SvelteKit refuses to
 * bundle a `$lib/server` module into browser code, so the token these calls carry cannot end up
 * in a hydration payload by a later edit. The pages that use it are `+page.server.ts` loads and
 * form actions, which is where a link's token arrives anyway.
 *
 * THE PATHS ARE NOT OURS TO CHOOSE. `core.email.EmailedLink` on the platform names the path of
 * every link mailed to this tenant, and `tenants.domain` names the host, so a route in this
 * repo at any other spelling is a 404 for whoever clicks. `src/routes/emailedLinkRoutes.test.ts`
 * pins the set.
 */

import { config, TENANT_ID } from '$lib/config';
import { handleApiCall, type ApiResponse } from '$lib/api/client';
import { ApiClient as PlatformClient, type SessionState, type UserActivation } from '../../generated/com-bryzek-platform';

/** A client for one call. None of these operations carries a credential of its own. */
function platformClient(): PlatformClient {
  return new PlatformClient({ baseUrl: config.apiBaseUrl });
}

export const platformApi = {
  /**
   * Spends an email-verification token, mailed as `/email/verifications/<token>` by
   * `EmailVerificationProcessor` to every person the platform holds an address for.
   *
   * 404 is the token resolving to nothing — expired, or already superseded — and is the
   * ordinary outcome of an old link rather than a fault.
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return handleApiCall(() => platformClient().updateEmailVerificationByToken(token));
  },

  /**
   * The invitation behind a `/welcome/<token>` link, so the page can name the account being
   * activated before asking for a password. 404 means the invitation is spent or expired.
   */
  async getActivation(token: string): Promise<ApiResponse<UserActivation>> {
    return handleApiCall(() => platformClient().getUserActivationByToken(token));
  },

  /** Sets the invitee's first password and consumes the activation, minting a session. */
  async setActivationPassword(token: string, password: string): Promise<ApiResponse<SessionState>> {
    return handleApiCall(() => platformClient().createUserActivationPasswordByToken({ token, body: { password } }));
  },

  /**
   * Spends a password-reset token, mailed as `/login/password/reset/<id>` by
   * `PasswordResetProcessor`. The `id` the form carries IS that token: the platform builds the
   * link from the password reset's own id.
   *
   * The tenant is named rather than read from a session because the caller has none — that is
   * the whole situation a password reset exists for.
   */
  async changePassword(resetId: string, password: string): Promise<ApiResponse<SessionState>> {
    return handleApiCall(() =>
      platformClient().createTenantSessionPasswordAndChanges({
        tenantId: TENANT_ID,
        body: { id: resetId, password }
      })
    );
  }
};
