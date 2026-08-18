import type { PageServerLoad } from './$types';
import { dataOr } from '$lib/api/client';
import { adminApi } from '$lib/server/adminApi';
import { firstError, requireSessionId } from '$lib/server/adminSession';

export const load: PageServerLoad = async (event) => {
  const sessionId = requireSessionId(event);
  const [eventResponse, resultsResponse] = await Promise.all([
    adminApi.getEvent(sessionId, event.params.id),
    adminApi.getResults(sessionId, event.params.id)
  ]);

  return {
    event: dataOr(eventResponse, null),
    results: dataOr(resultsResponse, null),
    error: firstError(event, [eventResponse, resultsResponse], 'Event not found')
  };
};
