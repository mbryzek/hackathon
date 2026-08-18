<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { urls } from '$lib/urls';
  import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import type { ActionData, PageData } from './$types';

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
    <ErrorBanner {error} class="mb-6" />
  {/if}

  <div class="rounded-xl bg-white p-6 shadow">
    <div class="mb-6">
      <a href={urls.voteAdminEventProjects(eventId)} class="inline-flex items-center text-gray-600 transition-colors hover:text-gray-900">
        <svg class="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Back to Projects
      </a>
    </div>

    <h2 class="mb-2 text-xl font-bold text-gray-900">Bulk Add Projects</h2>
    <p class="mb-6 text-gray-600">Paste CSV data below to add multiple projects at once. The first row should contain headers.</p>

    <div class="mb-6">
      <h3 class="mb-2 text-sm font-medium text-gray-700">Example format:</h3>
      <pre class="overflow-x-auto rounded-lg bg-gray-100 p-4 text-sm text-gray-800">{csvExample}</pre>
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
        <label for="csv-data" class="mb-2 block text-sm font-medium text-gray-700"> CSV Data </label>
        <textarea
          id="csv-data"
          name="data"
          value={form?.data ?? ''}
          placeholder="Paste your CSV data here..."
          rows="10"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
          disabled={isSubmitting}></textarea>
      </div>

      <div class="flex items-center">
        <input
          type="checkbox"
          id="delete-all-projects"
          name="delete_all_projects"
          checked={form?.deleteAllProjects ?? false}
          class="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
          disabled={isSubmitting}
        />
        <label for="delete-all-projects" class="ml-2 block text-sm text-gray-700"> Delete all existing projects before importing </label>
      </div>

      <div class="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          class="rounded-lg bg-yellow-400 px-6 py-3 font-bold text-gray-900 transition-colors hover:bg-yellow-500 disabled:opacity-50"
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
        <a href={urls.voteAdminEventProjects(eventId)} class="px-6 py-3 text-gray-600 transition-colors hover:text-gray-900"> Cancel </a>
      </div>
    </form>
  </div>
</div>
