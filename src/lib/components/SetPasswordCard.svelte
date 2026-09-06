<script lang="ts">
  /**
   * The card behind both emailed links that end in choosing a password — an invitation
   * (`/welcome/<token>`) and a reset (`/login/password/reset/<id>`). The two pages differ in
   * their wording and in which action the form posts to; everything else about them is the same
   * form, so it is written once.
   *
   * There are no `minlength`, `pattern` or blocking-JS constraints on the fields: this product
   * has no password restrictions, and what the platform will accept is the platform's to say.
   */
  import { enhance } from '$app/forms';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import Spinner from '$lib/components/Spinner.svelte';

  interface Props {
    heading: string;
    /** A line under the heading — who the account belongs to, or what happens next. */
    intro?: string;
    submitLabel: string;
    /** The failed submission's message, or null. */
    error?: string | null;
  }

  let { heading, intro = '', submitLabel, error = null }: Props = $props();

  let isSubmitting = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md">
    <div class="rounded-xl bg-white p-8 shadow-lg">
      <div class="mb-8 text-center">
        <img class="mx-auto mb-4 h-16 w-auto" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />
        <h1 class="text-2xl font-bold text-gray-900">{heading}</h1>
        {#if intro}
          <p class="mt-2 text-gray-600">{intro}</p>
        {/if}
      </div>

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
        {#if error}
          <ErrorBanner {error} />
        {/if}

        <div>
          <label for="password" class="mb-2 block text-sm font-medium text-gray-700">New password</label>
          <input
            type="password"
            id="password"
            name="password"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            autocomplete="new-password"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label for="password_confirmation" class="mb-2 block text-sm font-medium text-gray-700">Confirm new password</label>
          <input
            type="password"
            id="password_confirmation"
            name="password_confirmation"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            autocomplete="new-password"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          class="w-full rounded-lg bg-gray-900 px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if isSubmitting}
            <span class="inline-flex items-center justify-center gap-2">
              <Spinner />
              Saving...
            </span>
          {:else}
            {submitLabel}
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>
