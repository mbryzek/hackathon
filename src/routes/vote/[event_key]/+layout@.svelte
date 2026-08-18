<script lang="ts">
  import type { Snippet } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import Shell from '$lib/components/Shell.svelte';
  import type { LayoutData } from './$types';

  interface Props {
    data: LayoutData;
    children: Snippet;
  }

  let { data, children }: Props = $props();

  const title = $derived(data.event?.name ?? 'Project Voting');

  let isRetrying = $state(false);

  /** Re-runs the layout load, which is the only thing that fetches the event. */
  async function retry() {
    isRetrying = true;
    try {
      await invalidateAll();
    } finally {
      isRetrying = false;
    }
  }
</script>

<svelte:head>
  <title>{title} - Vote - Bergen Tech Hackathon</title>
</svelte:head>

<Shell {title}>
  {#if data.event}
    {@render children()}
  {:else if data.loadFailed}
    <!-- Distinct from the gate below: the event may well be open, we just could not find out.
         `role="alert"` so this is announced rather than silently swapped in. -->
    <div class="animate-fade-in">
      <div class="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-lg" data-testid="vote-load-failed" role="alert">
        <div class="mb-4 text-red-600">
          <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
        </div>
        <h2 class="mb-2 text-xl font-bold text-gray-900">Couldn't load this event</h2>
        <p class="text-gray-600">Check your connection and try again.</p>
        <button
          type="button"
          onclick={retry}
          disabled={isRetrying}
          class="mt-4 rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    </div>
  {:else}
    <div class="animate-fade-in">
      <div class="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-lg" data-testid="vote-not-available">
        <div class="mb-4 text-gray-400">
          <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
        </div>
        <h2 class="mb-2 text-xl font-bold text-gray-900">Voting Not Available</h2>
        <p class="text-gray-600">This voting event is not currently open. Please check back later.</p>
      </div>
    </div>
  {/if}
</Shell>
