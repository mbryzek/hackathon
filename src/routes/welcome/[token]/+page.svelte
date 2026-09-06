<script lang="ts">
  /**
   * The invitation: name the account being activated, then take a first password. Every outcome
   * of the submission is a redirect (see `$lib/server/setPassword`), so this page renders the
   * invitation and the form and nothing else.
   */
  import SetPasswordCard from '$lib/components/SetPasswordCard.svelte';
  import { urls } from '$lib/urls';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const heading = $derived(
    data.invitation
      ? 'Welcome to the Bergen Tech Hackathon'
      : data.expired
        ? 'This invitation is no longer valid'
        : 'We could not open your invitation'
  );

  const intro = $derived(
    data.invitation?.name
      ? `Choose a password to finish setting up your account, ${data.invitation.name}.`
      : data.invitation?.email
        ? `Choose a password to finish setting up ${data.invitation.email}.`
        : 'Choose a password to finish setting up your account.'
  );
</script>

<svelte:head>
  <title>{heading} - Bergen Tech Hackathon</title>
</svelte:head>

{#if data.invitation}
  <SetPasswordCard {heading} {intro} submitLabel="Set my password" error={form?.error ?? null} />
{:else}
  <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <div class="rounded-xl bg-white p-8 text-center shadow-lg">
        <img class="mx-auto mb-6 h-16 w-auto" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />

        {#if data.expired}
          <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-6" data-testid="welcome-expired">
            <h1 class="mb-2 text-xl font-bold text-yellow-900">{heading}</h1>
            <p class="text-yellow-800">
              Invitations expire, and each one can only be used once. Ask whoever invited you to send a new one.
            </p>
          </div>
        {:else}
          <div class="rounded-lg border border-blue-200 bg-blue-50 p-6" data-testid="welcome-unavailable">
            <h1 class="mb-2 text-xl font-bold text-blue-900">{heading}</h1>
            <p class="text-blue-800">
              Something went wrong on our end. Your invitation is still good — try the link again in a few minutes.
            </p>
          </div>
        {/if}

        <p class="mt-6 text-sm text-gray-500">
          <a href={urls.index} class="transition-colors hover:text-gray-700">Return to Hackathon Site</a>
        </p>
      </div>
    </div>
  </div>
{/if}
