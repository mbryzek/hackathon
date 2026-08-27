<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte';
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { urls } from '$lib/urls';
  import { EVENT_STATUS_OPTIONS } from '$lib/utils/eventDisplay';
  import type { ActionData, PageData } from './$types';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const eventId = $derived(page.params.id ?? '');
  const event = $derived(data.event);
  const error = $derived(form?.error ?? data.error);

  // A rejected submit's values win over the loaded event's, so the admin gets back what they
  // typed rather than having the form silently reset under the error.
  const name = $derived(form?.name ?? event?.name ?? '');
  const key = $derived(form?.key ?? event?.key ?? '');
  const status = $derived(form?.status ?? event?.status);

  let isSubmitting = $state(false);
</script>

<div class="animate-fade-in max-w-2xl mx-auto">
  <div class="mb-8">
    <a href={urls.voteAdminEvent(eventId)} class="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
      Back to Event
    </a>
    <h1 class="text-2xl font-bold text-gray-900 mt-4">Edit Event</h1>
  </div>

  {#if event}
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
            value={name}
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
            value={key}
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors font-mono"
            disabled={isSubmitting}
          />
          <p class="mt-2 text-sm text-gray-500">
            Voting URL: /vote/{key}
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
        </div>

        {#if error}
          <ErrorBanner message={error} />
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
                Saving...
              </span>
            {:else}
              Save Changes
            {/if}
          </button>
          <a
            href={urls.voteAdminEvent(eventId)}
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-center"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  {:else}
    <ErrorBanner message={error || 'Event not found'} />
  {/if}
</div>
