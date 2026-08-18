<script lang="ts">
  import '../../../app.css';
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { urls } from '$lib/urls';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  // Check if we're on the login page
  const isLoginPage = $derived(page.url.pathname === urls.voteAdminLogin);
</script>

<svelte:head>
  <title>Vote Admin - Bergen Tech Hackathon</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
  {#if !isLoginPage}
    <!-- Admin header -->
    <nav class="bg-gray-900">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-8">
            <a href={urls.index} class="flex items-center">
              <img class="w-30 h-10" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />
            </a>
            <span class="font-semibold text-white">Vote Admin</span>
          </div>
          <div class="flex items-center gap-4">
            <a href={urls.voteAdmin} class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white">
              Events
            </a>
            <form method="POST" action={urls.voteAdminLogout}>
              <button type="submit" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white">
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  {/if}

  <main class={isLoginPage ? '' : 'py-8'}>
    <div class={isLoginPage ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
      {@render children()}
    </div>
  </main>
</div>
