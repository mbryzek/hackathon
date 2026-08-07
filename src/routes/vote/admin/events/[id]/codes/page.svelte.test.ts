// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import { VoterType, type Code, type CodeSummary, type VoteEvent } from '$lib/api/client';
import { SEARCH_DEBOUNCE_MS } from '$lib/utils/constants';
import CodesPage from './+page.svelte';
import type { PageData } from './$types';

/**
 * The filters now live in the URL and the rows are fetched by the page's `load` (ISS-788), so
 * "one fetch per interaction, newest response wins" (ISS-487) is the router's job — a superseded
 * navigation is abandoned rather than painted. What is still this page's job, and is what these
 * cover, is asking for exactly one navigation per interaction and not undoing keystrokes.
 */

const state = vi.hoisted(() => ({
  page: { params: { id: 'evt-1' }, url: new URL('http://localhost/vote/admin/events/evt-1/codes') },
  navigating: { to: null }
}));

vi.mock('$app/state', () => ({ page: state.page, navigating: state.navigating }));
vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }), applyAction: () => Promise.resolve() }));

function pageData(overrides: Partial<PageData> = {}): PageData {
  return {
    q: '',
    voterType: undefined,
    hasVoted: undefined,
    offset: 0,
    hasMore: false,
    error: null,
    event: { name: 'Hack Night' } as VoteEvent,
    summary: { total: 3, student: { codes: 2, votes: 1 }, parent: { codes: 1, votes: 0 } } as CodeSummary,
    codes: [{ id: 'c-1', code: 'AAAA', voter_type: VoterType.Student, has_voted: false } as Code],
    ...overrides
  } as PageData;
}

/** Every filter-form submission the page asked for, as the query string it would navigate to. */
const submissions: string[] = [];

function captureSubmit(event: Event) {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  if (form.method.toLowerCase() !== 'get') return;
  submissions.push(new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString());
}

let mounted: Record<string, unknown> | null = null;
let target: HTMLElement;

/** The page's props, reactive, so a test can replace `data` the way a navigation does. */
const props: { data: PageData; form: null } = $state({ data: pageData(), form: null });

function render(data: PageData = pageData()) {
  target = document.createElement('div');
  document.body.appendChild(target);
  props.data = data;
  mounted = mount(CodesPage, { target, props });
  flushSync();
}

/** Replaces the page data, as a completed navigation does. */
function navigateTo(data: PageData) {
  props.data = data;
  flushSync();
}

function searchBox(): HTMLInputElement {
  return target.querySelector('#filter-search') as HTMLInputElement;
}

function type(text: string) {
  const input = searchBox();
  for (const char of text) {
    input.value += char;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  }
}

function clickSearch() {
  const button = [...target.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Search');
  if (!button) throw new Error('No Search button');
  button.click();
  flushSync();
}

function linkHref(label: string): string | undefined {
  return [...target.querySelectorAll('a')].find((a) => a.textContent?.trim() === label)?.getAttribute('href') ?? undefined;
}

beforeEach(() => {
  submissions.length = 0;
  document.addEventListener('submit', captureSubmit, true);
  vi.useFakeTimers();
});

afterEach(() => {
  document.removeEventListener('submit', captureSubmit, true);
  if (mounted) unmount(mounted);
  mounted = null;
  target?.remove();
  vi.useRealTimers();
});

describe('codes page search', () => {
  it('does not navigate until the typing stops', () => {
    render();

    type('abc');
    expect(submissions).toEqual([]);

    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(submissions).toEqual(['q=abc&voter_type=&has_voted=']);
  });

  it('does not fire the debounce behind a search that was asked for explicitly', () => {
    render();

    type('abc');
    clickSearch();
    expect(submissions).toHaveLength(1);

    // The debounce the explicit search cancelled must not repeat it.
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(submissions).toHaveLength(1);
  });

  it('leaves the box alone when its own search lands', () => {
    render();

    type('abc');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

    // A keystroke typed while the search was still in flight, then the search lands.
    type('d');
    navigateTo(pageData({ q: 'abc' }));

    expect(searchBox().value).toBe('abcd');
  });

  it('re-seeds the box when a navigation it did not ask for lands', () => {
    render(pageData({ q: 'abcd' }));

    // Back button: the rows are now the ones for an earlier query, so the box has to say so.
    navigateTo(pageData({ q: 'ab' }));

    expect(searchBox().value).toBe('ab');
  });

  it('drops a pending debounce when the page goes away', () => {
    render();
    type('abc');

    if (mounted) unmount(mounted);
    mounted = null;
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

    expect(submissions).toEqual([]);
  });
});

describe('codes page paging', () => {
  it('carries the applied filters into the next and previous links', () => {
    state.page.url = new URL('http://localhost/vote/admin/events/evt-1/codes?q=ab&voter_type=student&offset=50');
    render(pageData({ q: 'ab', voterType: VoterType.Student, offset: 50, hasMore: true }));

    expect(linkHref('Next')).toBe('?q=ab&voter_type=student&offset=100');
    // Page one drops the offset entirely rather than carrying `offset=0`.
    expect(linkHref('Previous')).toBe('?q=ab&voter_type=student');
  });
});
