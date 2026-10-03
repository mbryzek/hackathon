<script lang="ts">
  import AuthCard from '$lib/components/AuthCard.svelte';
  import AuthSubmit from '$lib/components/AuthSubmit.svelte';
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

<AuthCard heading="Vote Admin Login" intro="Sign in to manage voting events" returnHome>
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
      <p class="mt-2 text-right text-sm">
        <a href={urls.passwordResetRequest} class="text-gray-600 underline transition-colors hover:text-gray-900">
          Forgot your password?
        </a>
      </p>
    </div>

    {#if error}
      <ErrorBanner {error} />
    {/if}

    <AuthSubmit label="Sign In" busyLabel="Signing in..." busy={isSubmitting} disabled={!email.trim() || !password} />
  </form>
</AuthCard>
