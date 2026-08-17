<script lang="ts">
  interface Props {
    /** The message to show. Typically a load's `data.error` or an action's `form.error`. */
    error: string;
    /** Extra classes, typically a trailing margin or `text-center`. */
    class?: string;
  }

  let { error, class: className = '' }: Props = $props();

  const classes = $derived(`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${className}`.trimEnd());
</script>

<!-- `role="alert"` so a screen-reader user is told the page or the submission failed; without it
     the banner swaps into the DOM silently and the flow just appears to do nothing. -->
<div class={classes} role="alert">
  {error}
</div>
