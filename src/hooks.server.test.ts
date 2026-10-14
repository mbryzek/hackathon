import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { describe, it, expect, vi } from 'vitest';
import { handle, handleError } from './hooks.server';
import { SECURITY_HEADERS } from '#lib/security-headers.ts';

type HandleInput = Parameters<Handle>[0];

/** The hook reads nothing of the event but hands it to `resolve`, so the event is faked down to its url. */
async function invoke(pathname: string, response: Response = new Response('ok')): Promise<Response> {
  const input = {
    event: { url: new URL(`https://bthackathon.com${pathname}`) },
    resolve: (): Response => response
  } as unknown as HandleInput;

  return handle(input);
}

/** A header the hook failed to set reads back as `null`, so a miss names itself in the diff. */
function headersOf(response: Response): Record<string, string | null> {
  return Object.fromEntries(Object.keys(SECURITY_HEADERS).map((name) => [name, response.headers.get(name)]));
}

describe('handle', () => {
  /**
   * Only what the worker renders reaches this hook at all — the prerendered pages are covered by
   * `_headers` instead — so these are the rendered ones: the version endpoint and a path no page
   * answers.
   */
  it.each(['/_internal_/version', '/no-such-page'])('sets the security headers on %s', async (pathname) => {
    const response = await invoke(pathname);
    expect(headersOf(response)).toEqual({ ...SECURITY_HEADERS });
  });

  it('sets the security headers on a 404', async () => {
    const response = await invoke('/no-such-page', new Response('Not Found', { status: 404 }));

    expect(response.status).toBe(404);
    expect(headersOf(response)).toEqual({ ...SECURITY_HEADERS });
  });
});

type HandleErrorInput = Parameters<HandleServerError>[0];

/** The hook reads the request's method and path and the route id, so the event is faked down to those. */
function eventAt(pathname: string): HandleErrorInput['event'] {
  return {
    url: new URL(`https://bthackathon.com${pathname}`),
    request: new Request(`https://bthackathon.com${pathname}`),
    route: { id: '/_internal_/version' }
  } as unknown as HandleErrorInput['event'];
}

/** Something this app's own code threw: the one kind that is a fault. */
function failure(pathname: string, error: unknown = new Error('boom')): HandleErrorInput {
  return { kind: 'unknown', error, event: eventAt(pathname) };
}

describe('handleError', () => {
  it('logs a [Server Error] line under the same errorId it hands the error page', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('boom');

    const result = await handleError(failure('/_internal_/version', error));

    expect(result?.errorId).toMatch(/^[0-9a-f-]{36}$/);
    expect(consoleError).toHaveBeenCalledWith('[Server Error]', {
      errorId: result?.errorId,
      method: 'GET',
      path: '/_internal_/version',
      route: '/_internal_/version',
      error
    });
    consoleError.mockRestore();
  });

  it('mints a distinct errorId per failure, so two reports never name the same line', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const first = await handleError(failure('/_internal_/version'));
    const second = await handleError(failure('/_internal_/version'));

    expect(first?.errorId).not.toEqual(second?.errorId);
    consoleError.mockRestore();
  });

  /**
   * SvelteKit hands this hook every error, expected ones included. Returning nothing keeps the
   * status and message it already gave them, so a 404 renders as a 404 and carries no reference.
   */
  it.each<[string, HandleErrorInput]>([
    ['an unmatched route', { kind: 'framework', error: { status: 404, message: 'Not Found' }, event: eventAt('/favicon.ico') }],
    ['an error() this app threw', { kind: 'app', error: { status: 404, message: 'Not found' }, event: eventAt('/Y26/') }],
    ['a validation failure', { kind: 'validation', error: { status: 400, message: 'Bad Request' }, issues: [], event: eventAt('/') }]
  ])('neither logs nor overrides %s', async (_name, caught) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await handleError(caught);

    expect(result).toBeUndefined();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
