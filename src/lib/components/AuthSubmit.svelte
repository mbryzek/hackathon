<script lang="ts">
  /**
   * The submit button of a signed-out form. While `busy` it shows a spinner and `busyLabel`
   * ("Signing in...") and is disabled; the page owns the flag, since the page owns the form.
   */
  import Spinner from '$lib/components/Spinner.svelte';

  interface Props {
    label: string;
    busyLabel: string;
    busy: boolean;
    /** Disabled for a reason other than being busy, such as an empty required field. */
    disabled?: boolean;
  }

  let { label, busyLabel, busy, disabled = false }: Props = $props();
</script>

<button
  type="submit"
  disabled={busy || disabled}
  class="w-full rounded-lg bg-gray-900 px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
>
  {#if busy}
    <span class="inline-flex items-center justify-center gap-2">
      <Spinner />
      {busyLabel}
    </span>
  {:else}
    {label}
  {/if}
</button>
