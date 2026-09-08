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
    highlight ? 'bg-[linear-gradient(to_bottom_right,#facc15,#eab308)] text-white' : 'bg-white border border-gray-200'
  );

  const valueClasses = $derived(highlight ? 'text-white' : 'text-gray-900');

  const labelClasses = $derived(highlight ? 'text-[rgb(255_255_255_/_0.9)]' : 'text-gray-600');
</script>

<div class="rounded-xl p-6 {cardClasses} shadow-xs transition-shadow duration-300 hover:shadow-md">
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
      <div class="rounded-lg p-2 {highlight ? 'bg-[rgb(255_255_255_/_0.2)]' : 'bg-gray-100'}">
        {@render icon()}
      </div>
    {/if}
  </div>
</div>
