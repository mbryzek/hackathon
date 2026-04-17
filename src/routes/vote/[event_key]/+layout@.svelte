<script lang="ts">
	import type { Snippet } from 'svelte';
	import { invalidateAll } from '$app/navigation';
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
	{#if data.event}
		{@render children()}
	{:else if data.loadError}
		<div class="animate-fade-in">
			<div
				class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto text-center"
				data-testid="vote-load-error"
			>
				<div class="text-red-600 mb-4">
					<svg
						class="w-12 h-12 mx-auto"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						></path>
					</svg>
				</div>
				<h2 class="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
				<p class="text-gray-600 mb-4">
					We couldn't load this voting event. Please try again.
				</p>
				<button
					onclick={() => invalidateAll()}
					class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
				>
					Try Again
				</button>
			</div>
		</div>
	{:else}
		<div class="animate-fade-in">
			<div
				class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto text-center"
				data-testid="vote-not-available"
			>
				<div class="text-gray-400 mb-4">
					<svg
						class="w-12 h-12 mx-auto"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
				</div>
				<h2 class="text-xl font-bold text-gray-900 mb-2">Voting Not Available</h2>
				<p class="text-gray-600">
					This voting event is not currently open. Please check back later.
				</p>
			</div>
		</div>
	{/if}
</Shell>
