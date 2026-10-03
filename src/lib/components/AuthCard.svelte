<script lang="ts">
  /**
   * The full-viewport card every signed-out page sits in: sign-in, the forgot-password request,
   * and each page an emailed link lands on (invitation, reset, email verification). They are one
   * screen to a visitor, so the shell, the logo and the way home are written once here.
   *
   * With a `heading` the card opens with the logo over the page's `<h1>` and an optional intro
   * line. Without one the page is an outcome notice whose `<h1>` lives inside its `AuthNotice`,
   * so the card shows the logo alone and centres its content.
   */
  import type { Snippet } from 'svelte';
  import { urls } from '$lib/urls';

  interface Props {
    heading?: string;
    /** A line under the heading. Ignored without a heading. */
    intro?: string;
    /** Adds a "Return to Hackathon Site" link under the card. */
    returnHome?: boolean;
    children: Snippet;
  }

  let { heading = '', intro = '', returnHome = false, children }: Props = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md">
    <div class={['rounded-xl bg-white p-8 shadow-lg', !heading && 'text-center']}>
      {#if heading}
        <div class="mb-8 text-center">
          <img class="mx-auto mb-4 h-16 w-auto" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />
          <h1 class="text-2xl font-bold text-gray-900">{heading}</h1>
          {#if intro}
            <p class="mt-2 text-gray-600">{intro}</p>
          {/if}
        </div>
      {:else}
        <img class="mx-auto mb-6 h-16 w-auto" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />
      {/if}

      {@render children()}
    </div>

    {#if returnHome}
      <p class="mt-6 text-center text-sm text-gray-500">
        <a href={urls.index} class="transition-colors hover:text-gray-700">Return to Hackathon Site</a>
      </p>
    {/if}
  </div>
</div>
