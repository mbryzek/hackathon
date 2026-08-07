import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SESSION_COOKIE } from '$lib/config';
import { urls } from '$lib/urls';

/** Only `adminApi.logout` is reached by the action; nothing else in the admin API is needed. */
const logout = vi.fn();
vi.mock('$lib/server/adminApi', () => ({ adminApi: { logout: (sessionId: string) => logout(sessionId) } }));

const { actions, load } = await import('./+page.server');

type Redirect = { status: number; location: string };

/** `redirect()` signals by throwing, so the destination is only readable off the thrown value. */
async function runAndCatch(run: () => unknown): Promise<Redirect> {
  try {
    await run();
  } catch (thrown) {
    return thrown as Redirect;
  }
  throw new Error('Expected a redirect, but the call returned normally.');
}

function event(sessionId: string | undefined) {
  const cookies = { delete: vi.fn() };
  return { cookies, locals: sessionId ? { adminSession: { id: sessionId } } : {} };
}

beforeEach(() => {
  logout.mockReset();
  logout.mockResolvedValue({ status: 204 });
});

describe('admin logout', () => {
  it('redirects a GET without touching the session', async () => {
    // Hover-preload fetches a route's load; a GET that logged you out is the bug 5ac5adc fixed.
    const redirect = await runAndCatch(() => load({} as never));

    expect(redirect.status).toBe(303);
    expect(redirect.location).toBe(urls.voteAdmin);
    expect(logout).not.toHaveBeenCalled();
  });

  it('deletes the session server-side before clearing the cookie', async () => {
    const ctx = event('sess-1');

    const redirect = await runAndCatch(() => actions.default(ctx as never));

    // Clearing the cookie alone left the id valid at the API for the rest of its 8h life.
    expect(logout).toHaveBeenCalledWith('sess-1');
    expect(ctx.cookies.delete).toHaveBeenCalledWith(SESSION_COOKIE, { path: '/' });
    expect(redirect.location).toBe(urls.voteAdminLogin);
  });

  it('still logs the admin out when the API call fails', async () => {
    // The admin asked to leave: an API hiccup must not strand them looking logged in.
    logout.mockResolvedValue({ errors: [{ message: 'boom' }], status: 500 });
    const ctx = event('sess-1');

    const redirect = await runAndCatch(() => actions.default(ctx as never));

    expect(ctx.cookies.delete).toHaveBeenCalledWith(SESSION_COOKIE, { path: '/' });
    expect(redirect.location).toBe(urls.voteAdminLogin);
  });

  it('clears the cookie without an API call when there is no session', async () => {
    const ctx = event(undefined);

    const redirect = await runAndCatch(() => actions.default(ctx as never));

    expect(logout).not.toHaveBeenCalled();
    expect(ctx.cookies.delete).toHaveBeenCalledWith(SESSION_COOKIE, { path: '/' });
    expect(redirect.location).toBe(urls.voteAdminLogin);
  });
});
