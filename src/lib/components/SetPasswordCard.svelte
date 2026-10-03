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
  import AuthCard from '$lib/components/AuthCard.svelte';
  import AuthSubmit from '$lib/components/AuthSubmit.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';

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

<AuthCard {heading} {intro}>
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

    <AuthSubmit label={submitLabel} busyLabel="Saving..." busy={isSubmitting} />
  </form>
</AuthCard>
