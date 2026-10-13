<script lang="ts">
  import '../../../app.css';
  import type { Snippet } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import AccountMenu from '#lib/components/AccountMenu.svelte';
  import { urls } from '#lib/urls.ts';
  import type { LayoutData } from './$types';

  interface Props {
    data: LayoutData;
    children: Snippet;
  }

  let { data, children }: Props = $props();

  // Check if we're on the login page
  const isLoginPage = $derived(page.url.pathname === urls.voteAdminLogin);

  let mobileMenuOpen = $state(false);
  let headerAccountOpen = $state(false);
  let mobileAccountOpen = $state(false);

  afterNavigate(() => {
    mobileMenuOpen = false;
    headerAccountOpen = false;
    mobileAccountOpen = false;
  });

  $effect(() => {
    if (!mobileMenuOpen) return;
    function onKeydown(event: KeyboardEvent): void {
      // Escape closes the account menu first when it is open inside the slide-out.
      if (event.key === 'Escape' && !mobileAccountOpen) mobileMenuOpen = false;
    }
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  });
</script>

<svelte:head>
  <title>Vote Admin - Bergen Tech Hackathon</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
  {#if !isLoginPage && data.admin}
    <!-- Admin header -->
    <nav class="bg-gray-900">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center gap-8">
            <a href={urls.index} class="flex items-center">
              <img class="h-10 w-30" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />
            </a>
            <span class="font-semibold text-white">Vote Admin</span>
          </div>
          <div class="hidden items-center gap-4 md:flex">
            <a href={urls.voteAdmin} class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white">
              Events
            </a>
            <div class="max-w-56">
              <AccountMenu
                name={data.admin.name}
                email={data.admin.email}
                profileHref={urls.voteAdminProfile}
                logoutAction={urls.voteAdminLogout}
                bind:open={headerAccountOpen}
              />
            </div>
          </div>
          <button
            type="button"
            class="rounded-md p-2 text-gray-300 hover:bg-gray-800 hover:text-white md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onclick={() => (mobileMenuOpen = true)}
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </nav>

    {#if mobileMenuOpen}
      <!-- Slide-out menu on a phone: the nav, then the account menu at the bottom. -->
      <div class="fixed inset-0 z-40 md:hidden">
        <button type="button" class="absolute inset-0 bg-black/40" aria-label="Close menu" onclick={() => (mobileMenuOpen = false)}
        ></button>
        <div class="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-gray-900 p-4" role="dialog" aria-label="Menu">
          <div class="mb-4 flex items-center justify-between">
            <span class="font-semibold text-white">Vote Admin</span>
            <button
              type="button"
              class="rounded-md p-2 text-gray-300 hover:bg-gray-800 hover:text-white"
              aria-label="Close menu"
              onclick={() => (mobileMenuOpen = false)}
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <a
            href={urls.voteAdmin}
            class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            Events
          </a>
          <div class="mt-auto border-t border-gray-700 pt-3">
            <AccountMenu
              name={data.admin.name}
              email={data.admin.email}
              profileHref={urls.voteAdminProfile}
              logoutAction={urls.voteAdminLogout}
              placement="up"
              bind:open={mobileAccountOpen}
              onchoose={() => (mobileMenuOpen = false)}
            />
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <main class={isLoginPage ? '' : 'py-8'}>
    <div class={isLoginPage ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}>
      {@render children()}
    </div>
  </main>
</div>
