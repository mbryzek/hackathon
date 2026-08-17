<script lang="ts">
  import EventForm from '$lib/components/EventForm.svelte';
  import { urls } from '$lib/urls';
  import { EventStatus } from '$lib/api/client';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  // Seeded from the last rejected submit so a form that comes back with an error still holds
  // what was typed, with or without JavaScript. The action owns validation; these only drive
  // the key/name mirroring below.
  // svelte-ignore state_referenced_locally
  let name = $state(form?.name ?? '');
  // svelte-ignore state_referenced_locally
  let key = $state(form?.key ?? '');

  const status = $derived(form?.status ?? EventStatus.Draft);

  // Auto-generate key from name. Create only — an edit that rewrote a live event's key would
  // break every outstanding /vote/<key> link, so this stays on the page and not in EventForm.
  function handleNameInput(value: string) {
    const previous = name;
    name = value;
    if (!key || key === slugify(previous)) {
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
    <EventForm
      {name}
      {key}
      {status}
      error={form?.error}
      submitLabel="Create Event"
      submittingLabel="Creating..."
      cancelHref={urls.voteAdmin}
      onNameInput={handleNameInput}
      onKeyInput={(value) => (key = value)}
    />
  </div>
</div>
