import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { dataOr, safeErrorStatus } from '#lib/api/client.js';
import { adminApi } from '#lib/server/adminApi.js';
import { firstError, requireSessionId } from '#lib/server/adminSession.js';
import { urls } from '#lib/urls.js';

export const load: PageServerLoad = async (event) => {
  const response = await adminApi.getEvent(requireSessionId(event), event.params.id);

  return {
    event: dataOr(response, null),
    error: firstError(event, [response], 'Event not found')
  };
};

export const actions = {
  delete: async (event) => {
    const response = await adminApi.deleteEvent(requireSessionId(event), event.params.id);
    const error = firstError(event, [response], 'Event not found');

    if (error) {
      return fail(safeErrorStatus(response.status), { error });
    }

    throw redirect(303, urls.voteAdmin);
  }
} satisfies Actions;
