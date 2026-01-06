<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { adminApi, type VoteEvent, type EventStatus } from '$lib/api/client';
	import { getSessionId } from '$lib/utils/session';

	let events = $state<VoteEvent[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		const sessionId = getSessionId();
		if (!sessionId) {
			await goto(urls.voteAdminLogin);
			return;
		}

		const response = await adminApi.getEvents(sessionId);

		isLoading = false;

		if (response.errors) {
			if (response.status === 401) {
				await goto(urls.voteAdminLogin);
				return;
			}
			error = response.errors[0]?.message || 'Failed to load events';
			return;
		}

		events = response.data || [];
	});

	function getStatusBadgeClass(status: EventStatus): string {
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
		});
	}
</script>

<div class="animate-fade-in">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Events</h1>
			<p class="text-gray-600 mt-1">Manage voting events</p>
		</div>
		<a
			href={urls.voteAdminEventsNew}
			class="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
		>
			<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
			</svg>
			New Event
		</a>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<svg class="animate-spin h-8 w-8 text-gray-600" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
				<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{error}
		</div>
	{:else if events.length === 0}
		<div class="bg-white shadow rounded-xl p-12 text-center">
			<svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
			</svg>
			<h3 class="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
			<p class="text-gray-600 mb-6">Create your first voting event to get started.</p>
			<a
				href={urls.voteAdminEventsNew}
				class="inline-flex items-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors"
			>
				Create Event
			</a>
		</div>
	{:else}
		<div class="bg-white shadow rounded-xl overflow-hidden">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Event
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Key
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Created
							</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each events as event (event.id)}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="font-medium text-gray-900">{event.name}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<code class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{event.key}</code>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusBadgeClass(event.status)}">
										{event.status}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(event.created_at)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm">
									<div class="flex items-center justify-end gap-2">
										<a
											href={urls.voteAdminEvent(event.id)}
											class="text-gray-600 hover:text-gray-900 transition-colors"
											title="Edit event"
											aria-label="Edit event {event.name}"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
											</svg>
										</a>
										<a
											href={urls.voteAdminEventProjects(event.id)}
											class="text-gray-600 hover:text-gray-900 transition-colors"
											title="Manage projects"
											aria-label="Manage projects for {event.name}"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
											</svg>
										</a>
										<a
											href={urls.voteAdminEventCodes(event.id)}
											class="text-gray-600 hover:text-gray-900 transition-colors"
											title="Manage codes"
											aria-label="Manage voting codes for {event.name}"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
											</svg>
										</a>
										<a
											href={urls.voteAdminEventResults(event.id)}
											class="text-gray-600 hover:text-gray-900 transition-colors"
											title="View results"
											aria-label="View results for {event.name}"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
											</svg>
										</a>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
