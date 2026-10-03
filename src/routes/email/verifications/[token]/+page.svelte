<script lang="ts">
  /**
   * Reports what happened to the verification link. The token was already spent by `load`, so
   * this page only names the outcome and points at the one next step that makes sense for it.
   */
  import AuthCard from '$lib/components/AuthCard.svelte';
  import AuthNotice from '$lib/components/AuthNotice.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const heading = $derived(
    data.outcome === 'verified'
      ? 'Email verified'
      : data.outcome === 'invalid'
        ? 'This link is no longer valid'
        : 'We could not verify your email'
  );
</script>

<svelte:head>
  <title>{heading} - Bergen Tech Hackathon</title>
</svelte:head>

<AuthCard returnHome>
  {#if data.outcome === 'verified'}
    <AuthNotice tone="success" {heading} testid="email-verification-verified">
      <p>Your email address is confirmed. There is nothing else to do.</p>
    </AuthNotice>
  {:else if data.outcome === 'invalid'}
    <AuthNotice tone="warning" {heading} testid="email-verification-invalid">
      <p>
        We do not recognise this link, so it has most likely expired. Look for a more recent "Verify your email" message and use the link in
        that one.
      </p>
    </AuthNotice>
  {:else}
    <AuthNotice tone="info" {heading} testid="email-verification-unavailable">
      <p class="mb-4">Something went wrong on our end. Your link is still good — try it again in a few minutes.</p>
      <a
        href={data.retryUrl}
        data-sveltekit-reload
        class="inline-block rounded-lg bg-gray-900 px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800"
      >
        Try again
      </a>
    </AuthNotice>
  {/if}
</AuthCard>
