<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { adminApi, type VoteEvent, EventStatus } from '$lib/api/client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const eventId = $derived($page.params.id ?? '');

	// Get session ID from server-provided data
	const sessionId = $derived(data.adminSession?.id);

	let event = $state<VoteEvent | null>(null);
	let name = $state('');
	let key = $state('');
	let status = $state<EventStatus>(EventStatus.Draft);
	let error = $state<string | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);

	onMount(async () => {
		if (!sessionId) {
			return;
		}

		const response = await adminApi.getEvent(sessionId, eventId);

		isLoading = false;

		if (response.errors) {
			if (response.status === 401) {
				await invalidateAll();
				await goto(urls.voteAdminLogin);
				return;
			}
			if (response.status === 404) {
				error = 'Event not found';
				return;
			}
			error = response.errors[0]?.message || 'Failed to load event';
			return;
		}

		if (response.data) {
			event = response.data;
			name = response.data.name;
			key = response.data.key;
			status = response.data.status;
		}
	});

	async function handleSubmit(evt: SubmitEvent) {
		evt.preventDefault();
		error = null;

		if (!name.trim() || !key.trim() || !sessionId) {
			error = 'Please fill in all required fields';
			return;
		}

		isSubmitting = true;

		const response = await adminApi.updateEvent(sessionId, eventId, {
			name: name.trim(),
			key: key.trim(),
			status,
		});

		isSubmitting = false;

		if (response.errors) {
			error = response.errors[0]?.message || 'Failed to update event';
			return;
		}

		// Redirect back to event detail page
		await goto(urls.voteAdminEvent(eventId));
	}
</script>

<div class="animate-fade-in max-w-2xl mx-auto">
	<div class="mb-8">
		<a href={urls.voteAdminEvent(eventId)} class="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
			</svg>
			Back to Event
		</a>
		<h1 class="text-2xl font-bold text-gray-900 mt-4">Edit Event</h1>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<svg class="animate-spin h-8 w-8 text-gray-600" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
				<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
		</div>
	{:else if event}
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
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors font-mono"
						disabled={isSubmitting}
					/>
					<p class="mt-2 text-sm text-gray-500">
						Voting URL: /vote/{key}
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
								Saving...
							</span>
						{:else}
							Save Changes
						{/if}
					</button>
					<a
						href={urls.voteAdminEvent(eventId)}
						class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-center"
					>
						Cancel
					</a>
				</div>
			</form>
		</div>
	{:else}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{error || 'Event not found'}
		</div>
	{/if}
</div>
