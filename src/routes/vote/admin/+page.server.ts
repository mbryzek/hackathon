import type { PageServerLoad } from './$types';
import { adminApi } from '$lib/server/adminApi';
import { firstError, requireSessionId } from '$lib/server/adminSession';

export const load: PageServerLoad = async (event) => {
  const response = await adminApi.getEvents(requireSessionId(event));

  return {
    events: response.data ?? [],
    error: firstError(event, [response])
  };
};
