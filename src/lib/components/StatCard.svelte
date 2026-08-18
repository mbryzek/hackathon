<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    value: string;
    label: string;
    icon?: Snippet;
    highlight?: boolean;
  }

  let { value, label, icon, highlight = false }: Props = $props();

  const cardClasses = $derived(
    highlight ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' : 'bg-white border border-gray-200'
  );

  const valueClasses = $derived(highlight ? 'text-white' : 'text-gray-900');

  const labelClasses = $derived(highlight ? 'text-white/90' : 'text-gray-600');
</script>

<div class="rounded-xl p-6 {cardClasses} shadow-sm transition-shadow duration-300 hover:shadow-md">
  <div class="flex items-start justify-between">
    <div>
      <p class="text-3xl font-bold md:text-4xl {valueClasses}">
        {value}
      </p>
      <p class="mt-1 text-sm font-medium {labelClasses}">
        {label}
      </p>
    </div>
    {#if icon}
      <div class="rounded-lg p-2 {highlight ? 'bg-white/20' : 'bg-gray-100'}">
        {@render icon()}
      </div>
    {/if}
  </div>
</div>
