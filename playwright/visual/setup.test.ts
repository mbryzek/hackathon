/**
 * The app-identity check (ISS-15766).
 *
 * A capture of a sibling's app does not fail -- it completes, and the compare blames every shot on
 * a stylesheet. So what these pin is that the check refuses a document without the marker however
 * it got there, and that this repo's shell still carries the marker, since a template edit that
 * dropped it would turn every capture into a refusal nobody can explain.
 */
// dry-copy: visual-parity/setup-test — every copy of this region must match; `dev repo copies` checks it
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_MARKER } from './plan.ts';
import { assertServesThisApp } from './setup.ts';

const BASE = 'http://127.0.0.1:24680/';

/** A fetch answering every url with one document, as if it had landed at `url`. */
function answer(body: string, url: string = BASE): void {
  vi.stubGlobal('fetch', () => Promise.resolve({ ok: true, status: 200, url, text: () => Promise.resolve(body) }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('APP_MARKER', () => {
  it('is in the shell every page this app serves is rendered into', () => {
    expect(readFileSync('src/app.html', 'utf8')).toContain(APP_MARKER);
  });

  it('names this app rather than something every app carries', () => {
    expect(APP_MARKER).toMatch(/^<!-- visual-parity app: [a-z0-9-]+ -->$/);
  });
});

describe('assertServesThisApp', () => {
  it('passes a document carrying the marker', async () => {
    answer(`<!doctype html><html><head>${APP_MARKER}</head><body></body></html>`);
    await expect(assertServesThisApp(BASE, APP_MARKER)).resolves.toBeUndefined();
  });

  it("refuses a sibling's app, which answered and is not this one", async () => {
    answer('<!doctype html><html><head><!-- visual-parity app: some-other-app --></head></html>');
    await expect(assertServesThisApp(BASE, APP_MARKER)).rejects.toThrow(/is not serving this app/);
  });

  it('names where a redirect landed, since that is usually the answer', async () => {
    answer('<html></html>', 'http://127.0.0.1:24680/login');
    await expect(assertServesThisApp(BASE, APP_MARKER)).rejects.toThrow(/redirected to http:\/\/127\.0\.0\.1:24680\/login/);
  });

  it('refuses when the document cannot be read at all, rather than passing on an empty body', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('ECONNRESET')));
    await expect(assertServesThisApp(BASE, APP_MARKER)).rejects.toThrow(/is not serving this app/);
  });
});
// dry-copy-end
