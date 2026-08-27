<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { urls } from '$lib/urls';
  import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import type { ActionData, PageData } from './$types';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const eventId = $derived(page.params.id ?? '');
  const event = $derived(data.event);
  const error = $derived(form?.error ?? data.error);

  let isSubmitting = $state(false);

  const csvExample = `team_name,description
Awesome App,An app that does awesome things
Budget Tracker,Helps you track expenses
Code Helper,AI-powered coding assistant`;
</script>

<div class="animate-fade-in">
  <EventAdminTabs {eventId} eventName={event?.name} activeTab="projects" />

  {#if error}
    <ErrorBanner message={error} class="mb-6" />
  {/if}

  <div class="bg-white shadow rounded-xl p-6">
    <div class="mb-6">
      <a href={urls.voteAdminEventProjects(eventId)} class="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Back to Projects
      </a>
    </div>

    <h2 class="text-xl font-bold text-gray-900 mb-2">Bulk Add Projects</h2>
    <p class="text-gray-600 mb-6">Paste CSV data below to add multiple projects at once. The first row should contain headers.</p>

    <div class="mb-6">
      <h3 class="text-sm font-medium text-gray-700 mb-2">Example format:</h3>
      <pre class="bg-gray-100 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto">{csvExample}</pre>
    </div>

    <form
      method="POST"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          await update({ reset: false });
          isSubmitting = false;
        };
      }}
      class="space-y-4"
    >
      <div>
        <label for="csv-data" class="block text-sm font-medium text-gray-700 mb-2"> CSV Data </label>
        <textarea
          id="csv-data"
          name="data"
          value={form?.data ?? ''}
          placeholder="Paste your CSV data here..."
          rows="10"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 font-mono text-sm"
          disabled={isSubmitting}></textarea>
      </div>

      <div class="flex items-center">
        <input
          type="checkbox"
          id="delete-all-projects"
          name="delete_all_projects"
          checked={form?.deleteAllProjects ?? false}
          class="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
          disabled={isSubmitting}
        />
        <label for="delete-all-projects" class="ml-2 block text-sm text-gray-700"> Delete all existing projects before importing </label>
      </div>

      <div class="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {#if isSubmitting}
            <span class="inline-flex items-center">
              <Spinner class="-ml-1 mr-2" />
              Adding Projects...
            </span>
          {:else}
            Add Projects
          {/if}
        </button>
        <a href={urls.voteAdminEventProjects(eventId)} class="text-gray-600 hover:text-gray-900 py-3 px-6 transition-colors"> Cancel </a>
      </div>
    </form>
  </div>
</div>
