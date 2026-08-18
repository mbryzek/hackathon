import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { isApiError, safeErrorStatus } from '$lib/api/client';
import { adminApi } from '$lib/server/adminApi';
import { firstError, requireSessionId } from '$lib/server/adminSession';
import { parseEventForm } from '$lib/server/eventForm';
import { urls } from '$lib/urls';

export const actions = {
  default: async (event) => {
    const form = await event.request.formData();
    const { value: submitted, error: invalid } = parseEventForm(form);

    if (invalid !== null) {
      return fail(400, { ...submitted, error: invalid });
    }

    const response = await adminApi.createEvent(requireSessionId(event), submitted);
    const error = firstError(event, [response]);

    if (error !== null) {
      return fail(safeErrorStatus(response.status), { ...submitted, error });
    }
    if (isApiError(response)) {
      return fail(500, { ...submitted, error: 'Failed to create event' });
    }

    throw redirect(303, urls.voteAdminEvent(response.data.id));
  }
} satisfies Actions;
