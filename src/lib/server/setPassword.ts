/**
 * The form half of the two emailed links that end in choosing a password: `/welcome/<token>`
 * (an invitation) and `/login/password/reset/<id>` (a reset).
 *
 * The two differ in exactly one thing — which platform operation spends the token — so the
 * reading of the form, the checks, the error the page shows and where a success goes are all
 * here, and each route supplies the one call. Written twice they would drift, and the half that
 * drifts is the half nobody exercises: both of these are reached only from a mail nobody on the
 * team receives.
 */

import { fail, redirect, type ActionFailure, type Cookies } from '@sveltejs/kit';
import { isApiError, safeErrorStatus, type ApiResponse } from '$lib/api/client';
import { startAdminSessionIfAdmin } from '$lib/server/adminSession';
import { urls } from '$lib/urls';
import type { SessionState } from '../../generated/com-bryzek-platform';

/** What a failed submission hands back to the page. */
export interface SetPasswordFailure {
  error: string;
}

/** The part of a `RequestEvent` this needs. */
interface SetPasswordEvent {
  request: Request;
  cookies: Cookies;
}

/**
 * The reason this submission cannot be sent, or null.
 *
 * Deliberately only two: the field is empty, and the two fields disagree. There are no password
 * restrictions in this product, and what the platform will accept is the platform's to say — a
 * rule enforced here as well would be a second, drifting copy of it that rejects a password the
 * API would have taken.
 */
export function reasonToRefuse(password: string, confirmation: string): string | null {
  if (password === '') {
    return 'Choose a password.';
  }
  if (password !== confirmation) {
    return 'The two passwords do not match.';
  }
  return null;
}

/** The first message the API sent, or a generic one when it sent none. */
function firstMessage(errors: { message: string }[]): string {
  return errors[0]?.message || 'Something went wrong. Please try again.';
}

/**
 * Reads the password fields, spends the token through `submit`, and signs the person in.
 *
 * Never returns on success: a completed submission redirects, which is what keeps the page's own
 * `load` from re-running against a token that has just been consumed and reporting the link as
 * expired to somebody who has this second used it successfully.
 *
 * A person whose new session the vote admin does not admit still has their password — they are
 * sent to the sign-in page rather than into an admin console that would bounce them straight
 * back out.
 */
export async function submitNewPassword(
  event: SetPasswordEvent,
  submit: (password: string) => Promise<ApiResponse<SessionState>>
): Promise<ActionFailure<SetPasswordFailure>> {
  const formData = await event.request.formData();
  const password = formData.get('password')?.toString() ?? '';
  const confirmation = formData.get('password_confirmation')?.toString() ?? '';

  const refusal = reasonToRefuse(password, confirmation);
  if (refusal) {
    return fail(400, { error: refusal });
  }

  const response = await submit(password);
  if (isApiError(response)) {
    return fail(safeErrorStatus(response.status), { error: firstMessage(response.errors) });
  }

  const signedIn = await startAdminSessionIfAdmin(event.cookies, response.data);
  throw redirect(303, signedIn ? urls.voteAdmin : urls.voteAdminLogin);
}
