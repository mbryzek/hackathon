<script lang="ts">
  import { urls } from '$lib/urls';
  import { eventStatusBadgeClass, eventStatusLabel, formatDate } from '$lib/utils/eventDisplay';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const events = $derived(data.events);
  const error = $derived(data.error);
</script>

<div class="animate-fade-in">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Events</h1>
      <p class="text-gray-600 mt-1">Manage voting events</p>
    </div>
    <a
      href={urls.voteAdminEventsNew}
      class="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      New Event
    </a>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {error}
    </div>
  {:else if events.length === 0}
    <div class="bg-white shadow rounded-xl p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        ></path>
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
      <p class="text-gray-600 mb-6">Create your first voting event to get started.</p>
      <a
        href={urls.voteAdminEventsNew}
        class="inline-flex items-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors"
      >
        Create Event
      </a>
    </div>
  {:else}
    <div class="bg-white shadow rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Event </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Key </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Status </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Created </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each events as event (event.id)}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <a
                    href={urls.voteAdminEvent(event.id)}
                    class="font-medium text-gray-900 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
                  >
                    {event.name}
                  </a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <code class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{event.key}</code>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full {eventStatusBadgeClass(event.status)}">
                    {eventStatusLabel(event.status)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
