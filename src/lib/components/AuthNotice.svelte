<script lang="ts">
  /**
   * The coloured box a signed-out page uses to report an outcome: a link that worked, one that
   * expired, a request acknowledged, a failure worth retrying. Failures of a submission are
   * `ErrorBanner`'s, not this.
   *
   * Every tone is `role="status"`: the notice is the page's answer, and a screen-reader user
   * landing on it or watching it replace a form should be told it, whatever its colour.
   */
  import type { Snippet } from 'svelte';

  interface Props {
    tone: 'success' | 'warning' | 'info';
    /** Rendered as the page's `<h1>` — pass it when the notice is the whole page. */
    heading?: string;
    testid?: string;
    children: Snippet;
  }

  let { tone, heading = '', testid, children }: Props = $props();

  const tones = {
    success: { box: 'border-green-200 bg-green-50', heading: 'text-green-900', body: 'text-green-800' },
    warning: { box: 'border-yellow-200 bg-yellow-50', heading: 'text-yellow-900', body: 'text-yellow-800' },
    info: { box: 'border-blue-200 bg-blue-50', heading: 'text-blue-900', body: 'text-blue-800' }
  };

  const classes = $derived(tones[tone]);
</script>

<div class={['rounded-lg border', classes.box, heading ? 'p-6' : 'px-4 py-3']} role="status" data-testid={testid}>
  {#if heading}
    <h1 class={['mb-2 text-xl font-bold', classes.heading]}>{heading}</h1>
  {/if}
  <div class={classes.body}>
    {@render children()}
  </div>
</div>
