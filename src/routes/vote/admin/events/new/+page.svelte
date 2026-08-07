<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte';
  import { enhance } from '$app/forms';
  import { urls } from '$lib/urls';
  import { EventStatus } from '$lib/api/client';
  import { EVENT_STATUS_OPTIONS } from '$lib/utils/eventDisplay';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  // Seeded from the last rejected submit so a form that comes back with an error still holds
  // what was typed, with or without JavaScript. The action owns validation; these only drive
  // the key/name mirroring below.
  // svelte-ignore state_referenced_locally
  let name = $state(form?.name ?? '');
  // svelte-ignore state_referenced_locally
  let key = $state(form?.key ?? '');
  let isSubmitting = $state(false);

  const status = $derived(form?.status ?? EventStatus.Draft);

  // Auto-generate key from name
  function handleNameChange() {
    if (!key || key === slugify(name.slice(0, -1))) {
      key = slugify(name);
    }
  }

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
</script>

<div class="animate-fade-in max-w-2xl mx-auto">
  <div class="mb-8">
    <a href={urls.voteAdmin} class="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
      Back to Events
    </a>
    <h1 class="text-2xl font-bold text-gray-900 mt-4">Create New Event</h1>
  </div>

  <div class="bg-white shadow rounded-xl p-6">
    <form
      method="POST"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          await update();
          isSubmitting = false;
        };
      }}
      class="space-y-6"
    >
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2"> Event Name </label>
        <input
          type="text"
          id="name"
          name="name"
          bind:value={name}
          oninput={handleNameChange}
          placeholder="e.g., Hackathon 2025"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label for="key" class="block text-sm font-medium text-gray-700 mb-2"> Event Key (URL slug) </label>
        <input
          type="text"
          id="key"
          name="key"
          bind:value={key}
          placeholder="e.g., hackathon-2025"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors font-mono"
          disabled={isSubmitting}
        />
        <p class="mt-2 text-sm text-gray-500">
          This will be used in the voting URL: /vote/{key || 'event-key'}
        </p>
      </div>

      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
        <select
          id="status"
          name="status"
          value={status}
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
          disabled={isSubmitting}
        >
          {#each EVENT_STATUS_OPTIONS as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
        <p class="mt-2 text-sm text-gray-500">Set to "Open" when ready to accept votes.</p>
      </div>

      {#if form?.error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {form.error}
        </div>
      {/if}

      <div class="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          class="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isSubmitting}
            <span class="inline-flex items-center justify-center gap-2">
              <Spinner />
              Creating...
            </span>
          {:else}
            Create Event
          {/if}
        </button>
        <a href={urls.voteAdmin} class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors">
          Cancel
        </a>
      </div>
    </form>
  </div>
</div>
