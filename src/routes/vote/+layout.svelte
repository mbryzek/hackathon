<script lang="ts">
	import type { Snippet } from 'svelte';
	import Shell from '$lib/components/Shell.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Vote - Bergen Tech Hackathon</title>
</svelte:head>

<Shell title="Project Voting">
	{@render children()}
</Shell>
