import { describe, expect, it, vi, beforeEach } from 'vitest';
import { isRedirect, type Cookies } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/config';
import { urls } from '$lib/urls';
import { VoterType, type ApiResponse } from '$lib/api/client';

/**
 * The invariant this file exists for: the admin session id never leaves the server.
 *
 * It reaches SvelteKit as an httpOnly cookie, so page scripts cannot read it — but the admin
 * layout used to hand the raw id straight back as page data, which put it in the hydration
 * payload of every admin page where any script could take it (ISS-788). So every `load` under
 * `/vote/admin` is run here with a known session id and its output is searched for that id.
 */
const SESSION_ID = 'sess-not-for-the-browser';

/** Every admin API call answers with something recognisable, so a leak has something to leak. */
const ok = <T>(data: T): Promise<ApiResponse<T>> => Promise.resolve({ data, status: 200 });

const unauthorized = { errors: [{ code: 'unauthorized', message: 'Unauthorized' }], status: 401 };

const getCodes = vi.fn();

vi.mock('$lib/server/adminApi', () => ({
  adminApi: {
    getEvents: () => ok([{ id: 'evt-1', key: 'hack', name: 'Hack Night', status: 'draft' }]),
    getEvent: () => ok({ id: 'evt-1', key: 'hack', name: 'Hack Night', status: 'draft' }),
    getProjects: () => ok([{ id: 'prj-1', name: 'Alpha' }]),
    getCodeSummary: () => ok({ total: 1, student: { codes: 1, votes: 0 }, parent: { codes: 0, votes: 0 } }),
    getCodes: (...args: unknown[]) => getCodes(...args),
    getResults: () => ok({ student: { total_votes: 0, projects: [] }, parent: { total_votes: 0, projects: [] } })
  }
}));

function fakeCookies(): Cookies & { deleted: string[] } {
  const deleted: string[] = [];
  return {
    deleted,
    get: () => SESSION_ID,
    getAll: () => [],
    set: () => {},
    delete: (name: string) => void deleted.push(name),
    serialize: () => ''
  } as unknown as Cookies & { deleted: string[] };
}

/** The slice of a `RequestEvent` an admin `load` actually reads. */
function loadEvent(url: string = 'http://localhost/vote/admin', cookies: Cookies = fakeCookies()) {
  return {
    locals: { adminSession: { id: SESSION_ID } },
    cookies,
    params: { id: 'evt-1' },
    url: new URL(url)
  };
}

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
  getCodes.mockImplementation(() => ok([{ id: 'code-1', code: 'AAAA', voter_type: VoterType.Student, has_voted: false }]));
});

describe('the admin session id never reaches the browser', () => {
  it.each(ADMIN_LOADS)('$name load returns no session id', async ({ path, url }) => {
    const load = await loadFn(path);
    const result = await load(loadEvent(url));

    expect(JSON.stringify(result ?? null)).not.toContain(SESSION_ID);
  });

  it('every admin load redirects to the login page when there is no session', async () => {
    for (const { path, url } of ADMIN_LOADS) {
      const load = await loadFn(path);
      const event = { ...loadEvent(url), locals: {} };

      await expect(load(event)).rejects.toSatisfy(
        (thrown: unknown) => isRedirect(thrown) && thrown.location === urls.voteAdminLogin,
        `${path} should redirect to the login page`
      );
    }
  });

  it('clears the cookie and redirects when the API rejects the session', async () => {
    getCodes.mockImplementation(() => Promise.resolve(unauthorized));
    const cookies = fakeCookies();
    const load = await loadFn('./events/[id]/codes/+page.server.ts');

    await expect(load(loadEvent('http://localhost/vote/admin/events/evt-1/codes', cookies))).rejects.toSatisfy(isRedirect);

    // Leaving the rejected cookie in place would bounce the admin off the login page and
    // straight back to the one that cannot load.
    expect(cookies.deleted).toEqual([SESSION_COOKIE]);
  });
});
