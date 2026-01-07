<script lang="ts">
	import { urls } from '$lib/urls';

	interface Props {
		eventId: string;
		eventName?: string;
		activeTab: 'event' | 'projects' | 'codes' | 'results';
	}

	let { eventId, eventName, activeTab }: Props = $props();

	const tabs = $derived([
		{ id: 'event', label: 'Event', href: urls.voteAdminEvent(eventId) },
		{ id: 'projects', label: 'Projects', href: urls.voteAdminEventProjects(eventId) },
		{ id: 'codes', label: 'Codes', href: urls.voteAdminEventCodes(eventId) },
		{ id: 'results', label: 'Results', href: urls.voteAdminEventResults(eventId) },
	] as const);
</script>

<div class="mb-6">
	<div class="flex items-center justify-between mb-4">
		<a href={urls.voteAdmin} class="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
			</svg>
			Back to Events
		</a>
		{#if eventName}
			<h1 class="text-xl font-bold text-gray-900">{eventName}</h1>
		{/if}
	</div>

	<div class="border-b border-gray-200">
		<nav class="flex -mb-px" aria-label="Tabs">
			{#each tabs as tab (tab.id)}
				<a
					href={tab.href}
					class="px-6 py-3 text-sm font-medium border-b-2 transition-colors
						{activeTab === tab.id
							? 'border-yellow-500 text-yellow-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
				>
					{tab.label}
				</a>
			{/each}
		</nav>
	</div>
</div>
