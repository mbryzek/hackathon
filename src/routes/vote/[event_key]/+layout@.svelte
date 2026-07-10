<script lang="ts">
  import type { Snippet } from 'svelte';
  import Shell from '$lib/components/Shell.svelte';
  import type { LayoutData } from './$types';

  interface Props {
    data: LayoutData;
    children: Snippet;
  }

  let { data, children }: Props = $props();

  const title = $derived(data.event?.name ?? 'Project Voting');
</script>

<svelte:head>
  <title>{title} - Vote - Bergen Tech Hackathon</title>
</svelte:head>

<Shell {title}>
  {#if data.event}
    {@render children()}
  {:else}
    <div class="animate-fade-in">
      <div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto text-center" data-testid="vote-not-available">
        <div class="text-gray-400 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Voting Not Available</h2>
        <p class="text-gray-600">This voting event is not currently open. Please check back later.</p>
      </div>
    </div>
  {/if}
</Shell>
