import { json } from '@sveltejs/kit';
import { PUBLIC_VERSION, PUBLIC_RELEASED_AT } from '$env/static/public';
import type { RequestHandler } from './$types';

// PUBLIC_VERSION / PUBLIC_RELEASED_AT are exported into the build environment
// by release-sveltekit (stamped from ~/.devops/versions/<app>.env) and baked
// in here at build time. Dev builds fall back to the empty defaults in .env.
export const GET: RequestHandler = async () => {
  return json({
    version: PUBLIC_VERSION || null,
    released_at: PUBLIC_RELEASED_AT || null
  });
};
