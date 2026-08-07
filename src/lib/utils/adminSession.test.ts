import { describe, it, expect, vi, beforeEach } from 'vitest';
import { urls } from '$lib/urls';

const goto = vi.fn();
const invalidateAll = vi.fn();
vi.mock('$app/navigation', () => ({
  goto: (href: string) => goto(href),
  invalidateAll: () => invalidateAll()
}));

const { redirectIfUnauthorized, EXPIRED_SESSION_MESSAGE } = await import('./adminSession');

beforeEach(() => {
  goto.mockReset();
  invalidateAll.mockReset().mockResolvedValue(undefined);
});

describe('redirectIfUnauthorized', () => {
  it('reports false and stays put when nothing is a 401', async () => {
    expect(await redirectIfUnauthorized({ status: 200 }, { status: 500 })).toBe(false);
    expect(goto).not.toHaveBeenCalled();
  });

  it('redirects to login when any response is a 401', async () => {
    // The multi-response form is what the pages loading an event plus its projects/results need.
    expect(await redirectIfUnauthorized({ status: 200 }, { status: 401 })).toBe(true);
    expect(goto).toHaveBeenCalledWith(urls.voteAdminLogin);
  });

  it('invalidates before navigating so the dead session leaves page data', async () => {
    const order: string[] = [];
    invalidateAll.mockImplementation(() => {
      order.push('invalidate');
      return Promise.resolve();
    });
    goto.mockImplementation(() => order.push('goto'));

    await redirectIfUnauthorized({ status: 401 });

    expect(order).toEqual(['invalidate', 'goto']);
  });

  it('exposes one expired-session message for every page to use', () => {
    // Seven pages had this string inline; drift between them is what this prevents.
    expect(EXPIRED_SESSION_MESSAGE).toContain('session has expired');
  });
});
