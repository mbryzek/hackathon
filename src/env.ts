import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * The version stamp `dev release sveltekit` exports into the build environment, and the whole of
 * what this app reads through `$app/env`: everything else is `import.meta.env` in
 * `src/lib/config.ts`. Both are inlined at build time; a build that is not a release takes the
 * empty defaults in `.env`, and `/_internal_/version` answers null for them.
 */
export const variables = defineEnvVars({
  PUBLIC_VERSION: { public: true, static: true },
  PUBLIC_RELEASED_AT: { public: true, static: true }
});
