<script lang="ts">
  /**
   * The invitation: name the account being activated, then take a first password. Every outcome
   * of the submission is a redirect (see `$lib/server/setPassword`), so this page renders the
   * invitation and the form and nothing else.
   */
  import AuthCard from '$lib/components/AuthCard.svelte';
  import AuthNotice from '$lib/components/AuthNotice.svelte';
  import SetPasswordCard from '$lib/components/SetPasswordCard.svelte';
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
  <AuthCard returnHome>
    {#if data.expired}
      <AuthNotice tone="warning" {heading} testid="welcome-expired">
        <p>Invitations expire, and each one can only be used once. Ask whoever invited you to send a new one.</p>
      </AuthNotice>
    {:else}
      <AuthNotice tone="info" {heading} testid="welcome-unavailable">
        <p>Something went wrong on our end. Your invitation is still good — try the link again in a few minutes.</p>
      </AuthNotice>
    {/if}
  </AuthCard>
{/if}
