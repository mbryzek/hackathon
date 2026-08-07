// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import type * as ApiClientModule from '$lib/api/client';
import { VoterType, type Vote } from '$lib/api/client';
import VotePage from './+page.svelte';
import type { PageData } from './$types';

vi.mock('$app/navigation', () => ({ goto: () => Promise.resolve() }));
vi.mock('$app/state', () => ({
  page: { params: { event_key: 'hack-2026' }, url: new URL('http://localhost/vote/hack-2026') }
}));

/** Only `voteApi` is faked; the enums and types the page renders with stay real. */
const verifyCode = vi.fn();
vi.mock('$lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClientModule>();
  return { ...actual, voteApi: { verifyCode: () => verifyCode() } };
});

function vote(maxVotes: number): Vote {
  return {
    event: { name: 'Hack Night' },
    voter_type: VoterType.Student,
    max_votes: maxVotes,
    projects: [
      { project: { id: 'p1', name: 'Team 1' }, selected: false },
      { project: { id: 'p2', name: 'Team 2' }, selected: false }
    ]
  } as unknown as Vote;
}

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
  mounted = mount(VotePage, { target, props: { data: { event: null } as unknown as PageData } });
  await settle();
}

async function submitCode(): Promise<void> {
  (target.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await settle();
}

beforeEach(() => verifyCode.mockReset());

afterEach(() => {
  if (mounted) unmount(mounted);
  mounted = null;
  target?.remove();
});

describe('vote page accessibility', () => {
  it('announces a rejected code instead of swapping it in silently', async () => {
    verifyCode.mockResolvedValue({ errors: [{ message: 'Invalid code' }], status: 422 });
    await render();

    await submitCode();

    const alert = target.querySelector('[role="alert"]');
    expect(alert?.textContent?.trim()).toBe('Invalid code');
  });

  it('moves focus to the ballot heading when the code form is replaced', async () => {
    verifyCode.mockResolvedValue({ data: vote(1), status: 200 });
    await render();

    await submitCode();

    // The form that held focus is gone; without this, focus falls back to <body>.
    const heading = target.querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Hack Night');
    expect(document.activeElement).toBe(heading);
  });

  it('groups the projects and names the group with the vote instructions', async () => {
    verifyCode.mockResolvedValue({ data: vote(3), status: 200 });
    await render();

    await submitCode();

    const group = target.querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('Select up to 3 projects');
    expect(group?.querySelectorAll('button').length).toBe(2);
  });
});
