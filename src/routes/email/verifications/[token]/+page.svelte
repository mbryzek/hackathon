<script lang="ts">
  /**
   * Reports what happened to the verification link. The token was already spent by `load`, so
   * this page only names the outcome and points at the one next step that makes sense for it.
   */
  import { urls } from '$lib/urls';
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

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md">
    <div class="rounded-xl bg-white p-8 text-center shadow-lg">
      <img class="mx-auto mb-6 h-16 w-auto" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />

      {#if data.outcome === 'verified'}
        <div class="rounded-lg border border-green-200 bg-green-50 p-6" data-testid="email-verification-verified">
          <h1 class="mb-2 text-xl font-bold text-green-900">{heading}</h1>
          <p class="text-green-800">Your email address is confirmed. There is nothing else to do.</p>
        </div>
      {:else if data.outcome === 'invalid'}
        <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-6" data-testid="email-verification-invalid">
          <h1 class="mb-2 text-xl font-bold text-yellow-900">{heading}</h1>
          <p class="text-yellow-800">
            We do not recognise this link, so it has most likely expired. Look for a more recent "Verify your email" message and use the
            link in that one.
          </p>
        </div>
      {:else}
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-6" data-testid="email-verification-unavailable">
          <h1 class="mb-2 text-xl font-bold text-blue-900">{heading}</h1>
          <p class="mb-4 text-blue-800">Something went wrong on our end. Your link is still good — try it again in a few minutes.</p>
          <a
            href={data.retryUrl}
            data-sveltekit-reload
            class="inline-block rounded-lg bg-gray-900 px-6 py-3 font-bold text-white transition-colors hover:bg-gray-800"
          >
            Try again
          </a>
        </div>
      {/if}

      <p class="mt-6 text-sm text-gray-500">
        <a href={urls.index} class="transition-colors hover:text-gray-700">Return to Hackathon Site</a>
      </p>
    </div>
  </div>
</div>
