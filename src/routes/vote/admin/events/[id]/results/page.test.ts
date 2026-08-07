// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import type * as ApiClientModule from '$lib/api/client';
import type { EventResults, ProjectTally, VoteEvent } from '$lib/api/client';
import { RESULTS_REFRESH_INTERVAL_MS } from '$lib/utils/constants';
import ResultsPage from './+page.svelte';
import type { PageData } from './$types';

vi.mock('$app/navigation', () => ({ goto: () => Promise.resolve(), invalidateAll: () => Promise.resolve() }));
vi.mock('$app/state', () => ({ page: { params: { id: 'evt-1' } } }));

/** Only `adminApi` is faked; the enums and types the page renders with stay real. */
const getResults = vi.fn();
vi.mock('$lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>();
  return {
    ...actual,
    adminApi: {
      getEvent: () => Promise.resolve({ data: { name: 'Hack Night' } as VoteEvent, status: 200 }),
      getResults: (...args: unknown[]) => getResults(...args)
    }
  };
});

function tallies(...counts: number[]): ProjectTally[] {
  return counts.map(
    (vote_count, index) => ({ project: { id: `p-${index}-${vote_count}`, name: `Project ${index}` }, vote_count }) as ProjectTally
  );
}

/** Student projects deliberately out-scale the parent ones, so a per-category max would differ. */
function results(student: number[], parent: number[]): { data: EventResults; status: number } {
  return {
    data: {
      student: { total_votes: student.reduce((a, b) => a + b, 0), projects: tallies(...student) },
      parent: { total_votes: parent.reduce((a, b) => a + b, 0), projects: tallies(...parent) }
    } as EventResults,
    status: 200
  };
}

/** Runs pending effects, lets the fetch promises settle, then runs the effects that produced. */
async function settle(): Promise<void> {
  flushSync();
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  flushSync();
}

let mounted: Record<string, unknown> | null = null;
let target: HTMLElement;

async function render(): Promise<void> {
  target = document.createElement('div');
  document.body.appendChild(target);
  mounted = mount(ResultsPage, {
    target,
    // The layout supplies `data`; only the admin session is read here, so that is all it carries.
    props: { data: { adminSession: { id: 'sess-1' } } as unknown as PageData }
  });
  await settle();
}

/** Every bar's inline width, in render order: student chart first, then parent. */
function barWidths(): string[] {
  return [...target.querySelectorAll<HTMLElement>('[style*="width"]')].map((el) => el.style.width);
}

async function toggleAutoRefresh(): Promise<void> {
  const checkbox = target.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!checkbox) throw new Error('No auto-refresh checkbox rendered');
  checkbox.checked = true;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
}

/** jsdom's `document.hidden` is read-only, so the visibility the page reacts to is installed here. */
function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  getResults.mockReset();
  getResults.mockImplementation(() => Promise.resolve(results([4, 2], [1])));
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

  it('renders full-width bars rather than dividing by zero when nobody has voted', async () => {
    getResults.mockImplementation(() => Promise.resolve(results([0], [0])));
    await render();

    expect(barWidths()).toEqual(['0%', '0%']);
  });

  it('computes the max once per results change, not once per bar', async () => {
    const max = vi.spyOn(Math, 'max');
    getResults.mockImplementation(() => Promise.resolve(results([5, 4, 3], [2, 1])));

    await render();

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
    expect(getResults).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(RESULTS_REFRESH_INTERVAL_MS * 3);
    await settle();
    expect(getResults).toHaveBeenCalledTimes(1);
  });

  it('refreshes immediately when auto-refresh is turned on', async () => {
    vi.useFakeTimers();
    await render();
    getResults.mockClear();

    await toggleAutoRefresh();
    expect(getResults).toHaveBeenCalledTimes(1);
  });

  it('polls exactly once per interval', async () => {
    vi.useFakeTimers();
    await render();
    await toggleAutoRefresh();
    getResults.mockClear();

    // Exactly one request per tick. The immediate poll runs inside the $effect, so without
    // untrack loadData's writes re-ran the effect and every tick queued a second request.
    vi.advanceTimersByTime(RESULTS_REFRESH_INTERVAL_MS * 2);
    await settle();
    expect(getResults).toHaveBeenCalledTimes(2);
  });

  it('stops polling while the tab is hidden and resumes when it comes back', async () => {
    vi.useFakeTimers();
    await render();
    await toggleAutoRefresh();
    getResults.mockClear();

    setHidden(true);
    vi.advanceTimersByTime(RESULTS_REFRESH_INTERVAL_MS * 10);
    await settle();
    // An admin who leaves auto-refresh on and switches tabs used to hit the endpoint forever.
    expect(getResults).not.toHaveBeenCalled();

    setHidden(false);
    await settle();
    expect(getResults).toHaveBeenCalledTimes(1);
  });

  it('stops polling when auto-refresh is turned back off', async () => {
    vi.useFakeTimers();
    await render();
    await toggleAutoRefresh();

    const checkbox = target.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await settle();
    getResults.mockClear();

    vi.advanceTimersByTime(RESULTS_REFRESH_INTERVAL_MS * 3);
    await settle();
    expect(getResults).not.toHaveBeenCalled();
  });
});
