<script lang="ts">
  import { onMount } from 'svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { goto } from '$app/navigation';
  import { urls } from '$lib/urls';
  import { isApiError, voteApi, type Event } from '$lib/api/client';

  let events = $state<Event[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  // onMount, not $effect: this writes the same $state it would otherwise be tracking, and
  // an added read before the first await would turn it into a self-retriggering fetch loop.
  onMount(() => {
    fetchOpenEvents();
  });

  async function fetchOpenEvents() {
    isLoading = true;
    error = null;

    const response = await voteApi.getOpenEvents();

    isLoading = false;

    if (isApiError(response)) {
      error = response.errors[0]?.message || 'Failed to load events';
      return;
    }

    events = response.data;

    // If exactly one event, redirect directly
    if (events.length === 1 && events[0]) {
      await goto(urls.voteEvent(events[0].key));
    }
  }

  function selectEvent(event: Event) {
    goto(urls.voteEvent(event.key));
  }
</script>

<div class="animate-fade-in">
  {#if isLoading}
    <!-- Loading state -->
    <div class="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
      <div class="inline-flex items-center gap-3 text-gray-600">
        <Spinner size="md" />
        Loading events...
      </div>
    </div>
  {:else if error}
    <!-- Error state. `role="alert"` so a screen-reader voter is told the fetch failed; without it
         the card swaps in silently and the flow just appears to do nothing. -->
    <div class="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-lg" role="alert">
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
      <h2 class="mb-2 text-xl font-bold text-gray-900">Error</h2>
      <p class="text-gray-600">{error}</p>
      <button
        onclick={() => fetchOpenEvents()}
        class="mt-4 rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-yellow-500"
      >
        Try Again
      </button>
    </div>
  {:else if events.length === 0}
    <!-- No events -->
    <div class="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
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
      <h2 class="mb-2 text-xl font-bold text-gray-900">No Active Events</h2>
      <p class="text-gray-600">There are no voting events open at this time. Please check back later.</p>
    </div>
  {:else}
    <!-- Event selection -->
    <div class="mx-auto max-w-md rounded-xl bg-white p-8 shadow-lg">
      <div class="mb-6 text-center">
        <h1 class="mb-2 text-2xl font-bold text-gray-900">Select an Event</h1>
        <p class="text-gray-600">Choose the event you want to vote in.</p>
      </div>

      <div class="space-y-3">
        {#each events as event (event.id)}
          <button
            onclick={() => selectEvent(event)}
            class="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left transition-all duration-200 hover:border-yellow-400 hover:bg-yellow-50"
          >
            <h3 class="font-semibold text-gray-900">{event.name}</h3>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
