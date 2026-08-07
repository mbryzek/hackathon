/**
 * The security headers this site sends on every response.
 *
 * Two mechanisms deliver them, because two different things serve this site:
 *
 * - `src/hooks.server.ts` sets them on responses the SvelteKit worker renders — `/vote`,
 *   `/vote/admin`, `/_internal_/version`.
 * - `_headers` in the project root sets them on the prerendered marketing pages and the
 *   files in `static/`, which Cloudflare Pages serves directly. `svelte.config.js`
 *   excludes those paths from the worker (`routes.exclude: ['<all>']`), so the `handle`
 *   hook never runs for them, and Pages does not apply `_headers` to worker responses
 *   either. Neither mechanism covers the other's surface — both are required.
 *
 * `security-headers.test.ts` asserts the two agree, so adding a header in one place and
 * forgetting the other fails the test rather than shipping half-applied.
 */
export const SECURITY_HEADERS = {
  /**
   * DENY, not SAMEORIGIN: nothing here is meant to be embedded. There is no `iframe`
   * anywhere in the repo, and the one page that sounds embeddable — `/Y26/program/ad` —
   * sells ad space in a *printed* program rather than serving a widget.
   */
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
} as const satisfies Record<string, string>;
