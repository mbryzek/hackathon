import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SESSION_COOKIE } from '$lib/config';
import { urls } from '$lib/urls';
import { expectRedirect, fakeCookies } from '$lib/test/requestEvent';

/** Only `adminApi.logout` is reached by the action; nothing else in the admin API is needed. */
const logout = vi.fn();
vi.mock('$lib/server/adminApi', async () => {
  const { mockAdminApi } = await import('$lib/test/adminApiMock');
  return mockAdminApi({ logout: (sessionId: string) => logout(sessionId) });
});

const { actions, load } = await import('./+page.server');

function event(sessionId: string | undefined) {
  return { cookies: fakeCookies(), locals: sessionId ? { adminSession: { id: sessionId } } : {} };
}

beforeEach(() => {
  logout.mockReset();
  logout.mockResolvedValue({ status: 204 });
});

describe('admin logout', () => {
  it('redirects a GET without touching the session', async () => {
    // Hover-preload fetches a route's load; a GET that logged you out is the bug 5ac5adc fixed.
    await expectRedirect(() => load({} as never), urls.voteAdmin);

    expect(logout).not.toHaveBeenCalled();
  });

  it('deletes the session server-side before clearing the cookie', async () => {
    const ctx = event('sess-1');

    await expectRedirect(() => actions.default(ctx as never), urls.voteAdminLogin);

    // Clearing the cookie alone left the id valid at the API for the rest of its 8h life.
    expect(logout).toHaveBeenCalledWith('sess-1');
    expect(ctx.cookies.deleted).toEqual([{ name: SESSION_COOKIE, path: '/' }]);
  });

  it('still logs the admin out when the API call fails', async () => {
    // The admin asked to leave: an API hiccup must not strand them looking logged in.
    logout.mockResolvedValue({ errors: [{ message: 'boom' }], status: 500 });
    const ctx = event('sess-1');

    await expectRedirect(() => actions.default(ctx as never), urls.voteAdminLogin);

    expect(ctx.cookies.deleted).toEqual([{ name: SESSION_COOKIE, path: '/' }]);
  });

  it('clears the cookie without an API call when there is no session', async () => {
    const ctx = event(undefined);

    await expectRedirect(() => actions.default(ctx as never), urls.voteAdminLogin);

    expect(logout).not.toHaveBeenCalled();
    expect(ctx.cookies.deleted).toEqual([{ name: SESSION_COOKIE, path: '/' }]);
  });
});
