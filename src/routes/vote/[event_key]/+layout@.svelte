<script lang="ts">
	import type { Snippet } from 'svelte';
	import Shell from '$lib/components/Shell.svelte';
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	const title = $derived(data.event?.name ?? 'Project Voting');
</script>

<svelte:head>
	<title>{title} - Vote - Bergen Tech Hackathon</title>
</svelte:head>

<Shell {title}>
	{@render children()}
</Shell>
