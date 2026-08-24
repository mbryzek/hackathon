// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import { EventStatus } from '$lib/api/client';
import EventForm from './EventForm.svelte';

vi.mock('$app/forms', () => ({ enhance: () => ({ destroy() {} }) }));

let mounted: Record<string, unknown> | null = null;
let target: HTMLElement;

function render(props: Partial<Record<string, unknown>> = {}): HTMLElement {
  target = document.createElement('div');
  document.body.appendChild(target);
  mounted = mount(EventForm, {
    target,
    props: {
      name: '',
      key: '',
      status: EventStatus.Draft,
      error: null,
      submitLabel: 'Create Event',
      submittingLabel: 'Creating...',
      cancelHref: '/vote/admin',
      ...props
    }
  });
  flushSync();
  return target;
}

function input(id: string): HTMLInputElement {
  return target.querySelector<HTMLInputElement>(`#${id}`)!;
}

afterEach(async () => {
  if (mounted) await unmount(mounted);
  mounted = null;
  target?.remove();
});

describe('EventForm', () => {
  it('renders the submitted values and the status hint both pages now share', () => {
    render({ name: 'Hack Night', key: 'hack-night', status: EventStatus.Open });

    expect(input('name').value).toBe('Hack Night');
    expect(input('key').value).toBe('hack-night');
    expect(target.querySelector<HTMLSelectElement>('#status')!.value).toBe(EventStatus.Open);
    expect(target.textContent).toContain('Set to "Open" when ready to accept votes.');
    expect(target.textContent).toContain('Voting URL: /vote/hack-night');
  });

  it('renders the error banner only when there is an error', async () => {
    expect(render().querySelector('.bg-red-50')).toBeNull();
    await unmount(mounted!);
    mounted = null;
    target.remove();

    expect(render({ error: 'Please enter an event name' }).querySelector('.bg-red-50')!.textContent).toContain(
      'Please enter an event name'
    );
  });

  it('leaves the key alone as the name is typed unless the page asks to mirror it', () => {
    const typed: string[] = [];
    render({ onNameInput: (value: string) => typed.push(value) });

    input('name').value = 'Hack';
    input('name').dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();

    // The mirroring is the page's, not this component's: it only reports what was typed.
    expect(typed).toEqual(['Hack']);
    expect(input('key').value).toBe('');
  });
});
