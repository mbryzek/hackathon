import type { LayoutLoad } from './$types';
import { voteApi } from '$lib/api/client';

// Dynamic routes cannot be prerendered
export const prerender = false;

export const load: LayoutLoad = async ({ params }) => {
	const response = await voteApi.getOpenEvents();
	const event = response.data?.find((e) => e.key === params.event_key) ?? null;
	const loadError = response.data === undefined;

	return {
		event,
		loadError
	};
};
