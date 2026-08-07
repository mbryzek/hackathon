import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { EventStatus } from '$lib/api/client';
import { adminApi } from '$lib/server/adminApi';
import { firstError, requireSessionId } from '$lib/server/adminSession';
import { oneOf, trimmed } from '$lib/server/fields';
import { urls } from '$lib/urls';

const EVENT_STATUSES = Object.values(EventStatus);

export const load: PageServerLoad = async (event) => {
  const response = await adminApi.getEvent(requireSessionId(event), event.params.id);

  return {
    event: response.data ?? null,
    error: firstError(event, [response], 'Event not found')
  };
};

export const actions = {
  default: async (event) => {
    const form = await event.request.formData();
    const submitted = {
      name: trimmed(form.get('name')),
      key: trimmed(form.get('key')),
      status: oneOf(form.get('status'), EVENT_STATUSES) ?? EventStatus.Draft
    };

    if (!submitted.name || !submitted.key) {
      return fail(400, { ...submitted, error: 'Please fill in all required fields' });
    }

    const response = await adminApi.updateEvent(requireSessionId(event), event.params.id, submitted);
    const error = firstError(event, [response], 'Event not found');

    if (error) {
      return fail(response.status, { ...submitted, error });
    }

    throw redirect(303, urls.voteAdminEvent(event.params.id));
  }
} satisfies Actions;
