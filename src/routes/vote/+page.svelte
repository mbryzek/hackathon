<script lang="ts">
	import { goto } from '$app/navigation';
	import { urls } from '$lib/urls';

	let code = $state('');
	let eventKey = $state('');
	let error = $state<string | null>(null);
	let isSubmitting = $state(false);

	// Format code as user types (add dash after 3 digits for readability)
	function handleCodeInput(event: Event) {
		const input = event.target as HTMLInputElement;
		// Remove non-digits
		let value = input.value.replace(/\D/g, '');
		// Limit to 6 digits
		value = value.slice(0, 6);
		code = value;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = null;

		if (code.length !== 6) {
			error = 'Please enter a 6-digit code';
			return;
		}

		if (!eventKey.trim()) {
			error = 'Please enter the event name';
			return;
		}

		isSubmitting = true;

		// Navigate to event voting page with code as query param
		await goto(`${urls.voteEvent(eventKey.trim().toLowerCase())}?code=${code}`);
	}
</script>

<div class="animate-fade-in">
	<div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-gray-900 mb-2">Cast Your Vote</h1>
			<p class="text-gray-600">
				Enter your 6-digit voting code to vote for your favorite projects.
			</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-6">
			<div>
				<label for="event" class="block text-sm font-medium text-gray-700 mb-2">
					Event Name
				</label>
				<input
					type="text"
					id="event"
					bind:value={eventKey}
					placeholder="e.g., hackathon-2025"
					class="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
					autocomplete="off"
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<label for="code" class="block text-sm font-medium text-gray-700 mb-2">
					Voting Code
				</label>
				<input
					type="text"
					id="code"
					value={code}
					oninput={handleCodeInput}
					placeholder="123456"
					class="w-full px-4 py-3 text-2xl text-center font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
					inputmode="numeric"
					maxlength="6"
					autocomplete="off"
					disabled={isSubmitting}
				/>
				<p class="mt-2 text-sm text-gray-500 text-center">
					Enter the 6-digit code from your voting card
				</p>
			</div>

			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
					{error}
				</div>
			{/if}

			<button
				type="submit"
				disabled={isSubmitting || code.length !== 6 || !eventKey.trim()}
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
</div>
