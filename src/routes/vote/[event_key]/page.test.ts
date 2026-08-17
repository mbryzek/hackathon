// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as ApiClientModule from '$lib/api/client';
import { aVote } from '$lib/test/fixtures';
import { mountComponent, settle } from '$lib/test/mount';
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

let target: HTMLElement;

async function render(): Promise<void> {
  target = mountComponent(VotePage, { data: { event: null } as unknown as PageData }).target;
  await settle();
}

async function submitCode(): Promise<void> {
  (target.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await settle();
}

/**
 * The ballot group. ISS-791 made it a native `<fieldset>` named by its `<legend>`, replacing the
 * hand-rolled `role="group"` + `aria-label` this file used to look for.
 *
 * These throw rather than returning null for the same reason `checkbox()` does in the results
 * page's test: an assertion made through `?.` on an element that is not there compares `undefined`
 * and reports the value it wanted, never the element that went missing — which is exactly how the
 * markup and this test drifted apart unnoticed (ISS-1596).
 */
function ballot(): HTMLFieldSetElement {
  const found = target.querySelector<HTMLFieldSetElement>('fieldset');
  if (!found) throw new Error('No ballot <fieldset> rendered');
  return found;
}

function ballotLegend(): HTMLLegendElement {
  const found = ballot().querySelector('legend');
  if (!found) throw new Error('Ballot <fieldset> has no <legend> to name it');
  return found;
}

/** Every ballot control's input type, in render order — 'radio' or 'checkbox' per ISS-791. */
function ballotInputTypes(): string[] {
  return [...ballot().querySelectorAll('input')].map((input) => input.type);
}

beforeEach(() => verifyCode.mockReset());

describe('vote page accessibility', () => {
  it('announces a rejected code instead of swapping it in silently', async () => {
    verifyCode.mockResolvedValue({ errors: [{ message: 'Invalid code' }], status: 422 });
    await render();

    await submitCode();

    const alert = target.querySelector('[role="alert"]');
    expect(alert?.textContent?.trim()).toBe('Invalid code');
  });

  it('moves focus to the ballot heading when the code form is replaced', async () => {
    verifyCode.mockResolvedValue({ data: aVote({ max_votes: 1 }), status: 200 });
    await render();

    await submitCode();

    // The form that held focus is gone; without this, focus falls back to <body>.
    const heading = target.querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Hack Night');
    expect(document.activeElement).toBe(heading);
  });

  it('groups the projects and names the group with the vote instructions', async () => {
    verifyCode.mockResolvedValue({ data: aVote({ max_votes: 3 }), status: 200 });
    await render();

    await submitCode();

    // The group's accessible name comes from the <legend>'s text, not from an attribute.
    expect(ballotLegend().textContent?.trim()).toBe('Select up to 3 projects');
    // sr-only: the visible copy of the same string is the badge, so an announced-only legend is
    // what keeps the instructions from being rendered twice on screen.
    expect(ballotLegend().className).toContain('sr-only');
    // Several votes are independent choices, so each project is its own checkbox.
    expect(ballotInputTypes()).toEqual(['checkbox', 'checkbox']);
  });

  it('makes a single-vote ballot one radio group', async () => {
    verifyCode.mockResolvedValue({ data: aVote({ max_votes: 1 }), status: 200 });
    await render();

    await submitCode();

    expect(ballotLegend().textContent?.trim()).toBe('Select 1 project');
    // Radios, not checkboxes: picking one has to un-pick the other, and the browser only does
    // that — and only gives arrow-key navigation — when they share a name inside the group.
    expect(ballotInputTypes()).toEqual(['radio', 'radio']);
    expect(new Set([...ballot().querySelectorAll('input')].map((input) => input.name)).size).toBe(1);
  });
});
