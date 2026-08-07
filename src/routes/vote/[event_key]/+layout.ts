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

  // A failed call and a genuinely closed event are not the same thing, and `response.data`
  // is undefined for both. Collapsing them into `event = null` told a voter whose request
  // had just failed that the event was "not currently open, check back later" — for an event
  // running in the room they were standing in — with no retry short of reloading the page.
  if (response.errors || !response.data) {
    return { event: null, loadFailed: true };
  }

  return {
    event: response.data.find((e) => e.key === params.event_key) ?? null,
    loadFailed: false
  };
};
