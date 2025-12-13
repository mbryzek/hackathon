<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
	}

	let { title, children }: Props = $props();
</script>

<div class="bg-slate-700 rounded-lg p-6 mt-4 border-l-4 border-yellow-500 shadow-lg">
	<div class="text-yellow-500 text-sm uppercase tracking-wide font-bold mb-1">
		{title}
	</div>
	<div class="text-2xl font-bold text-white">
		{@render children()}
	</div>
</div>
