<script lang="ts">
  /**
   * The one event form — name, key and status — rendered by both the create and the edit page.
   *
   * The component owns the `<form>`, its `use:enhance` submit state and the markup; the pages own
   * where the values come from and where they go. That split is what keeps the create page's
   * key-from-name mirroring create-only: it lives in the page and reaches here as `onNameInput`.
   * An edit that silently rewrote a live event's key would break every outstanding /vote/<key> link.
   */
  import Spinner from '$lib/components/Spinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import { enhance } from '$app/forms';
  import type { EventStatus } from '$lib/api/client';
  import { EVENT_STATUS_OPTIONS } from '$lib/utils/eventDisplay';

  interface Props {
    name: string;
    key: string;
    status: EventStatus | undefined;
    error: string | null | undefined;
    submitLabel: string;
    submittingLabel: string;
    cancelHref: string;
    /** Set by a page that mirrors the key off the name as it is typed. Create only. */
    onNameInput?: (value: string) => void;
    onKeyInput?: (value: string) => void;
  }

  let { name, key, status, error, submitLabel, submittingLabel, cancelHref, onNameInput, onKeyInput }: Props = $props();

  let isSubmitting = $state(false);
</script>

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
    <label for="name" class="mb-2 block text-sm font-medium text-gray-700"> Event Name </label>
    <input
      type="text"
      id="name"
      name="name"
      value={name}
      oninput={(e) => onNameInput?.(e.currentTarget.value)}
      placeholder="e.g., Hackathon 2025"
      class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
      disabled={isSubmitting}
    />
  </div>

  <div>
    <label for="key" class="mb-2 block text-sm font-medium text-gray-700"> Event Key (URL slug) </label>
    <input
      type="text"
      id="key"
      name="key"
      value={key}
      oninput={(e) => onKeyInput?.(e.currentTarget.value)}
      placeholder="e.g., hackathon-2025"
      class="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
      disabled={isSubmitting}
    />
    <p class="mt-2 text-sm text-gray-500">
      Voting URL: /vote/{key || 'event-key'}
    </p>
  </div>

  <div>
    <label for="status" class="mb-2 block text-sm font-medium text-gray-700"> Status </label>
    <select
      id="status"
      name="status"
      value={status}
      class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
      disabled={isSubmitting}
    >
      {#each EVENT_STATUS_OPTIONS as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    <p class="mt-2 text-sm text-gray-500">Set to "Open" when ready to accept votes.</p>
  </div>

  {#if error}
    <ErrorBanner {error} />
  {/if}

  <div class="flex gap-4">
    <button
      type="submit"
      disabled={isSubmitting}
      class="flex-1 rounded-lg bg-yellow-400 px-6 py-3 font-bold text-gray-900 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {#if isSubmitting}
        <span class="inline-flex items-center justify-center gap-2">
          <Spinner />
          {submittingLabel}
        </span>
      {:else}
        {submitLabel}
      {/if}
    </button>
    <a
      href={cancelHref}
      class="rounded-lg bg-gray-200 px-6 py-3 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-300"
    >
      Cancel
    </a>
  </div>
</form>
