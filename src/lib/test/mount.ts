/**
 * Mounting a Svelte component into jsdom, and taking it down again.
 *
 * Every component test needs the same four steps — a fresh target in the document, `mount`,
 * `unmount`, and remove the target — and a copy of them per file is how one copy came to
 * unmount an already-unmounted component. Mounting through here registers the teardown once;
 * `unmountComponent` is idempotent, so a test that takes the component away mid-test (to watch
 * what a pending timer does, say) can call it and the teardown after it is a no-op.
 *
 * These files must run under jsdom: `// @vitest-environment jsdom` at the top of the test.
 */

import { afterEach } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';

/**
 * Microtask turns between the two effect flushes. Four is enough for the deepest chain any page
 * here has — an effect that awaits a promise that resolves into another effect — and is one
 * number rather than one per test file.
 */
const SETTLE_TURNS = 4;

/** Runs pending effects, lets any promises settle, then runs the effects that produced. */
export async function settle(): Promise<void> {
  flushSync();
  for (let i = 0; i < SETTLE_TURNS; i += 1) await Promise.resolve();
  flushSync();
}

export interface Mounted {
  /** The element the component was mounted into. Queries run from here, not from `document`. */
  target: HTMLElement;
  settle: () => Promise<void>;
  /** Takes the component away, as a navigation does. Safe to call more than once. */
  unmount: () => void;
}

let mounted: Record<string, unknown> | null = null;
let target: HTMLElement | null = null;

export function unmountComponent(): void {
  // Fire-and-forget: `unmount` without `{ outro: true }` takes the component down
  // synchronously and returns an already-settled promise, and this must stay a sync
  // `() => void` for `mountComponent` and the `Mounted` contract.
  if (mounted) void unmount(mounted);
  mounted = null;
  target?.remove();
  target = null;
}

/**
 * Mounts `component` into a fresh target appended to the document. Any component this module
 * still holds is unmounted first, so a test that renders several times in a row leaves nothing
 * behind.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any --
   `Record<string, any>` is how Svelte's own `mount` is typed, and it is what makes a component
   with required props assignable here: props are contravariant, so a narrower `unknown` shuts
   every real component out. The props argument is still checked against the component's own
   props type. */
export function mountComponent<Props extends Record<string, any>, Exports extends Record<string, unknown>>(
  component: Component<Props, Exports, string>,
  props: Props
): Mounted {
  unmountComponent();

  const element = document.createElement('div');
  document.body.appendChild(element);
  target = element;
  mounted = mount(component, { target: element, props }) as Record<string, unknown>;

  return { target: element, settle, unmount: unmountComponent };
}

afterEach(unmountComponent);
