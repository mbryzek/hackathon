<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { adminApi, type EventStatus } from '$lib/api/client';
	import { getSessionId } from '$lib/utils/session';

	let name = $state('');
	let key = $state('');
	let status = $state<EventStatus>('draft');
	let error = $state<string | null>(null);
	let isSubmitting = $state(false);
	let sessionId = $state<string | null>(null);

	onMount(async () => {
		sessionId = getSessionId();
		if (!sessionId) {
			await goto(urls.voteAdminLogin);
		}
	});

	// Auto-generate key from name
	function handleNameChange() {
		if (!key || key === slugify(name.slice(0, -1))) {
			key = slugify(name);
		}
	}

	function slugify(text: string): string {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/[\s_-]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = null;

		if (!name.trim()) {
			error = 'Please enter an event name';
			return;
		}

		if (!key.trim()) {
			error = 'Please enter an event key';
			return;
		}

		if (!sessionId) {
			await goto(urls.voteAdminLogin);
			return;
		}

		isSubmitting = true;

		const response = await adminApi.createEvent(sessionId, {
			name: name.trim(),
			key: key.trim(),
			status,
		});

		isSubmitting = false;

		if (response.errors) {
			if (response.status === 401) {
				await goto(urls.voteAdminLogin);
				return;
			}
			error = response.errors[0]?.message || 'Failed to create event';
			return;
		}

		if (response.data) {
			await goto(urls.voteAdminEvent(response.data.id));
		}
	}
</script>

<div class="animate-fade-in max-w-2xl mx-auto">
	<div class="mb-8">
		<a href={urls.voteAdmin} class="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
			</svg>
			Back to Events
		</a>
		<h1 class="text-2xl font-bold text-gray-900 mt-4">Create New Event</h1>
	</div>

	<div class="bg-white shadow rounded-xl p-6">
		<form onsubmit={handleSubmit} class="space-y-6">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
					Event Name
				</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					oninput={handleNameChange}
					placeholder="e.g., Hackathon 2025"
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<label for="key" class="block text-sm font-medium text-gray-700 mb-2">
					Event Key (URL slug)
				</label>
				<input
					type="text"
					id="key"
					bind:value={key}
					placeholder="e.g., hackathon-2025"
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors font-mono"
					disabled={isSubmitting}
				/>
				<p class="mt-2 text-sm text-gray-500">
					This will be used in the voting URL: /vote/{key || 'event-key'}
				</p>
			</div>

			<div>
				<label for="status" class="block text-sm font-medium text-gray-700 mb-2">
					Status
				</label>
				<select
					id="status"
					bind:value={status}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
					disabled={isSubmitting}
				>
					<option value="draft">Draft</option>
					<option value="open">Open</option>
					<option value="closed">Closed</option>
				</select>
				<p class="mt-2 text-sm text-gray-500">
					Set to "Open" when ready to accept votes.
				</p>
			</div>

			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			{/if}

			<div class="flex gap-4">
				<button
					type="submit"
					disabled={isSubmitting || !name.trim() || !key.trim()}
					class="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<span class="inline-flex items-center justify-center gap-2">
							<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
								<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Creating...
						</span>
					{:else}
						Create Event
					{/if}
				</button>
				<a
					href={urls.voteAdmin}
					class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
				>
					Cancel
				</a>
			</div>
		</form>
	</div>
</div>
