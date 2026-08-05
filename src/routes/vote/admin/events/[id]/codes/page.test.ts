// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import type * as ApiClientModule from '$lib/api/client';
import type { Code, CodeSummary, VoteEvent } from '$lib/api/client';
import { VoterType } from '$lib/api/client';
import CodesPage from './+page.svelte';
import type { PageData } from './$types';

const goto = vi.fn();
vi.mock('$app/navigation', () => ({ goto: (href: string) => goto(href), invalidateAll: () => Promise.resolve() }));
vi.mock('$app/state', () => ({ page: { params: { id: 'evt-1' } } }));

/** Only `adminApi` is faked; the enums and types the page renders with stay real. */
const getCodes = vi.fn();
vi.mock('$lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>();
  return {
    ...actual,
    adminApi: {
      getEvent: () => Promise.resolve({ data: { name: 'Hack Night' } as VoteEvent, status: 200 }),
      getCodeSummary: () => Promise.resolve({ data: summary(), status: 200 }),
      getCodes: (...args: unknown[]) => getCodes(...args)
    }
  };
});

function summary(): CodeSummary {
  return { total: 3, student: { codes: 2, votes: 1 }, parent: { codes: 1, votes: 0 } } as CodeSummary;
}

/** `limit` is always PAGE_SIZE + 1, so the page never asks for exactly one page of rows. */
const PAGE_SIZE = 50;

function codes(...values: string[]): { data: Code[]; status: number } {
  return {
    data: values.map((code, index) => ({ id: `${code}-${index}`, code, voter_type: VoterType.Student, has_voted: false }) as Code),
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
  mounted = mount(CodesPage, {
    target,
    // The layout supplies `data`; only the admin session is read here, so that is all it carries.
    props: { data: { adminSession: { id: 'sess-1' } } as unknown as PageData }
  });
  await settle();
}

function button(label: string): HTMLButtonElement {
  const all = [...target.querySelectorAll('button')];
  const found = all.find((b) => b.textContent?.trim() === label);
  if (!found) throw new Error(`No "${label}" button. Buttons: ${all.map((b) => b.textContent?.trim()).join(' | ')}`);
  return found;
}

async function click(label: string): Promise<void> {
  button(label).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await settle();
}

async function type(text: string): Promise<void> {
  const input = target.querySelector('#filter-search') as HTMLInputElement;
  for (const char of text) {
    input.value = input.value + char;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  }
}

async function pressEnter(): Promise<void> {
  const input = target.querySelector('#filter-search') as HTMLInputElement;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await settle();
}

/** The offset each call asked for, which is what a duplicate or an out-of-order fetch shows up as. */
function offsets(): number[] {
  return getCodes.mock.calls.map((call) => (call[2] as { offset: number }).offset);
}

function queries(): string | undefined {
  const last = getCodes.mock.calls.at(-1);
  return (last?.[2] as { q?: string }).q;
}

beforeEach(() => {
  goto.mockClear();
  getCodes.mockReset();
  getCodes.mockImplementation(() => Promise.resolve(codes('AAAA', 'BBBB')));
});

afterEach(() => {
  if (mounted) unmount(mounted);
  mounted = null;
  target?.remove();
  vi.useRealTimers();
});

describe('codes page fetching', () => {
  it('fetches the first page exactly once on mount', async () => {
    await render();

    expect(getCodes).toHaveBeenCalledTimes(1);
    expect(getCodes).toHaveBeenCalledWith('sess-1', 'evt-1', { limit: PAGE_SIZE + 1, offset: 0 });
    expect(target.textContent).toContain('AAAA');
  });

  it('fetches exactly once per page change', async () => {
    await render();

    await click('Next');
    await click('Next');
    await click('Previous');

    // The handlers used to move the offset AND call loadCodes(), so every click fetched twice.
    expect(offsets()).toEqual([0, PAGE_SIZE, PAGE_SIZE * 2, PAGE_SIZE]);
  });

  it('fetches once for a burst of typing, after the debounce, and returns to page 1', async () => {
    vi.useFakeTimers();
    await render();
    await click('Next');
    expect(getCodes).toHaveBeenCalledTimes(2);

    await type('abc');
    // Nothing is applied until the debounce fires, so keystrokes cost no requests at all.
    expect(getCodes).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(250);
    await settle();
    expect(getCodes).toHaveBeenCalledTimes(3);
    expect(queries()).toBe('abc');
    expect(offsets().at(-1)).toBe(0);
  });

  it('fetches once when Enter cuts a pending debounce short', async () => {
    vi.useFakeTimers();
    await render();

    await type('abc');
    await pressEnter();
    expect(getCodes).toHaveBeenCalledTimes(2);
    expect(queries()).toBe('abc');

    // The debounce Enter cancelled must not fire the same search a second time.
    vi.advanceTimersByTime(250);
    await settle();
    expect(getCodes).toHaveBeenCalledTimes(2);
  });

  it('refetches the current page once when the Search button is pressed on unchanged filters', async () => {
    await render();

    await click('Search');
    expect(offsets()).toEqual([0, 0]);
  });
});

describe('codes page request sequencing', () => {
  /** A fetch whose responses are released by hand, so a slow earlier request can be made to land
   * after a fast later one. Installed after the mount fetch has already resolved, so request 0
   * here is the first one made after `render()`. */
  function controllable(): (
    n: number,
    result: { data: Code[]; status: number } | { errors: { message: string }[]; status: number }
  ) => Promise<void> {
    const pending: ((value: unknown) => void)[] = [];
    getCodes.mockImplementation(() => new Promise((resolve) => pending.push(resolve)));
    return async (n, result) => {
      const resolve = pending[n];
      if (!resolve) throw new Error(`No request #${n}; only ${pending.length} were made.`);
      resolve(result);
      await settle();
    };
  }

  it('paints the newest response and drops a slower earlier one', async () => {
    await render();
    const settleCall = controllable();

    // An impatient admin clicks Next twice: page two is still in flight when page three is asked
    // for, and page two's response is the slower of the two.
    await click('Next');
    await click('Next');
    expect(getCodes).toHaveBeenCalledTimes(3);

    await settleCall(1, codes('PAGE-THREE'));
    expect(target.textContent).toContain('PAGE-THREE');

    await settleCall(0, codes('PAGE-TWO'));
    expect(target.textContent).toContain('PAGE-THREE');
    expect(target.textContent).not.toContain('PAGE-TWO');
  });

  it('drops a failure from a request that has already been superseded', async () => {
    await render();
    const settleCall = controllable();

    await click('Next');
    await click('Next');

    await settleCall(1, codes('PAGE-THREE'));
    await settleCall(0, { errors: [{ message: 'the slow one blew up' }], status: 500 });

    expect(target.textContent).not.toContain('the slow one blew up');
    expect(target.textContent).toContain('PAGE-THREE');
  });

  it('still shows the error when the newest request is the one that fails', async () => {
    await render();
    const settleCall = controllable();

    await click('Next');
    await settleCall(0, { errors: [{ message: 'boom' }], status: 500 });

    expect(target.textContent).toContain('boom');
  });
});
