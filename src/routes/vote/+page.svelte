<script lang="ts">
	import { goto } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { voteApi, type Event } from '$lib/api/client';

	let events = $state<Event[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Fetch open events on mount
	$effect(() => {
		fetchOpenEvents();
	});

	async function fetchOpenEvents() {
		isLoading = true;
		error = null;

		const response = await voteApi.getOpenEvents();

		isLoading = false;

		if (response.errors) {
			error = response.errors[0]?.message || 'Failed to load events';
			return;
		}

		events = response.data || [];

		// If exactly one event, redirect directly
		if (events.length === 1 && events[0]) {
			await goto(urls.voteEvent(events[0].key));
		}
	}

	function selectEvent(event: Event) {
		goto(urls.voteEvent(event.key));
	}
</script>

<div class="animate-fade-in">
	{#if isLoading}
		<!-- Loading state -->
		<div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto text-center">
			<div class="inline-flex items-center gap-3 text-gray-600">
				<svg class="animate-spin h-6 w-6" viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
					<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
				Loading events...
			</div>
		</div>
	{:else if error && events.length === 0}
		<!-- Error state -->
		<div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto text-center">
			<div class="text-red-600 mb-4">
				<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
				</svg>
			</div>
			<h2 class="text-xl font-bold text-gray-900 mb-2">Error</h2>
			<p class="text-gray-600">{error}</p>
			<button
				onclick={() => fetchOpenEvents()}
				class="mt-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
			>
				Try Again
			</button>
		</div>
	{:else if events.length === 0}
		<!-- No events -->
		<div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto text-center">
			<div class="text-gray-400 mb-4">
				<svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
				</svg>
			</div>
			<h2 class="text-xl font-bold text-gray-900 mb-2">No Active Events</h2>
			<p class="text-gray-600">There are no voting events open at this time. Please check back later.</p>
		</div>
	{:else}
		<!-- Event selection -->
		<div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto">
			<div class="text-center mb-6">
				<h1 class="text-2xl font-bold text-gray-900 mb-2">Select an Event</h1>
				<p class="text-gray-600">Choose the event you want to vote in.</p>
			</div>

			<div class="space-y-3">
				{#each events as event (event.id)}
					<button
						onclick={() => selectEvent(event)}
						class="w-full text-left bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-400 rounded-lg p-4 transition-all duration-200"
					>
						<h3 class="font-semibold text-gray-900">{event.name}</h3>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
