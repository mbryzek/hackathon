<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    children: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<div class="mt-4 rounded-lg border-l-4 border-yellow-500 bg-slate-700 p-6 shadow-lg">
  <div class="mb-1 text-sm font-bold uppercase tracking-wide text-yellow-500">
    {title}
  </div>
  <div class="text-2xl font-bold text-white">
    {@render children()}
  </div>
</div>
