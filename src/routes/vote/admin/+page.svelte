<script lang="ts">
  import { urls } from '$lib/urls';
  import { eventStatusBadgeClass, eventStatusLabel, formatDate } from '$lib/utils/eventDisplay';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const events = $derived(data.events);
  const error = $derived(data.error);
</script>

<div class="animate-fade-in">
  <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Events</h1>
      <p class="mt-1 text-gray-600">Manage voting events</p>
    </div>
    <a
      href={urls.voteAdminEventsNew}
      class="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-6 py-3 font-bold text-gray-900 transition-colors hover:bg-yellow-500"
    >
      <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      New Event
    </a>
  </div>

  {#if error}
    <ErrorBanner {error} />
  {:else if events.length === 0}
    <div class="rounded-xl bg-white p-12 text-center shadow">
      <svg class="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        ></path>
      </svg>
      <h3 class="mb-2 text-lg font-semibold text-gray-900">No events yet</h3>
      <p class="mb-6 text-gray-600">Create your first voting event to get started.</p>
      <a
        href={urls.voteAdminEventsNew}
        class="inline-flex items-center rounded-lg bg-yellow-400 px-4 py-2 font-bold text-gray-900 transition-colors hover:bg-yellow-500"
      >
        Create Event
      </a>
    </div>
  {:else}
    <div class="overflow-hidden rounded-xl bg-white shadow">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Event </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Key </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Status </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Created </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            {#each events as event (event.id)}
              <tr class="transition-colors hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4">
                  <a
                    href={urls.voteAdminEvent(event.id)}
                    class="rounded font-medium text-gray-900 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    {event.name}
                  </a>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <code class="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">{event.key}</code>
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <span class="rounded-full px-2 py-1 text-xs font-medium {eventStatusBadgeClass(event.status)}">
                    {eventStatusLabel(event.status)}
                  </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(event.created_at)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
