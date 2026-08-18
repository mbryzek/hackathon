import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Handle } from '@sveltejs/kit';
import { handle } from './hooks.server';
import { SECURITY_HEADERS } from '$lib/security-headers';
import { SESSION_COOKIE } from '$lib/config';
import type { AdminSession, ApiResponse } from '$lib/api/client';
import { okStatus } from '$lib/test/adminApiMock';
import { fakeCookies, type DeletedCookie } from '$lib/test/requestEvent';

type HandleInput = Parameters<Handle>[0];

/**
 * The hook decides on the status alone and never looks at the body, so these answers carry
 * no `data` — a full `AdminSession` here would only be scenery.
 */
type SessionResponse = Promise<ApiResponse<AdminSession>>;

const getSession = vi.fn<(sessionId: string) => SessionResponse>();

vi.mock('$lib/server/adminApi', async () => {
  const { mockAdminApi } = await import('$lib/test/adminApiMock');
  return mockAdminApi({ getSession: (sessionId: string) => getSession(sessionId) });
});

const confirmed: SessionResponse = okStatus<AdminSession>(200);
const rejected: SessionResponse = Promise.resolve({ errors: [{ message: 'Unauthorized' }], status: 401 });
const unavailable: SessionResponse = Promise.resolve({ errors: [{ message: 'Server error' }], status: 500 });

beforeEach(() => {
  getSession.mockReset();
  getSession.mockImplementation(() => confirmed);
});

/**
 * The hook reads only `url.pathname`, the session cookie and `locals`, so the event is faked
 * down to those. `locals` and the cookies it deleted are handed back because the hook works
 * through side effects on both.
 */
async function invoke(
  pathname: string,
  options: { cookies?: Record<string, string>; response?: Response } = {}
): Promise<{ response: Response; locals: App.Locals; deletedCookies: DeletedCookie[] }> {
  const cookies = fakeCookies(options.cookies ?? {});
  const locals: App.Locals = {};

  const input = {
    event: {
      url: new URL(`https://hackathon.bergen.tech${pathname}`),
      cookies,
      locals
    },
    resolve: (): Response => options.response ?? new Response('ok')
  } as unknown as HandleInput;

  return { response: await handle(input), locals, deletedCookies: cookies.deleted };
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

  it('puts a session the API confirmed into locals on admin routes', async () => {
    const { locals, deletedCookies } = await invoke('/vote/admin/events', { cookies: { [SESSION_COOKIE]: 'sess-1' } });

    expect(getSession).toHaveBeenCalledWith('sess-1');
    expect(locals.adminSession).toEqual({ id: 'sess-1' });
    expect(deletedCookies).toEqual([]);
  });

  it('leaves the session out of locals when the cookie is absent, without asking the API', async () => {
    const { locals } = await invoke('/vote/admin/events');

    expect(getSession).not.toHaveBeenCalled();
    expect(locals.adminSession).toBeUndefined();
  });

  it('ignores the session cookie outside admin routes', async () => {
    const { locals } = await invoke('/vote', { cookies: { [SESSION_COOKIE]: 'sess-1' } });

    expect(getSession).not.toHaveBeenCalled();
    expect(locals.adminSession).toBeUndefined();
  });

  /**
   * The cycle this closes (ISS-792): a cookie whose session the API no longer knows used to
   * set `locals.adminSession` anyway, and the login page redirects to /vote/admin whenever
   * that is set. Deleting the cookie here is what makes the login page reachable again on
   * the very next request.
   */
  it('deletes a cookie the API rejects and leaves the session unset', async () => {
    getSession.mockImplementation(() => rejected);

    const { locals, deletedCookies } = await invoke('/vote/admin', { cookies: { [SESSION_COOKIE]: 'stale' } });

    expect(locals.adminSession).toBeUndefined();
    expect(deletedCookies).toEqual([{ name: SESSION_COOKIE, path: '/' }]);
  });

  it('deletes a rejected cookie on the login page too, so the form renders instead of redirecting', async () => {
    getSession.mockImplementation(() => rejected);

    const { locals, deletedCookies } = await invoke('/vote/admin/login', { cookies: { [SESSION_COOKIE]: 'stale' } });

    expect(locals.adminSession).toBeUndefined();
    expect(deletedCookies).toEqual([{ name: SESSION_COOKIE, path: '/' }]);
  });

  /** A platform blip must not sign every admin out — only a 401 does that. */
  it('keeps the session when the API fails for any reason other than 401', async () => {
    getSession.mockImplementation(() => unavailable);

    const { locals, deletedCookies } = await invoke('/vote/admin', { cookies: { [SESSION_COOKIE]: 'sess-1' } });

    expect(locals.adminSession).toEqual({ id: 'sess-1' });
    expect(deletedCookies).toEqual([]);
  });
});
