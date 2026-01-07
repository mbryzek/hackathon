<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { adminApi, type VoteEvent, type EventStatus } from '$lib/api/client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const eventId = $derived($page.params.id ?? '');

	// Get session ID from server-provided data
	const sessionId = data.adminSession?.id;

	let event = $state<VoteEvent | null>(null);
	let name = $state('');
	let key = $state('');
	let status = $state<EventStatus>('draft');
	let error = $state<string | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);

	onMount(async () => {
		if (!sessionId) {
			return;
		}

		const response = await adminApi.getEvent(sessionId, eventId);

		isLoading = false;

		if (response.errors) {
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

	async function handleFormSubmit(evt: SubmitEvent) {
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

		if (response.data) {
			event = response.data;
		}
	}

	async function handleDelete() {
		if (!sessionId) return;

		isDeleting = true;

		const response = await adminApi.deleteEvent(sessionId, eventId);

		isDeleting = false;

		if (response.errors) {
			error = response.errors[0]?.message || 'Failed to delete event';
			showDeleteConfirm = false;
			return;
		}

		await goto(urls.voteAdmin);
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
		<!-- Quick links -->
		<div class="bg-white shadow rounded-xl p-4 mb-6">
			<div class="flex flex-wrap gap-4">
				<a
					href={urls.voteAdminEventProjects(eventId)}
					class="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
					</svg>
					Manage Projects
				</a>
				<a
					href={urls.voteAdminEventCodes(eventId)}
					class="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
					</svg>
					Manage Codes
				</a>
				<a
					href={urls.voteAdminEventResults(eventId)}
					class="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
					</svg>
					View Results
				</a>
			</div>
		</div>

		<div class="bg-white shadow rounded-xl p-6">
			<form onsubmit={handleFormSubmit} class="space-y-6">
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
				</div>
			</form>

			<!-- Delete section -->
			<div class="mt-8 pt-8 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
				<button
					type="button"
					onclick={() => showDeleteConfirm = true}
					class="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition-colors"
				>
					Delete Event
				</button>
			</div>
		</div>
	{:else}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{error || 'Event not found'}
		</div>
	{/if}
</div>

<!-- Delete confirmation modal -->
{#if showDeleteConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div
			class="absolute inset-0 bg-black bg-opacity-50"
			onclick={() => showDeleteConfirm = false}
			role="button"
			tabindex="-1"
			onkeydown={(e) => e.key === 'Escape' && (showDeleteConfirm = false)}
		></div>
		<div class="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
			<h2 class="text-xl font-bold text-gray-900 mb-4">Delete Event</h2>
			<p class="text-gray-600 mb-6">
				Are you sure you want to delete this event? This action cannot be undone and will delete all associated projects, codes, and votes.
			</p>
			<div class="flex gap-3 justify-end">
				<button
					type="button"
					onclick={() => showDeleteConfirm = false}
					class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleDelete}
					disabled={isDeleting}
					class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
				>
					{#if isDeleting}
						Deleting...
					{:else}
						Delete Event
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
