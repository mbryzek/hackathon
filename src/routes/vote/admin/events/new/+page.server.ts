import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { EventStatus } from '$lib/api/client';
import { adminApi } from '$lib/server/adminApi';
import { firstError, requireSessionId } from '$lib/server/adminSession';
import { oneOf, trimmed } from '$lib/server/fields';
import { urls } from '$lib/urls';

const EVENT_STATUSES = Object.values(EventStatus);

export const actions = {
  default: async (event) => {
    const form = await event.request.formData();
    const submitted = {
      name: trimmed(form.get('name')),
      key: trimmed(form.get('key')),
      status: oneOf(form.get('status'), EVENT_STATUSES) ?? EventStatus.Draft
    };

    if (!submitted.name) {
      return fail(400, { ...submitted, error: 'Please enter an event name' });
    }
    if (!submitted.key) {
      return fail(400, { ...submitted, error: 'Please enter an event key' });
    }

    const response = await adminApi.createEvent(requireSessionId(event), submitted);
    const error = firstError(event, [response]);

    if (error !== null) {
      return fail(response.status, { ...submitted, error });
    }
    if (!response.data) {
      return fail(500, { ...submitted, error: 'Failed to create event' });
    }

    throw redirect(303, urls.voteAdminEvent(response.data.id));
  }
} satisfies Actions;
