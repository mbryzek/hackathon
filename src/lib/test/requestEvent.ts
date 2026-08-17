/**
 * The slice of a SvelteKit `RequestEvent` a `load` or an action actually reads, and the
 * assertion for the redirect one throws.
 *
 * The cookie jar records every deletion WITH its path, because a delete without `path: '/'`
 * does not clear the cookie the login action set — four hand-rolled jars disagreed about
 * whether to record deletions at all, and the one that swallowed them left its test unable to
 * assert the cookie-clearing it was covering.
 */

import { expect } from 'vitest';
import { isRedirect, type Cookies } from '@sveltejs/kit';

/** The admin session id these run with. Recognisable, so a leak of it into page data stands out. */
export const TEST_SESSION_ID = 'sess-not-for-the-browser';

export interface DeletedCookie {
  name: string;
  path: string | undefined;
}

export type FakeCookies = Cookies & { deleted: DeletedCookie[] };

export function fakeCookies(jar: Record<string, string> = {}): FakeCookies {
  const deleted: DeletedCookie[] = [];

  return {
    deleted,
    get: (name: string) => jar[name],
    getAll: () => Object.entries(jar).map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => void (jar[name] = value),
    delete: (name: string, options?: { path?: string }) => void deleted.push({ name, path: options?.path }),
    serialize: () => ''
  } as unknown as FakeCookies;
}

export interface LoadEventOptions {
  url?: string;
  cookies?: FakeCookies;
  params?: Record<string, string>;
  /** `null` means no admin session at all — what an unauthenticated request looks like. */
  sessionId?: string | null;
}

export function loadEvent({
  url = 'http://localhost/vote/admin',
  cookies = fakeCookies(),
  params = { id: 'evt-1' },
  sessionId = TEST_SESSION_ID
}: LoadEventOptions = {}) {
  return {
    locals: sessionId === null ? {} : { adminSession: { id: sessionId } },
    cookies,
    params,
    url: new URL(url)
  };
}

/**
 * Asserts that `run` redirected to `location`. Anything else thrown is re-thrown as itself: a
 * hand-rolled version that cast the thrown value instead reported a genuine `TypeError` in the
 * code under test as `expected undefined to be '/vote/admin/login'`.
 */
export async function expectRedirect(run: () => unknown, location: string, status: number = 303): Promise<void> {
  try {
    await run();
  } catch (thrown) {
    if (!isRedirect(thrown)) throw thrown;
    expect({ status: thrown.status, location: thrown.location }).toEqual({ status, location });
    return;
  }

  throw new Error(`Expected a redirect to ${location}, but the call returned normally.`);
}
