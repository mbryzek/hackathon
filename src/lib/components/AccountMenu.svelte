<!--
  The account menu: the one place a signed-in person reaches their profile and logs out
  (claude rules/frontend.account.menu.mdc; playbook-app's src/routes/+layout.svelte is the
  reference). The row is an initials avatar, the person's name and a chevron; the menu holds
  exactly Your Profile and Log out.

  It closes on a click outside it, on Escape and on choosing an item. Closing on navigation is
  the layout's job, through `bind:open`, because only the layout sees navigations.

  Log out stays the POST form the logout route requires: a GET there never signs anybody out.
  Choosing it closes nothing by hand — unmounting the form during its own click would cancel the
  submission — and the redirect the POST answers with is the navigation that closes the menu.
-->
<script lang="ts">
  interface Props {
    /** Shown beside the avatar; the email stands in when the person has no name. */
    name: string | null;
    email: string | null;
    profileHref: string;
    logoutAction: string;
    /** `down` from a header, `up` from the bottom of a slide-out menu. */
    placement?: 'up' | 'down';
    open?: boolean;
    /** Called when Your Profile is chosen, so a slide-out menu can close too. */
    onchoose?: () => void;
  }

  let { name, email, profileHref, logoutAction, placement = 'down', open = $bindable(false), onchoose }: Props = $props();

  let wrap = $state<HTMLElement | null>(null);
  let chip = $state<HTMLButtonElement | null>(null);

  const label = $derived(name?.trim() || email?.trim() || 'Account');

  /** The first letters of the first and last word, or the first two letters of a single word. */
  function initials(value: string): string {
    const parts = value.split(/\s+/).filter(Boolean);
    const first = parts[0];
    if (!first) return '?';
    const last = parts[parts.length - 1];
    if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase();
    return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
  }

  function choose(): void {
    open = false;
    onchoose?.();
  }

  $effect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent): void {
      if (wrap && !wrap.contains(event.target as Node)) open = false;
    }
    function onKeydown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      open = false;
      chip?.focus();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeydown);
    };
  });
</script>

<div class="relative min-w-0" bind:this={wrap}>
  {#if open}
    <div
      class="absolute right-0 z-50 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg {placement === 'up'
        ? 'bottom-full left-0 mb-2'
        : 'top-full mt-2'}"
      role="menu"
      aria-label="Account"
    >
      <a
        href={profileHref}
        role="menuitem"
        class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onclick={choose}
      >
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          ></path>
        </svg>
        Your Profile
      </a>
      <form method="POST" action={logoutAction}>
        <button
          type="submit"
          role="menuitem"
          class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        >
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          Log out
        </button>
      </form>
    </div>
  {/if}
  <button
    type="button"
    bind:this={chip}
    class="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
    onclick={() => (open = !open)}
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label="Account menu"
  >
    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-white">
      {initials(label)}
    </span>
    <span class="truncate">{label}</span>
    <svg
      class="ml-auto h-4 w-4 shrink-0 transition-transform {open ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={placement === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
      ></path>
    </svg>
  </button>
</div>
