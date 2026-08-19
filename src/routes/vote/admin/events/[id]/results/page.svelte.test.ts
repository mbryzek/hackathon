// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RESULTS_REFRESH_INTERVAL_MS } from '$lib/utils/constants';
import { anEvent, anEventResults } from '$lib/test/fixtures';
import { mountComponent, settle } from '$lib/test/mount';
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

/** Student projects deliberately out-scale the parent ones, so a per-category max would differ. */
function pageData(student: number[] = [4, 2], parent: number[] = [1]): PageData {
  return { event: anEvent(), results: anEventResults(student, parent), error: null } as PageData;
}

let target: HTMLElement;

async function render(data: PageData = pageData()): Promise<void> {
  target = mountComponent(ResultsPage, { data }).target;
  await settle();
}

/** Every bar's inline width, in render order: student chart first, then parent. */
function barWidths(): string[] {
  return [...target.querySelectorAll<HTMLElement>('[style*="width"]')].map((el) => el.style.width);
}

/** Every bar's classes, in the same order — the fill carries the category's accent. */
function barClasses(): string[] {
  return [...target.querySelectorAll<HTMLElement>('[style*="width"]')].map((el) => el.className);
}

/** The rank badge on each row, in render order across both lists. */
function ranks(): string[] {
  return [...target.querySelectorAll('[class*="h-12"]')].map((el) => el.textContent?.trim() ?? '');
}

function headings(): string[] {
  return [...target.querySelectorAll('h2')].map((el) => el.textContent?.trim() ?? '');
}

/** The vote total on the tile whose accent is `accentClass`. */
function tileTotal(accentClass: string): string {
  const found = target.querySelector(`[class*="${accentClass}"]`);
  if (!found) throw new Error(`No tile rendered with ${accentClass}`);
  return found.textContent?.trim() ?? '';
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

describe('per-voter-type tally lists', () => {
  it('renders one list per voter type, each keeping its own accent', async () => {
    await render(pageData([4, 2], [1]));

    // Both lists come from one definition now; the accent is the parameter that still differs, so
    // a collapse of the two into one colour is what this asserts against.
    expect(headings()).toEqual(['Student Votes', 'Parent Votes']);
    expect(barClasses()[0]).toContain('bg-yellow-400');
    expect(barClasses()[2]).toContain('bg-blue-400');
  });

  it('gives each voter type its own total tile', async () => {
    await render(pageData([4, 2], [1]));

    expect(tileTotal('text-blue-600')).toBe('6');
    expect(tileTotal('text-purple-600')).toBe('1');
  });

  it('ranks ties within a voter type, not across both', async () => {
    await render(pageData([3, 3, 1], [2]));

    // Student: two tied leaders share rank 1 and the next is 3. Parent ranks restart at 1 — a list
    // ranked against the wrong array is the failure the shared definition could introduce.
    expect(ranks()).toEqual(['1', '1', '3', '1']);
  });

  it('shows the empty message only for the voter type with no votes', async () => {
    await render(pageData([3], []));

    expect(target.textContent).toContain('No parent votes yet.');
    expect(target.textContent).not.toContain('No student votes yet.');
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
    //
    // Advanced asynchronously so the microtask queue drains between the two interval callbacks, as
    // it does under real timers. The synchronous `advanceTimersByTime` runs both in one burst with
    // no checkpoint in between, which leaves the first refresh's promise unsettled — and the
    // poller's in-flight guard then skips the second tick rather than stacking a refresh on it.
    await vi.advanceTimersByTimeAsync(RESULTS_REFRESH_INTERVAL_MS * 2);
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
