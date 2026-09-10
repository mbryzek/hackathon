/**
 * The cold-server proof (ISS-10161).
 *
 * What these pin is the one failure the A/A gate cannot reach. The gate captures the same server
 * twice before anybody edits anything; the capture that goes wrong is the one taken AFTER an edit,
 * off the server still running, and it goes wrong quietly — every hash plausible, the extra
 * mismatches landing on pages the branch never touched. So the question is not whether the crawl
 * is fast, it is whether it can be trusted to say NOTHING FOUND: a document that redirected, a
 * server that is not a dev server, and a graph the crawl gave up on part way must each be
 * distinguishable from a graph that was walked and was clean.
 */
// dry-copy: visual-parity/cold-server-test — every copy of this region must match; `dev repo copies` checks it
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertColdServer, devModuleReferences, isHmrStamped, scanForHmr } from './coldServer.ts';

/** A fetch answering a fixed url -> body map, and 404 for anything else. */
function serve(bodies: Record<string, string>): void {
  vi.stubGlobal('fetch', (input: string | URL) => {
    const path = new URL(String(input), 'http://localhost:5391').pathname + new URL(String(input), 'http://localhost:5391').search;
    const body = bodies[path];
    if (body === undefined) return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('') });
    return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(body) });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env['VISUAL_ALLOW_HOT_SERVER'];
});

describe('devModuleReferences', () => {
  it('takes the module urls out of a dev document and leaves the routes alone', () => {
    const html = `<a href="/dev-viz">x</a><script type="module" src="/@vite/client"></script>
      <script type="module">import "/.svelte-kit/generated/client/app.js";</script>`;
    expect(devModuleReferences(html)).toEqual(['/@vite/client', '/.svelte-kit/generated/client/app.js']);
  });

  it('keeps the query, which is where the stamp lives', () => {
    expect(devModuleReferences('import "/src/app.css?t=1757530000000";')).toEqual(['/src/app.css?t=1757530000000']);
  });

  it('deduplicates, so a module imported twice is fetched once', () => {
    expect(devModuleReferences('import "/src/a.ts"; import("/src/a.ts");')).toEqual(['/src/a.ts']);
  });

  it('ignores an asset url and a bare specifier', () => {
    expect(devModuleReferences('"/favicon.png" "svelte" "/api/clubs"')).toEqual([]);
  });
});

describe('isHmrStamped', () => {
  it('recognises the timestamp vite puts on an invalidated module', () => {
    expect(isHmrStamped('/src/app.css?t=1757530000000')).toBe(true);
    expect(isHmrStamped('/src/app.css?import&t=1757530000000')).toBe(true);
  });

  /**
   * A dep is served with a content hash under `?v=`, and it carries that on a COLD server too.
   * Reading it as an HMR stamp would refuse every capture there has ever been.
   */
  it('is not fooled by a dependency hash or by somebody else\'s "t"', () => {
    expect(isHmrStamped('/node_modules/.vite/deps/svelte.js?v=8f1c2a3b')).toBe(false);
    expect(isHmrStamped('/src/chart.ts?t=4')).toBe(false);
  });
});

describe('scanForHmr', () => {
  it('follows the graph and finds a stamp the base document does not carry itself', async () => {
    serve({
      '/.svelte-kit/generated/client/app.js': 'import "/src/routes/+layout.svelte";',
      '/src/routes/+layout.svelte': 'import "/src/app.css?t=1757530000000";',
      '/src/app.css?t=1757530000000': ''
    });
    const scan = await scanForHmr('http://localhost:5391', 'import "/.svelte-kit/generated/client/app.js";');
    expect(scan.stamped).toEqual(['/src/app.css?t=1757530000000']);
    expect(scan.truncated).toBe(false);
  });

  it('walks a cycle once rather than forever', async () => {
    serve({ '/src/a.ts': 'import "/src/b.ts";', '/src/b.ts': 'import "/src/a.ts";' });
    const scan = await scanForHmr('http://localhost:5391', 'import "/src/a.ts";');
    expect(scan).toEqual({ scanned: 2, stamped: [], truncated: false });
  });

  it('reports a module the server refused rather than treating it as evidence', async () => {
    serve({});
    const scan = await scanForHmr('http://localhost:5391', 'import "/src/gone.ts";');
    expect(scan).toEqual({ scanned: 1, stamped: [], truncated: false });
  });

  it('scans nothing when the document references no dev module', async () => {
    serve({});
    expect(await scanForHmr('http://localhost:5391', '<html><body>built</body></html>')).toEqual({
      scanned: 0,
      stamped: [],
      truncated: false
    });
  });
});

describe('assertColdServer', () => {
  it('refuses a server serving a stamped module, naming it', async () => {
    serve({ '/': 'import "/src/app.css?t=1757530000000";', '/src/app.css?t=1757530000000': '' });
    await expect(assertColdServer('http://localhost:5391/')).rejects.toThrow(/HOT-RELOADED since it started/);
    await expect(assertColdServer('http://localhost:5391/')).rejects.toThrow(/src\/app\.css\?t=1757530000000/);
  });

  it('lets a cold dev server through', async () => {
    serve({ '/': 'import "/src/app.css";', '/src/app.css': '' });
    await expect(assertColdServer('http://localhost:5391/')).resolves.toBeUndefined();
  });

  /** `npm run preview` serves a built bundle: no dev module urls, and no HMR to have happened. */
  it('lets a server that is not a dev server through', async () => {
    serve({ '/': '<html><body>built</body></html>' });
    await expect(assertColdServer('http://localhost:5391/')).resolves.toBeUndefined();
  });

  it('warns instead of refusing when the operator has said to capture anyway', async () => {
    serve({ '/': 'import "/src/app.css?t=1757530000000";', '/src/app.css?t=1757530000000': '' });
    process.env['VISUAL_ALLOW_HOT_SERVER'] = '1';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(assertColdServer('http://localhost:5391/')).resolves.toBeUndefined();
    expect(warn.mock.calls[0]?.[0]).toMatch(/VISUAL_ALLOW_HOT_SERVER=1/);
    warn.mockRestore();
  });
});
// dry-copy-end
