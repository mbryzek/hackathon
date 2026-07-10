import type { LayoutLoad } from './$types';
import { voteApi } from '$lib/api/client';

// Dynamic routes cannot be prerendered
export const prerender = false;

// Load runs client-side only: the frontend's API base URL may differ from the
// SvelteKit server's reachable URLs (e.g. tests set BACKEND_BASE_URL but
// VITE_API_BASE_URL is unset). Running in the browser gives us the address
// that actually works for real users.
export const ssr = false;

export const load: LayoutLoad = async ({ params }) => {
  const response = await voteApi.getOpenEvents();
  const event = response.data?.find((e) => e.key === params.event_key) ?? null;

  return {
    event
  };
};
