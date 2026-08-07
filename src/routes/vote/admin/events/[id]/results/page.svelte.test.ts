// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import type { EventResults, ProjectTally, VoteEvent } from '$lib/api/client';
import { RESULTS_REFRESH_INTERVAL_MS } from '$lib/utils/constants';
import ResultsPage from './+page.svelte';
import type { PageData } from './$types';

/**
 * The tallies arrive from the page's `load` and a refresh is `invalidateAll()` (ISS-788 — the
 * session id stays on the server, so the browser never fetches results itself). So a poll is
 * observable here as an `invalidateAll` call, not as an API call.
 */
const invalidateAll = vi.fn(() => Promise.resolve());
vi.mock('$app/navigation', () => ({ invalidateAll: () => invalidateAll() }));
vi.mock('$app/state', () => ({ page: { params: { id: 'evt-1' } } }));

function tallies(...counts: number[]): ProjectTally[] {
  return counts.map(
    (vote_count, index) => ({ project: { id: `p-${index}-${vote_count}`, name: `Project ${index}` }, vote_count }) as ProjectTally
  );
}

/** Student projects deliberately out-scale the parent ones, so a per-category max would differ. */
function pageData(student: number[] = [4, 2], parent: number[] = [1]): PageData {
  return {
    event: { name: 'Hack Night' } as VoteEvent,
    results: {
      student: { total_votes: student.reduce((a, b) => a + b, 0), projects: tallies(...student) },
      parent: { total_votes: parent.reduce((a, b) => a + b, 0), projects: tallies(...parent) }
    } as EventResults,
    error: null
  } as PageData;
}

/** Runs pending effects, lets any promises settle, then runs the effects that produced. */
async function settle(): Promise<void> {
  flushSync();
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  flushSync();
}

let mounted: Record<string, unknown> | null = null;
let target: HTMLElement;

async function render(data: PageData = pageData()): Promise<void> {
  target = document.createElement('div');
  document.body.appendChild(target);
  mounted = mount(ResultsPage, { target, props: { data } });
  await settle();
}

/** Every bar's inline width, in render order: student chart first, then parent. */
function barWidths(): string[] {
  return [...target.querySelectorAll<HTMLElement>('[style*="width"]')].map((el) => el.style.width);
}

function checkbox(): HTMLInputElement {
  const found = target.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!found) throw new Error('No auto-refresh checkbox rendered');
  return found;
}

async function setAutoRefresh(on: boolean): Promise<void> {
  const input = checkbox();
  input.checked = on;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}

/** jsdom's `document.hidden` is read-only, so the visibility the page reacts to is installed here. */
function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  invalidateAll.mockClear();
});

afterEach(() => {
  if (mounted) unmount(mounted);
  mounted = null;
  target?.remove();
  setHidden(false);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('results chart scale', () => {
  it('scales every bar to the highest vote count across both categories', async () => {
    await render();

    // 4 is the overall max; the parent chart's own max (1) must not rescale it to 100%.
    expect(barWidths()).toEqual(['100%', '50%', '25%']);
  });

  it('renders zero-width bars rather than dividing by zero when nobody has voted', async () => {
    await render(pageData([0], [0]));

    expect(barWidths()).toEqual(['0%', '0%']);
  });

  it('computes the max once per results change, not once per bar', async () => {
    const max = vi.spyOn(Math, 'max');

    await render(pageData([5, 4, 3], [2, 1]));

    // `maxVotes` is the page's only Math.max. As `$derived(() => ...)` called from getBarWidth it
    // re-ran for each of the five bars; as `$derived(expr)` it memoizes.
    expect(barWidths()).toHaveLength(5);
    expect(max).toHaveBeenCalledTimes(1);
  });
});

describe('results auto-refresh', () => {
  it('does not poll until auto-refresh is turned on', async () => {
    vi.useFakeTimers();
    await render();

    vi.advanceTimersByTime(RESULTS_REFRESH_INTERVAL_MS * 3);
    await settle();
    expect(invalidateAll).not.toHaveBeenCalled();
  });

  it('refreshes immediately when auto-refresh is turned on', async () => {
    vi.useFakeTimers();
    await render();

    await setAutoRefresh(true);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
  });

  it('polls exactly once per interval', async () => {
    vi.useFakeTimers();
    await render();
    await setAutoRefresh(true);
    invalidateAll.mockClear();

    // Exactly one refresh per tick. The immediate poll runs inside the $effect, so the effect must
    // not read anything invalidateAll replaces — otherwise each refresh re-runs it and re-polls.
    vi.advanceTimersByTime(RESULTS_REFRESH_INTERVAL_MS * 2);
    await settle();
    expect(invalidateAll).toHaveBeenCalledTimes(2);
  });

  it('stops polling while the tab is hidden and resumes when it comes back', async () => {
    vi.useFakeTimers();
    await render();
    await setAutoRefresh(true);
    invalidateAll.mockClear();

    setHidden(true);
    vi.advanceTimersByTime(RESULTS_REFRESH_INTERVAL_MS * 10);
    await settle();
    // Results sit on a projector for a whole event; an admin who switches tabs with auto-refresh
    // on used to keep hitting the endpoint every 5s with nobody looking at the answer.
    expect(invalidateAll).not.toHaveBeenCalled();

    setHidden(false);
    await settle();
    expect(invalidateAll).toHaveBeenCalledTimes(1);
  });

  it('stops polling when auto-refresh is turned back off', async () => {
    vi.useFakeTimers();
    await render();
    await setAutoRefresh(true);

    await setAutoRefresh(false);
    invalidateAll.mockClear();

    vi.advanceTimersByTime(RESULTS_REFRESH_INTERVAL_MS * 3);
    await settle();
    expect(invalidateAll).not.toHaveBeenCalled();
  });
});
