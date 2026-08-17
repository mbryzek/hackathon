import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Event } from '$lib/api/client';
import { anEvent } from '$lib/test/fixtures';

const getOpenEvents = vi.fn();
vi.mock('$lib/api/client', () => ({ voteApi: { getOpenEvents: () => getOpenEvents() } }));

const { load } = await import('./+layout');

function run(eventKey: string) {
  return load({ params: { event_key: eventKey } } as never) as Promise<{ event: Event | null; loadFailed: boolean }>;
}

const openEvent = anEvent({ key: 'hack-2026' });

beforeEach(() => getOpenEvents.mockReset());

describe('event layout load', () => {
  it('returns the matching open event', async () => {
    getOpenEvents.mockResolvedValue({ data: [openEvent], status: 200 });

    expect(await run('hack-2026')).toEqual({ event: openEvent, loadFailed: false });
  });

  it('reports a key that is not open as absent, not as a failure', async () => {
    // Draft, closed and unknown events all land here. This is the real gate, and it must keep
    // showing "not currently open" rather than the new connection error.
    getOpenEvents.mockResolvedValue({ data: [openEvent], status: 200 });

    expect(await run('some-other-event')).toEqual({ event: null, loadFailed: false });
  });

  it('reports a failed call as a failure, not as a closed event', async () => {
    getOpenEvents.mockResolvedValue({ errors: [{ message: 'Server error' }], status: 500 });

    // Previously `response.data?.find(...) ?? null` made this indistinguishable from the case
    // above, so a voter on a flaky network was told to come back later for a live event.
    expect(await run('hack-2026')).toEqual({ event: null, loadFailed: true });
  });

  it('treats a success with no body as a failure rather than assuming nothing is open', async () => {
    getOpenEvents.mockResolvedValue({ status: 200 });

    expect(await run('hack-2026')).toEqual({ event: null, loadFailed: true });
  });
});
