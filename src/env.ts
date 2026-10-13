import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  PUBLIC_VERSION: { public: true, static: true },
  PUBLIC_RELEASED_AT: { public: true, static: true }
});
