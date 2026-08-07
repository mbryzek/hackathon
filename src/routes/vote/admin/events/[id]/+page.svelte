<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { urls } from '$lib/urls';
  import { eventStatusBadgeClass, eventStatusLabel, formatDateTime } from '$lib/utils/eventDisplay';
  import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const eventId = $derived(page.params.id ?? '');
  const event = $derived(data.event);
  const error = $derived(form?.error ?? data.error);

  let isDeleting = $state(false);
  let showDeleteConfirm = $state(false);

  const votingUrl = $derived(event ? `${page.url.origin}/vote/${event.key}` : '');
</script>

<div class="animate-fade-in">
  <EventAdminTabs {eventId} eventName={event?.name} activeTab="event" />

  {#if event}
    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        {error}
      </div>
    {/if}

    <!-- Event Details -->
    <div class="bg-white shadow rounded-xl p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Event Details</h2>
        <a
          href="{urls.voteAdminEvent(eventId)}/edit"
          class="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            ></path>
          </svg>
          Edit
        </a>
      </div>
      <dl class="divide-y divide-gray-200">
        <div class="py-4 first:pt-0">
          <dt class="text-sm font-medium text-gray-500">Status</dt>
          <dd class="mt-1">
            <span class="px-3 py-1 text-sm font-medium rounded-full {eventStatusBadgeClass(event.status)}">
              {eventStatusLabel(event.status)}
            </span>
          </dd>
        </div>
        <div class="py-4">
          <dt class="text-sm font-medium text-gray-500">Event Key</dt>
          <dd class="mt-1 text-gray-900 font-mono">{event.key}</dd>
        </div>
        <div class="py-4">
          <dt class="text-sm font-medium text-gray-500">Voting URL</dt>
          <dd class="mt-1">
            <a href={votingUrl} class="text-blue-600 hover:text-blue-800 underline break-all" target="_blank" rel="noopener noreferrer">
              {votingUrl}
            </a>
          </dd>
        </div>
        <div class="py-4">
          <dt class="text-sm font-medium text-gray-500">Created</dt>
          <dd class="mt-1 text-gray-900">{formatDateTime(event.created_at)}</dd>
        </div>
        <div class="py-4 last:pb-0">
          <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
          <dd class="mt-1 text-gray-900">{formatDateTime(event.updated_at)}</dd>
        </div>
      </dl>
    </div>

    <!-- Danger Zone -->
    <div class="bg-white shadow rounded-xl p-6">
      <h2 class="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
      <button
        type="button"
        onclick={() => (showDeleteConfirm = true)}
        class="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        Delete Event
      </button>
    </div>
  {:else}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {error || 'Event not found'}
    </div>
  {/if}
</div>

<!-- Delete confirmation modal -->
<Modal open={showDeleteConfirm} onclose={() => (showDeleteConfirm = false)} size="md">
  <div class="bg-white rounded-xl shadow-xl p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-4">Delete Event</h2>
    <p class="text-gray-600 mb-6">
      Are you sure you want to delete this event? This action cannot be undone and will delete all associated projects, codes, and votes.
    </p>
    <div class="flex gap-3 justify-end">
      <button
        type="button"
        onclick={() => (showDeleteConfirm = false)}
        class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Cancel
      </button>
      <form
        method="POST"
        action="?/delete"
        use:enhance={() => {
          isDeleting = true;
          return async ({ update }) => {
            await update();
            isDeleting = false;
            showDeleteConfirm = false;
          };
        }}
      >
        <button
          type="submit"
          disabled={isDeleting}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {#if isDeleting}
            Deleting...
          {:else}
            Delete Event
          {/if}
        </button>
      </form>
    </div>
  </div>
</Modal>
