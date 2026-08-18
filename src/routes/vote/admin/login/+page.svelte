<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte';
  import { enhance } from '$app/forms';
  import { urls } from '$lib/urls';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let email = $state('');
  let password = $state('');

  // Sync email from form data when it changes
  $effect(() => {
    if (form?.email) {
      email = form.email;
    }
  });
  let isSubmitting = $state(false);

  // Get error message from form errors
  let error = $derived(form?.errors?.[0]?.message || null);
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md">
    <div class="rounded-xl bg-white p-8 shadow-lg">
      <div class="mb-8 text-center">
        <img class="mx-auto mb-4 h-16 w-auto" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />
        <h1 class="text-2xl font-bold text-gray-900">Vote Admin Login</h1>
        <p class="mt-2 text-gray-600">Sign in to manage voting events</p>
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
        <div>
          <label for="email" class="mb-2 block text-sm font-medium text-gray-700"> Email </label>
          <input
            type="email"
            id="email"
            name="email"
            bind:value={email}
            placeholder="admin@example.com"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            autocomplete="email"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label for="password" class="mb-2 block text-sm font-medium text-gray-700"> Password </label>
          <input
            type="password"
            id="password"
            name="password"
            bind:value={password}
            placeholder="Enter your password"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            autocomplete="current-password"
            disabled={isSubmitting}
          />
        </div>

        {#if error}
          <ErrorBanner {error} />
        {/if}

        <button
          type="submit"
          disabled={isSubmitting || !email.trim() || !password}
          class="w-full rounded-lg bg-gray-900 px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if isSubmitting}
            <span class="inline-flex items-center justify-center gap-2">
              <Spinner />
              Signing in...
            </span>
          {:else}
            Sign In
          {/if}
        </button>
      </form>
    </div>

    <p class="mt-6 text-center text-sm text-gray-500">
      <a href={urls.index} class="transition-colors hover:text-gray-700"> Return to Hackathon Site </a>
    </p>
  </div>
</div>
