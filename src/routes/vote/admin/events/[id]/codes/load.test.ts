import { describe, expect, it, vi, beforeEach } from 'vitest';
import { VoterType, type ApiResponse, type Code } from '$lib/api/client';
import { CODES_PAGE_SIZE } from '$lib/utils/constants';
import { ok } from '$lib/test/adminApiMock';
import { aCode } from '$lib/test/fixtures';
import { loadEvent } from '$lib/test/requestEvent';

/**
 * The codes list is fetched here rather than from the browser (ISS-788), which moved the filters
 * out of component state and into the query string. These cover that translation: what the URL
 * says becomes what the API is asked for, and nothing a hand-edited URL can say gets through.
 */

const getCodes = vi.fn();

vi.mock('$lib/server/adminApi', async () => {
  const { mockAdminApi } = await import('$lib/test/adminApiMock');
  return mockAdminApi({ getCodes: (...args: Parameters<typeof getCodes>) => getCodes(...args) });
});

const modules = import.meta.glob('./+page.server.ts');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runLoad(query: string): Promise<any> {
  const importer = modules['./+page.server.ts'];
  if (!importer) throw new Error('No ./+page.server.ts');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { load } = (await importer()) as { load: (event: any) => Promise<any> };

  return load(loadEvent({ url: `http://localhost/vote/admin/events/evt-1/codes${query}` }));
}

/** What the third argument to `getCodes` was — the filters, as the API client sees them. */
function requestedParams(): Record<string, unknown> {
  return getCodes.mock.calls.at(-1)?.[2] as Record<string, unknown>;
}

function codes(count: number): Promise<ApiResponse<Code[]>> {
  return ok(Array.from({ length: count }, (_, i) => aCode({ id: `code-${i}`, code: `CODE${i}` })));
}

beforeEach(() => {
  getCodes.mockReset();
  getCodes.mockImplementation(() => codes(2));
});

describe('codes load — filters come from the query string', () => {
  it('asks for the unfiltered first page when the URL carries nothing', async () => {
    const data = await runLoad('');

    expect(requestedParams()).toEqual({
      q: undefined,
      voter_type: undefined,
      has_voted: undefined,
      limit: CODES_PAGE_SIZE + 1,
      offset: 0
    });
    expect(data.q).toBe('');
    expect(data.voterType).toBeUndefined();
    expect(data.hasVoted).toBeUndefined();
    expect(data.offset).toBe(0);
  });

  it('passes every filter the URL carries through to the API', async () => {
    const data = await runLoad('?q=%20ab%20&voter_type=parent&has_voted=false&offset=50');

    expect(requestedParams()).toEqual({
      q: 'ab',
      voter_type: VoterType.Parent,
      has_voted: false,
      limit: CODES_PAGE_SIZE + 1,
      offset: 50
    });
    expect(data.q).toBe('ab');
    expect(data.offset).toBe(50);
  });

  it('ignores values a hand-edited URL can invent', async () => {
    await runLoad('?voter_type=principal&has_voted=maybe&offset=-10');

    expect(requestedParams()).toMatchObject({
      voter_type: undefined,
      has_voted: undefined,
      offset: 0
    });
  });
});

describe('codes load — paging', () => {
  it('reports no next page when the extra row does not come back', async () => {
    getCodes.mockImplementation(() => codes(CODES_PAGE_SIZE));
    const data = await runLoad('');

    expect(data.codes).toHaveLength(CODES_PAGE_SIZE);
    expect(data.hasMore).toBe(false);
  });

  it('keeps the extra row off the page and uses it to offer a next one', async () => {
    getCodes.mockImplementation(() => codes(CODES_PAGE_SIZE + 1));
    const data = await runLoad('');

    expect(data.codes).toHaveLength(CODES_PAGE_SIZE);
    expect(data.hasMore).toBe(true);
  });
});

describe('codes load — failures', () => {
  it('reports the API message rather than throwing', async () => {
    getCodes.mockImplementation(() => Promise.resolve({ errors: [{ message: 'codes are down' }], status: 500 }));
    const data = await runLoad('');

    expect(data.error).toBe('codes are down');
    expect(data.codes).toEqual([]);
  });
});
