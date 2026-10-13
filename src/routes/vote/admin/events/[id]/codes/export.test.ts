import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FileType, type ApiResponse, type File } from '#lib/api/client.ts';
import { config } from '#lib/config.ts';
import { ok } from '#lib/test/adminApiMock.ts';
import { aFile } from '#lib/test/fixtures.ts';
import { expectRedirect, loadEvent } from '#lib/test/requestEvent.ts';

/**
 * The export action sends the browser to the stored file, which the platform API serves from
 * its own origin. SvelteKit refuses a redirect off this origin unless the destination's origin
 * is named, so the action names exactly one: these cover that it is the API's and no other.
 */

const exportCodes = vi.fn<() => Promise<ApiResponse<File>>>();

vi.mock('#lib/server/adminApi.ts', async () => {
  const { mockAdminApi } = await import('#lib/test/adminApiMock.ts');
  return mockAdminApi({ exportCodes: () => exportCodes() });
});

const modules = import.meta.glob('./+page.server.ts');

async function runExport(): Promise<unknown> {
  const importer = modules['./+page.server.ts'];
  if (!importer) throw new Error('No ./+page.server.ts');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { actions } = (await importer()) as { actions: { export: (event: any) => Promise<unknown> } };

  const form = new FormData();
  form.set('format', FileType.Csv);
  const url = 'http://localhost/vote/admin/events/evt-1/codes?/export';

  return actions.export({ ...loadEvent({ url }), request: new Request(url, { method: 'POST', body: form }) });
}

beforeEach(() => {
  exportCodes.mockReset();
});

describe('codes export', () => {
  it('redirects to a file the platform API serves', async () => {
    const url = `${config.apiBaseUrl}/storage/files/file-1/codes.csv?expires=1&signature=abc`;
    exportCodes.mockImplementation(() => ok(aFile({ url })));

    await expectRedirect(runExport, url);
  });

  it('refuses to redirect to any other origin', async () => {
    exportCodes.mockImplementation(() => ok(aFile({ url: 'https://example.test/codes.csv' })));

    await expect(runExport()).rejects.toThrow(/external/i);
  });
});
