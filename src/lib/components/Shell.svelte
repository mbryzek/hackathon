<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { urls } from '$lib/urls';

  interface Props {
    title: string;
    children: Snippet;
    sticky?: boolean;
  }

  let { title, children, sticky = false }: Props = $props();

  let mobileMenuOpen = $state(false);

  interface Section {
    href: string;
    name: string;
    children: Section[];
  }

  const sections: Section[] = [
    { href: urls.index, name: 'Overview', children: [] },
    { href: urls.signup, name: 'Signup', children: [] },
    { href: urls.vote, name: 'Vote', children: [] },
    { href: urls.donate, name: 'Donate', children: [] },
    { href: urls.mission, name: 'Mission', children: [] },
    {
      href: urls.y26Index,
      name: '2026',
      children: [
        { href: urls.y26Index, name: 'Event', children: [] },
        { href: urls.y26Program, name: 'Program', children: [] },
        { href: urls.y26Photos, name: 'Photos', children: [] },
        { href: urls.y26Prizes, name: 'Prizes', children: [] },
        { href: urls.y26Rubric, name: 'Rubric', children: [] },
        { href: urls.y26Sponsors, name: 'Sponsors', children: [] }
      ]
    },
    {
      href: urls.y25Index,
      name: '2025',
      children: [
        { href: urls.y25Index, name: 'Event', children: [] },
        { href: urls.y25Demos, name: 'Demos', children: [] },
        { href: urls.y25Photos, name: 'Photos', children: [] },
        { href: urls.y25Sponsors, name: 'Sponsors', children: [] },
        { href: urls.y25Prizes, name: 'Prizes', children: [] },
        { href: urls.y25Rubric, name: 'Rubric', children: [] }
      ]
    },
    {
      href: urls.y24Index,
      name: '2024',
      children: [
        { href: urls.y24Index, name: 'Event', children: [] },
        { href: urls.y24Photos, name: 'Photos', children: [] },
        { href: urls.y24Sponsors, name: 'Sponsors', children: [] }
      ]
    },
    { href: urls.press, name: 'Press', children: [] },
    { href: urls.contact, name: 'Contact', children: [] }
  ];

  function isActive(section: Section): boolean {
    return page.url.pathname === section.href;
  }

  function hasActiveChild(section: Section): boolean {
    return section.children.some((child) => page.url.pathname === child.href);
  }

  function isExternal(href: string): boolean {
    return href.startsWith('http');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && mobileMenuOpen) {
      mobileMenuOpen = false;
    }
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  const navClasses = $derived(sticky ? 'bg-gray-800 sticky top-0 z-40' : 'bg-gray-800 relative z-40');
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Overlay for mobile menu -->
{#if mobileMenuOpen}
  <button class="fixed inset-0 z-30 bg-black/30 transition-opacity duration-300 md:hidden" onclick={closeMobileMenu} aria-label="Close menu"
  ></button>
{/if}

<div class="min-h-full">
  <nav class={navClasses}>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center">
          <!-- Logo -->
          <div class="shrink-0">
            <a href={urls.index} class="rounded focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <img class="h-12 w-36 cursor-pointer" src="/assets/bt-cs-logo.png" alt="Bergen Tech Hackathon" />
            </a>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              {#each sections as section}
                {@const active = isActive(section) || hasActiveChild(section)}
                {#if section.children.length === 0}
                  <a
                    href={section.href}
                    class="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 {active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
                    aria-current={active ? 'page' : undefined}
                    target={isExternal(section.href) ? '_blank' : undefined}
                    rel={isExternal(section.href) ? 'noopener noreferrer' : undefined}
                  >
                    {section.name}
                    {#if isExternal(section.href)}
                      <svg class="ml-1 inline-block h-3 w-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    {/if}
                  </a>
                {:else}
                  <div class="group relative z-50">
                    <a
                      href={section.href}
                      class="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 {active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
                    >
                      {section.name}
                      <!-- Dropdown chevron -->
                      <svg
                        class="h-4 w-4 transition-transform duration-200 group-hover:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </a>
                    <!-- Dropdown menu with smooth transition -->
                    <div
                      class="invisible absolute left-0 top-full w-48 pt-2 opacity-0 transition-all duration-200 ease-out group-hover:visible group-hover:opacity-100"
                    >
                      <div class="overflow-hidden rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
                        {#each section.children as child, i}
                          {@const childActive = page.url.pathname === child.href}
                          <a
                            href={child.href}
                            class="block px-4 py-2.5 text-sm transition-colors duration-150 {childActive
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'} {i === 0 ? 'rounded-t-md' : ''} {i ===
                            section.children.length - 1
                              ? 'rounded-b-md'
                              : ''}"
                          >
                            {child.name}
                          </a>
                        {/each}
                      </div>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="-mr-2 flex md:hidden">
          <button
            type="button"
            class="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
          >
            <span class="absolute -inset-0.5"></span>
            <span class="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>

            <!-- Animated hamburger/close icon -->
            <div class="relative h-6 w-6">
              <span
                class="absolute left-0 top-1 h-0.5 w-6 bg-current transition-all duration-300 ease-in-out {mobileMenuOpen
                  ? 'translate-y-1.5 rotate-45'
                  : ''}"
              ></span>
              <span
                class="absolute left-0 top-3 h-0.5 w-6 bg-current transition-all duration-300 ease-in-out {mobileMenuOpen
                  ? 'opacity-0'
                  : ''}"
              ></span>
              <span
                class="absolute left-0 top-5 h-0.5 w-6 bg-current transition-all duration-300 ease-in-out {mobileMenuOpen
                  ? '-translate-y-1.5 -rotate-45'
                  : ''}"
              ></span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu with slide animation -->
    <div
      id="mobile-menu"
      class="overflow-hidden transition-all duration-300 ease-in-out md:hidden {mobileMenuOpen
        ? 'max-h-screen opacity-100'
        : 'max-h-0 opacity-0'}"
    >
      <div class="space-y-1 border-t border-gray-700 bg-gray-800 px-2 pb-3 pt-2">
        {#each sections as section}
          {@const active = isActive(section) || hasActiveChild(section)}
          <div>
            <a
              href={section.href}
              class="block rounded-md px-3 py-2 text-base font-medium transition-colors duration-150 {active
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
              target={isExternal(section.href) ? '_blank' : undefined}
              rel={isExternal(section.href) ? 'noopener noreferrer' : undefined}
              onclick={closeMobileMenu}
            >
              {section.name}
              {#if isExternal(section.href)}
                <svg class="ml-1 inline-block h-3 w-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              {/if}
            </a>
            {#if section.children.length > 0}
              <div class="mt-1 space-y-1 pl-4">
                {#each section.children as child}
                  {@const childActive = page.url.pathname === child.href}
                  <a
                    href={child.href}
                    class="block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 {childActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
                    onclick={closeMobileMenu}
                  >
                    {child.name}
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </nav>

  <header class="bg-white shadow-sm">
    <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <h1 class="text-lg/6 font-semibold text-gray-800">{title}</h1>
    </div>
  </header>

  <main>
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {@render children()}
    </div>
  </main>
</div>
