import { describe, it, expect } from 'vitest';
import { adminApi } from './client';

/**
 * Every admin page clears its spinner on the RETURNED response, never in a `catch`, so these
 * wrappers rejecting is what leaves a page loading forever. These pin the contract that they
 * do not — including for an error body the generated `must*` parser cannot parse.
 *
 * `login` is used for the 422 cases because it is one of the operations whose generated client
 * declares a 422 and throws `ValidationErrorsResponse`; `getEvent` declares only 401.
 */
function stubFetch(makeResponse: () => Promise<Response>) {
  return async <T>(call: () => Promise<T>): Promise<T> => {
    const original = globalThis.fetch;
    globalThis.fetch = makeResponse as typeof globalThis.fetch;
    try {
      return await call();
    } finally {
      globalThis.fetch = original;
    }
  };
}

function json(status: number, body: string): () => Promise<Response> {
  return () => Promise.resolve(new Response(body, { status, headers: { 'Content-Type': 'application/json' } }));
}

describe('api client error normalisation', () => {
  it('resolves rather than rejecting when a 422 body cannot be parsed', async () => {
    // A 422 produced by a gateway or WAF rather than by the API. `validationErrors()` parses with
    // `Util.mustParseArray`, which throws on an unexpected shape — that throw used to escape the
    // wrapper as a rejected promise and strand whatever was loading.
    const withFetch = stubFetch(json(422, JSON.stringify({ message: 'blocked by gateway' })));

    const result = await withFetch(() => adminApi.login('a@b.com', 'pw'));

    expect(result.status).toBe(422);
    expect(result.errors?.[0]?.message).toBe('Server error');
    expect(result.data).toBeUndefined();
  });

  it('still surfaces a well-formed validation error as its real messages', async () => {
    const body = JSON.stringify([{ code: 'validation_error', message: 'Email is required', field: 'email' }]);
    const withFetch = stubFetch(json(422, body));

    const result = await withFetch(() => adminApi.login('', 'pw'));

    expect(result.errors?.[0]?.message).toBe('Email is required');
    expect(result.errors?.[0]?.field).toBe('email');
  });

  it('normalises an unauthorized response to a 401', async () => {
    const withFetch = stubFetch(json(401, ''));

    const result = await withFetch(() => adminApi.getEvent('sess-1', 'evt-1'));

    expect(result.status).toBe(401);
    expect(result.errors?.[0]?.code).toBe('unauthorized');
  });

  it('normalises a thrown network failure instead of rejecting', async () => {
    const withFetch = stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

    const result = await withFetch(() => adminApi.getEvent('sess-1', 'evt-1'));

    expect(result.status).toBe(500);
    expect(result.errors?.[0]?.message).toBe('Server error');
  });
});
