import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { dataOr } from '$lib/api/client';
import { adminApi } from '$lib/server/adminApi';
import { firstError, requireSessionId } from '$lib/server/adminSession';
import { parseEventForm } from '$lib/server/eventForm';
import { urls } from '$lib/urls';

export const load: PageServerLoad = async (event) => {
  const response = await adminApi.getEvent(requireSessionId(event), event.params.id);

  return {
    event: dataOr(response, null),
    error: firstError(event, [response], 'Event not found')
  };
};

export const actions = {
  default: async (event) => {
    const form = await event.request.formData();
    const { value: submitted, error: invalid } = parseEventForm(form);

    if (invalid !== null) {
      return fail(400, { ...submitted, error: invalid });
    }

    const response = await adminApi.updateEvent(requireSessionId(event), event.params.id, submitted);
    const error = firstError(event, [response], 'Event not found');

    if (error) {
      return fail(response.status, { ...submitted, error });
    }

    throw redirect(303, urls.voteAdminEvent(event.params.id));
  }
} satisfies Actions;
