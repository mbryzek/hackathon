import type { PageServerLoad } from './$types';
import { dataOr } from '#lib/api/client.js';
import { adminApi } from '#lib/server/adminApi.js';
import { firstError, requireSessionId } from '#lib/server/adminSession.js';

export const load: PageServerLoad = async (event) => {
  const response = await adminApi.getEvents(requireSessionId(event));

  return {
    events: dataOr(response, []),
    error: firstError(event, [response])
  };
};
