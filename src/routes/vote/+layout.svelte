<script lang="ts">
	import type { Snippet } from 'svelte';
	import { urls } from '$lib/urls';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Vote - Bergen Tech Hackathon</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<!-- Simple header for voting pages -->
	<nav class="bg-gray-800">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<a href={urls.index} class="flex items-center">
					<img
						class="h-12 w-36"
						src="/assets/bt-cs-logo.png"
						alt="Bergen Tech Hackathon"
					/>
				</a>
				<span class="text-white text-lg font-semibold">Project Voting</span>
			</div>
		</div>
	</nav>

	<main class="py-8">
		<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
			{@render children()}
		</div>
	</main>

	<footer class="bg-gray-800 mt-auto">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<p class="text-center text-gray-400 text-sm">
				Bergen Tech Hackathon Project Voting
			</p>
		</div>
	</footer>
</div>
