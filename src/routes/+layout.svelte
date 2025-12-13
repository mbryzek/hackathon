<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Bergen Tech Hackathon</title>
</svelte:head>

<!-- Skip to content link for accessibility -->
<a href="#main-content" class="skip-link">
	Skip to main content
</a>

<div id="main-content">
	{@render children()}
</div>
