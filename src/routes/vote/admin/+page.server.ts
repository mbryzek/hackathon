import type { PageServerLoad } from './$types';
import { dataOr } from '$lib/api/client';
import { adminApi } from '$lib/server/adminApi';
import { firstError, requireSessionId } from '$lib/server/adminSession';

export const load: PageServerLoad = async (event) => {
  const response = await adminApi.getEvents(requireSessionId(event));

  return {
    events: dataOr(response, []),
    error: firstError(event, [response])
  };
};
