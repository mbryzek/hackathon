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
	{:else if !selectedEvent}
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
	{:else}
		<!-- Code entry for selected event -->
		<div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto">
			<div class="text-center mb-8">
				<button
					onclick={goBack}
					class="text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
					</svg>
					Back to events
				</button>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">{selectedEvent.name}</h1>
				<p class="text-gray-600">Enter your code</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<input
						type="text"
						id="code"
						value={code}
						oninput={handleCodeInput}
						placeholder="AB1234"
						class="w-full px-4 py-3 text-2xl text-center font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
						autocomplete="off"
						disabled={isSubmitting}
					/>
					<p class="mt-2 text-sm text-gray-500 text-center">
						Enter the code from your voting card
					</p>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={isSubmitting || code.length !== 6}
					class="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-md"
				>
					{#if isSubmitting}
						<span class="inline-flex items-center gap-2">
							<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
								<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Loading...
						</span>
					{:else}
						Continue to Vote
					{/if}
				</button>
			</form>
		</div>

		<div class="mt-8 text-center text-gray-500 text-sm">
			<p>Lost your code? Ask a hackathon organizer for assistance.</p>
		</div>
	{/if}
</div>
