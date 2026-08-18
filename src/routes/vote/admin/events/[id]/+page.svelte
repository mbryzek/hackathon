<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { urls } from '$lib/urls';
  import { eventStatusBadgeClass, eventStatusLabel, formatDateTime } from '$lib/utils/eventDisplay';
  import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
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
      <ErrorBanner {error} class="mb-6" />
    {/if}

    <!-- Event Details -->
    <div class="mb-6 rounded-xl bg-white p-6 shadow">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Event Details</h2>
        <a
          href="{urls.voteAdminEvent(eventId)}/edit"
          class="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span class="rounded-full px-3 py-1 text-sm font-medium {eventStatusBadgeClass(event.status)}">
              {eventStatusLabel(event.status)}
            </span>
          </dd>
        </div>
        <div class="py-4">
          <dt class="text-sm font-medium text-gray-500">Event Key</dt>
          <dd class="mt-1 font-mono text-gray-900">{event.key}</dd>
        </div>
        <div class="py-4">
          <dt class="text-sm font-medium text-gray-500">Voting URL</dt>
          <dd class="mt-1">
            <a href={votingUrl} class="break-all text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
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
    <div class="rounded-xl bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-semibold text-red-600">Danger Zone</h2>
      <button
        type="button"
        onclick={() => (showDeleteConfirm = true)}
        class="rounded-lg bg-red-100 px-4 py-2 font-semibold text-red-700 transition-colors hover:bg-red-200"
      >
        Delete Event
      </button>
    </div>
  {:else}
    <ErrorBanner error={error || 'Event not found'} />
  {/if}
</div>

<!-- Delete confirmation modal -->
<Modal open={showDeleteConfirm} onclose={() => (showDeleteConfirm = false)} size="md">
  <div class="rounded-xl bg-white p-6 shadow-xl">
    <h2 class="mb-4 text-xl font-bold text-gray-900">Delete Event</h2>
    <p class="mb-6 text-gray-600">
      Are you sure you want to delete this event? This action cannot be undone and will delete all associated projects, codes, and votes.
    </p>
    <div class="flex justify-end gap-3">
      <button
        type="button"
        onclick={() => (showDeleteConfirm = false)}
        class="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
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
          class="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
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
