<script lang="ts">
  /**
   * Asks for an email address and reports the same thing for every one of them — see
   * `+page.server.ts` for why the acknowledgement cannot vary with whether the address has an
   * account. The wording is deliberately conditional ("if ... has an account") so that a reader
   * who mistyped their address is not left waiting for a mail that is never coming.
   */
  import { enhance } from '$app/forms';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import { urls } from '$lib/urls';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let isSubmitting = $state(false);
</script>

<svelte:head>
  <title>Forgot your password? - Bergen Tech Hackathon</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md">
    <div class="rounded-xl bg-white p-8 shadow-lg">
      <div class="mb-8 text-center">
        <img class="mx-auto mb-4 h-16 w-auto" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />
        <h1 class="text-2xl font-bold text-gray-900">Forgot your password?</h1>
        {#if !form?.sent}
          <p class="mt-2 text-gray-600">Enter your email address and we will send you a link to choose a new one.</p>
        {/if}
      </div>

      {#if form?.sent}
        <div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800" role="status">
          If {form.email} has a hackathon account, a link to reset the password is on its way. The link works once and expires, so use the most
          recent mail if you ask more than once.
        </div>

        <p class="mt-6 text-center text-sm text-gray-600">
          <a href={urls.voteAdminLogin} class="font-medium text-gray-900 underline transition-colors hover:text-gray-700">
            Back to sign in
          </a>
        </p>
      {:else}
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
          {#if form?.error}
            <ErrorBanner error={form.error} />
          {/if}

          <div>
            <label for="email" class="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form?.email ?? ''}
              placeholder="admin@example.com"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
              autocomplete="email"
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
                Sending...
              </span>
            {:else}
              Email me a reset link
            {/if}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-gray-600">
          <a href={urls.voteAdminLogin} class="transition-colors hover:text-gray-900"> Back to sign in </a>
        </p>
      {/if}
    </div>
  </div>
</div>
