<script lang="ts">
  import EventForm from '$lib/components/EventForm.svelte';
  import { page } from '$app/state';
  import { urls } from '$lib/urls';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const eventId = $derived(page.params.id ?? '');
  const event = $derived(data.event);
  const error = $derived(form?.error ?? data.error);

  // A rejected submit's values win over the loaded event's, so the admin gets back what they
  // typed rather than having the form silently reset under the error.
  const name = $derived(form?.name ?? event?.name ?? '');
  const key = $derived(form?.key ?? event?.key ?? '');
  const status = $derived(form?.status ?? event?.status);
</script>

<div class="animate-fade-in mx-auto max-w-2xl">
  <div class="mb-8">
    <a href={urls.voteAdminEvent(eventId)} class="inline-flex items-center gap-1 text-gray-600 transition-colors hover:text-gray-900">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
      Back to Event
    </a>
    <h1 class="mt-4 text-2xl font-bold text-gray-900">Edit Event</h1>
  </div>

  {#if event}
    <div class="rounded-xl bg-white p-6 shadow">
      <EventForm
        {name}
        {key}
        {status}
        {error}
        submitLabel="Save Changes"
        submittingLabel="Saving..."
        cancelHref={urls.voteAdminEvent(eventId)}
      />
    </div>
  {:else}
    <ErrorBanner error={error || 'Event not found'} />
  {/if}
</div>
