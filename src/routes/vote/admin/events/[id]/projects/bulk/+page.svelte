<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { adminApi, type VoteEvent } from '$lib/api/client';
	import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const eventId = $derived($page.params.id ?? '');

	// Get session ID from server-provided data
	const sessionId = $derived(data.adminSession?.id);

	let event = $state<VoteEvent | null>(null);
	let error = $state<string | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let csvData = $state('');
	let deleteAllProjects = $state(false);

	const csvExample = `team_name,description
Awesome App,An app that does awesome things
Budget Tracker,Helps you track expenses
Code Helper,AI-powered coding assistant`;

	$effect(() => {
		if (sessionId) {
			loadEvent();
		}
	});

	async function loadEvent() {
		if (!sessionId) return;

		isLoading = true;
		error = null;

		const response = await adminApi.getEvent(sessionId, eventId);

		isLoading = false;

		if (response.errors) {
			if (response.status === 401) {
				await invalidateAll();
				await goto(urls.voteAdminLogin);
				return;
			}
			error = response.errors[0]?.message || 'Failed to load event';
			return;
		}

		event = response.data || null;
	}

	async function handleSubmit(evt: SubmitEvent) {
		evt.preventDefault();
		if (!sessionId || !csvData.trim()) return;

		isSubmitting = true;
		error = null;

		const response = await adminApi.createProjectCsv(sessionId, eventId, csvData.trim(), deleteAllProjects);

		isSubmitting = false;

		if (response.errors) {
			if (response.status === 401) {
				await invalidateAll();
				await goto(urls.voteAdminLogin);
				return;
			}
			error = response.errors[0]?.message || 'Failed to create projects';
			return;
		}

		// Success - redirect to projects list
		await goto(urls.voteAdminEventProjects(eventId));
	}
</script>

<div class="animate-fade-in">
	<EventAdminTabs {eventId} eventName={event?.name} activeTab="projects" />

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
			{error}
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<svg class="animate-spin h-8 w-8 text-gray-600" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
				<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
		</div>
	{:else}
		<div class="bg-white shadow rounded-xl p-6">
			<div class="mb-6">
				<a
					href={urls.voteAdminEventProjects(eventId)}
					class="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
				>
					<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
					</svg>
					Back to Projects
				</a>
			</div>

			<h2 class="text-xl font-bold text-gray-900 mb-2">Bulk Add Projects</h2>
			<p class="text-gray-600 mb-6">
				Paste CSV data below to add multiple projects at once. The first row should contain headers.
			</p>

			<div class="mb-6">
				<h3 class="text-sm font-medium text-gray-700 mb-2">Example format:</h3>
				<pre class="bg-gray-100 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto">{csvExample}</pre>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="csv-data" class="block text-sm font-medium text-gray-700 mb-2">
						CSV Data
					</label>
					<textarea
						id="csv-data"
						bind:value={csvData}
						placeholder="Paste your CSV data here..."
						rows="10"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 font-mono text-sm"
						disabled={isSubmitting}
					></textarea>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						id="delete-all-projects"
						bind:checked={deleteAllProjects}
						class="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
						disabled={isSubmitting}
					/>
					<label for="delete-all-projects" class="ml-2 block text-sm text-gray-700">
						Delete all existing projects before importing
					</label>
				</div>

				<div class="flex gap-3">
					<button
						type="submit"
						disabled={isSubmitting || !csvData.trim()}
						class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
					>
						{#if isSubmitting}
							<span class="inline-flex items-center">
								<svg class="animate-spin -ml-1 mr-2 h-5 w-5" viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
									<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
								</svg>
								Adding Projects...
							</span>
						{:else}
							Add Projects
						{/if}
					</button>
					<a
						href={urls.voteAdminEventProjects(eventId)}
						class="text-gray-600 hover:text-gray-900 py-3 px-6 transition-colors"
					>
						Cancel
					</a>
				</div>
			</form>
		</div>
	{/if}
</div>
