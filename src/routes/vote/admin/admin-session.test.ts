import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SESSION_COOKIE } from '$lib/config';
import { urls } from '$lib/urls';
import { ok } from '$lib/test/adminApiMock';
import { aCode } from '$lib/test/fixtures';
import { expectRedirect, fakeCookies, loadEvent, TEST_SESSION_ID } from '$lib/test/requestEvent';

/**
 * The invariant this file exists for: the admin session id never leaves the server.
 *
 * It reaches SvelteKit as an httpOnly cookie, so page scripts cannot read it — but the admin
 * layout used to hand the raw id straight back as page data, which put it in the hydration
 * payload of every admin page where any script could take it (ISS-788). So every `load` under
 * `/vote/admin` is run here with a known session id and its output is searched for that id.
 */

const getCodes = vi.fn();

vi.mock('$lib/server/adminApi', async () => {
  const { mockAdminApi } = await import('$lib/test/adminApiMock');
  return mockAdminApi({ getCodes: (...args: Parameters<typeof getCodes>) => getCodes(...args) });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLoad = (event: any) => unknown;

/** Every `load` under /vote/admin, and a URL that exercises it. */
const ADMIN_LOADS: { name: string; path: string; url: string }[] = [
  { name: 'admin layout', path: './+layout.server.ts', url: 'http://localhost/vote/admin' },
  { name: 'events list', path: './+page.server.ts', url: 'http://localhost/vote/admin' },
  { name: 'event detail', path: './events/[id]/+page.server.ts', url: 'http://localhost/vote/admin/events/evt-1' },
  { name: 'event edit', path: './events/[id]/edit/+page.server.ts', url: 'http://localhost/vote/admin/events/evt-1/edit' },
  {
    name: 'codes',
    path: './events/[id]/codes/+page.server.ts',
    url: 'http://localhost/vote/admin/events/evt-1/codes?q=ab&voter_type=student&has_voted=true&offset=50'
  },
  { name: 'projects', path: './events/[id]/projects/+page.server.ts', url: 'http://localhost/vote/admin/events/evt-1/projects' },
  {
    name: 'bulk projects',
    path: './events/[id]/projects/bulk/+page.server.ts',
    url: 'http://localhost/vote/admin/events/evt-1/projects/bulk'
  },
  { name: 'results', path: './events/[id]/results/+page.server.ts', url: 'http://localhost/vote/admin/events/evt-1/results' }
];

const modules = import.meta.glob('./**/+*.server.ts');

async function loadFn(path: string): Promise<AnyLoad> {
  const importer = modules[path];
  if (!importer) throw new Error(`No module ${path}. Known: ${Object.keys(modules).join(', ')}`);
  const module = (await importer()) as { load?: AnyLoad };
  if (!module.load) throw new Error(`${path} exports no load`);
  return module.load;
}

beforeEach(() => {
  getCodes.mockReset();
  getCodes.mockImplementation(() => ok([aCode()]));
});

describe('the admin session id never reaches the browser', () => {
  it.each(ADMIN_LOADS)('$name load returns no session id', async ({ path, url }) => {
    const load = await loadFn(path);
    const result = await load(loadEvent({ url }));

    expect(JSON.stringify(result ?? null)).not.toContain(TEST_SESSION_ID);
  });

  it('every admin load redirects to the login page when there is no session', async () => {
    for (const { path, url } of ADMIN_LOADS) {
      const load = await loadFn(path);

      await expectRedirect(() => load(loadEvent({ url, sessionId: null })), urls.voteAdminLogin);
    }
  });

  it('clears the cookie and redirects when the API rejects the session', async () => {
    getCodes.mockImplementation(() => Promise.resolve({ errors: [{ code: 'unauthorized', message: 'Unauthorized' }], status: 401 }));
    const cookies = fakeCookies();
    const load = await loadFn('./events/[id]/codes/+page.server.ts');

    await expectRedirect(() => load(loadEvent({ url: 'http://localhost/vote/admin/events/evt-1/codes', cookies })), urls.voteAdminLogin);

    // Leaving the rejected cookie in place would bounce the admin off the login page and
    // straight back to the one that cannot load. Without the path it is a different cookie
    // that gets deleted, and the one the login action set survives.
    expect(cookies.deleted).toEqual([{ name: SESSION_COOKIE, path: '/' }]);
  });
});
