import { onMount } from 'svelte';
import { shuffle } from './shuffle';

/**
 * A gallery's items, shuffled once the component has mounted and in the given order until then.
 *
 * These pages are prerendered, so a shuffle during render runs twice: once at build time, which fixes
 * the HTML, and again during hydration, which draws a different order. Hydration keeps the `src` the
 * HTML already has, to avoid a second request, and rewrites the text beside it, so a video ends up
 * captioned with another team's name. Holding the shuffle back until after hydration gives the build
 * and the browser one order to agree on.
 */
export function shuffledAfterMount<T>(items: () => T[], enabled: () => boolean): { readonly current: T[] } {
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  const current = $derived(enabled() && mounted ? shuffle(items()) : items());
  return {
    get current() {
      return current;
    }
  };
}
