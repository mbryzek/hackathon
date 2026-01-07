<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { adminApi, type VoteEvent } from '$lib/api/client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const eventId = $derived($page.params.id ?? '');

	// Get session ID from server-provided data
	const sessionId = data.adminSession?.id;

	let event = $state<VoteEvent | null>(null);
	let error = $state<string | null>(null);
	let isLoading = $state(true);
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
		}
	});

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

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'open':
				return 'bg-green-100 text-green-800';
			case 'closed':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-yellow-100 text-yellow-800';
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
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
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<svg class="animate-spin h-8 w-8 text-gray-600" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
				<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
		</div>
	{:else if event}
		<!-- Event Header -->
		<div class="flex items-start justify-between mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">{event.name}</h1>
				<p class="text-gray-500 mt-1">
					<code class="bg-gray-100 px-2 py-1 rounded text-sm">/vote/{event.key}</code>
				</p>
			</div>
			<a
				href="{urls.voteAdminEvent(eventId)}/edit"
				class="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
				</svg>
				Edit
			</a>
		</div>

		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
				{error}
			</div>
		{/if}

		<!-- Event Details -->
		<div class="bg-white shadow rounded-xl p-6 mb-6">
			<dl class="divide-y divide-gray-200">
				<div class="py-4 first:pt-0">
					<dt class="text-sm font-medium text-gray-500">Status</dt>
					<dd class="mt-1">
						<span class="px-3 py-1 text-sm font-medium rounded-full {getStatusBadgeClass(event.status)}">
							{event.status}
						</span>
					</dd>
				</div>
				<div class="py-4">
					<dt class="text-sm font-medium text-gray-500">Event Key</dt>
					<dd class="mt-1 text-gray-900 font-mono">{event.key}</dd>
				</div>
				<div class="py-4">
					<dt class="text-sm font-medium text-gray-500">Voting URL</dt>
					<dd class="mt-1">
						<a href="/vote/{event.key}" class="text-blue-600 hover:text-blue-800 underline" target="_blank">
							/vote/{event.key}
						</a>
					</dd>
				</div>
				<div class="py-4">
					<dt class="text-sm font-medium text-gray-500">Created</dt>
					<dd class="mt-1 text-gray-900">{formatDate(event.created_at)}</dd>
				</div>
				<div class="py-4 last:pb-0">
					<dt class="text-sm font-medium text-gray-500">Last Updated</dt>
					<dd class="mt-1 text-gray-900">{formatDate(event.updated_at)}</dd>
				</div>
			</dl>
		</div>

		<!-- Quick Actions -->
		<div class="bg-white shadow rounded-xl p-6 mb-6">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Manage</h2>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<a
					href={urls.voteAdminEventProjects(eventId)}
					class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
					</svg>
					<span class="font-medium text-gray-900">Projects</span>
				</a>
				<a
					href={urls.voteAdminEventCodes(eventId)}
					class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
					</svg>
					<span class="font-medium text-gray-900">Codes</span>
				</a>
				<a
					href={urls.voteAdminEventResults(eventId)}
					class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
					</svg>
					<span class="font-medium text-gray-900">Results</span>
				</a>
			</div>
		</div>

		<!-- Danger Zone -->
		<div class="bg-white shadow rounded-xl p-6">
			<h2 class="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
			<button
				type="button"
				onclick={() => showDeleteConfirm = true}
				class="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition-colors"
			>
				Delete Event
			</button>
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
