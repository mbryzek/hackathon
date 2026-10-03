<script lang="ts">
  /**
   * Asks for an email address and reports the same thing for every one of them — see
   * `+page.server.ts` for why the acknowledgement cannot vary with whether the address has an
   * account. The wording is deliberately conditional ("if ... has an account") so that a reader
   * who mistyped their address is not left waiting for a mail that is never coming.
   */
  import { enhance } from '$app/forms';
  import AuthCard from '$lib/components/AuthCard.svelte';
  import AuthNotice from '$lib/components/AuthNotice.svelte';
  import AuthSubmit from '$lib/components/AuthSubmit.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import { urls } from '$lib/urls';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let isSubmitting = $state(false);
</script>

<svelte:head>
  <title>Forgot your password? - Bergen Tech Hackathon</title>
</svelte:head>

<AuthCard
  heading="Forgot your password?"
  intro={form?.sent ? '' : 'Enter your email address and we will send you a link to choose a new one.'}
>
  {#if form?.sent}
    <AuthNotice tone="success">
      If {form.email} has a hackathon account, a link to reset the password is on its way. The link works once and expires, so use the most
      recent mail if you ask more than once.
    </AuthNotice>
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

      <AuthSubmit label="Email me a reset link" busyLabel="Sending..." busy={isSubmitting} />
    </form>
  {/if}

  <p class="mt-6 text-center text-sm text-gray-600">
    <a href={urls.voteAdminLogin} class="font-medium text-gray-900 underline transition-colors hover:text-gray-700">Back to sign in</a>
  </p>
</AuthCard>
