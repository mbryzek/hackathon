import type { Actions } from './$types';
import { platformApi } from '$lib/server/platformApi';
import { submitNewPassword } from '$lib/server/setPassword';

/**
 * Where the "Reset your password" link the platform mails lands.
 *
 * THE PATH IS NOT OURS TO CHOOSE. `PasswordResetProcessor` builds the link as
 * `<tenant frontend>/login/password/reset/<password reset id>` for every tenant, and this
 * tenant's frontend is this site (`tenants.domain` is `bthackathon.com`).
 * `src/routes/emailedLinkRoutes.test.ts` pins the set.
 *
 * WHO REACHES IT: somebody who cannot sign in — which is exactly why an auth gate over this
 * page would be as fatal as a 404. It renders with no session, and the token in the URL is the
 * whole credential.
 *
 * THERE IS NO `load`, AND THAT IS THE API'S SHAPE RATHER THAN AN OMISSION. The platform offers
 * no way to ask whether a reset token is still good short of spending it, so the page shows the
 * form and the submission reports what the token turned out to be. Checking it on GET would
 * also mean a link scanner consuming the reset before its owner clicked.
 */
export const prerender = false;

export const actions = {
  default: async (event) => submitNewPassword(event, (password) => platformApi.changePassword(event.params.token, password))
} satisfies Actions;
