import { describe, it, expect } from 'vitest';
import type { Handle } from '@sveltejs/kit';
import { handle } from './hooks.server';
import { SECURITY_HEADERS } from '$lib/security-headers';
import { SESSION_COOKIE } from '$lib/config';

type HandleInput = Parameters<Handle>[0];

/**
 * The hook reads only `url.pathname`, `cookies.get` and `locals`, so the event is faked
 * down to those three. `locals` is handed back because the hook mutates it in place.
 */
async function invoke(
  pathname: string,
  options: { cookies?: Record<string, string>; response?: Response } = {}
): Promise<{ response: Response; locals: App.Locals }> {
  const cookies = options.cookies ?? {};
  const locals: App.Locals = {};

  const input = {
    event: {
      url: new URL(`https://hackathon.bergen.tech${pathname}`),
      cookies: { get: (name: string): string | undefined => cookies[name] },
      locals
    },
    resolve: (): Response => options.response ?? new Response('ok')
  } as unknown as HandleInput;

  return { response: await handle(input), locals };
}

/** A header the hook failed to set reads back as `null`, so a miss names itself in the diff. */
function headersOf(response: Response): Record<string, string | null> {
  return Object.fromEntries(Object.keys(SECURITY_HEADERS).map((name) => [name, response.headers.get(name)]));
}

describe('handle', () => {
  /**
   * Only paths the worker renders reach this hook at all — the prerendered marketing
   * pages are covered by `static/_headers` instead — so these are the rendered ones.
   */
  it.each(['/vote', '/vote/some-event', '/vote/admin', '/vote/admin/login', '/_internal_/version'])(
    'sets the security headers on %s',
    async (pathname) => {
      const { response } = await invoke(pathname);
      expect(headersOf(response)).toEqual({ ...SECURITY_HEADERS });
    }
  );

  it('sets the security headers on a redirect, which is what an unauthenticated admin request gets', async () => {
    const redirect = new Response(null, { status: 303, headers: { location: '/vote/admin/login' } });

    const { response } = await invoke('/vote/admin', { response: redirect });

    expect(response.status).toBe(303);
    expect(headersOf(response)).toEqual({ ...SECURITY_HEADERS });
  });

  it('threads the session cookie into locals on admin routes', async () => {
    const { locals } = await invoke('/vote/admin/events', { cookies: { [SESSION_COOKIE]: 'sess-1' } });

    expect(locals.adminSession).toEqual({ id: 'sess-1' });
  });

  it('leaves the session out of locals when the cookie is absent', async () => {
    const { locals } = await invoke('/vote/admin/events');

    expect(locals.adminSession).toBeUndefined();
  });

  it('ignores the session cookie outside admin routes', async () => {
    const { locals } = await invoke('/vote', { cookies: { [SESSION_COOKIE]: 'sess-1' } });

    expect(locals.adminSession).toBeUndefined();
  });
});
