<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    onclose: () => void;
    children: Snippet;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  }

  let { open, onclose, children, size = 'lg' }: Props = $props();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[90vw] max-h-[90vh]'
  };

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      onclose();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Modal content. `relative` is load-bearing: it makes this the containing block for the
         absolutely-positioned close button below. Without it the nearest positioned ancestor is
         the `fixed inset-0` backdrop, so the button lands in the corner of the VIEWPORT instead
         of the corner of this card — and because `animate-scale-in` applies a transform (which
         does establish a containing block) for only 0.2s with no fill-mode, the button started
         in the right place and then jumped away as the animation ended. -->
    <div class="{sizeClasses[size]} animate-scale-in relative mx-4 w-full">
      <!-- Close button -->
      <button
        type="button"
        class="absolute right-4 top-4 z-10 rounded-full bg-black/30 p-2 text-white/80 transition-all duration-200 hover:bg-black/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
        onclick={onclose}
        aria-label="Close modal"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {@render children()}
    </div>
  </div>
{/if}

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }

  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }
</style>
