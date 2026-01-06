<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { adminApi, type VoteEvent, type EventResults, type ProjectTally } from '$lib/api/client';
	import { getSessionId } from '$lib/utils/session';
	import { RESULTS_REFRESH_INTERVAL_MS } from '$lib/utils/constants';

	const eventId = $derived($page.params.id ?? '');

	let event = $state<VoteEvent | null>(null);
	let results = $state<EventResults | null>(null);
	let error = $state<string | null>(null);
	let isLoading = $state(true);
	let sessionId = $state<string | null>(null);
	let isPresentationMode = $state(false);
	let autoRefresh = $state(false);
	let refreshInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		sessionId = getSessionId();
		if (!sessionId) {
			goto(urls.voteAdminLogin);
			return;
		}

		loadData();

		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});

	$effect(() => {
		if (autoRefresh && sessionId) {
			refreshInterval = setInterval(() => {
				loadData();
			}, RESULTS_REFRESH_INTERVAL_MS);
		} else if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	});

	async function loadData() {
		if (!sessionId) return;

		const showLoading = !results;
		if (showLoading) isLoading = true;
		error = null;

		const [eventResponse, resultsResponse] = await Promise.all([
			event ? Promise.resolve({ data: event, status: 200, errors: undefined }) : adminApi.getEvent(sessionId, eventId),
			adminApi.getResults(sessionId, eventId),
		]);

		if (showLoading) isLoading = false;

		if (eventResponse.errors) {
			if (eventResponse.status === 401) {
				await goto(urls.voteAdminLogin);
				return;
			}
			error = eventResponse.errors[0]?.message || 'Failed to load event';
			return;
		}

		if (resultsResponse.errors && resultsResponse.status !== 401) {
			error = resultsResponse.errors[0]?.message || 'Failed to load results';
		}

		event = eventResponse.data || null;
		results = resultsResponse.data || null;
	}

	function togglePresentationMode() {
		isPresentationMode = !isPresentationMode;
		if (isPresentationMode) {
			document.documentElement.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	}

	// Sort projects by vote count for each category
	const sortedStudentProjects = $derived(
		results?.student.projects.slice().sort((a: ProjectTally, b: ProjectTally) => b.vote_count - a.vote_count) || []
	);

	const sortedParentProjects = $derived(
		results?.parent.projects.slice().sort((a: ProjectTally, b: ProjectTally) => b.vote_count - a.vote_count) || []
	);

	// Calculate total votes
	const totalVotes = $derived(
		(results?.student.total_votes ?? 0) + (results?.parent.total_votes ?? 0)
	);

	// Calculate max votes for bar width (across both categories)
	const maxVotes = $derived(() => {
		const allProjects = [...sortedStudentProjects, ...sortedParentProjects];
		return allProjects.length > 0 ? Math.max(...allProjects.map((p: ProjectTally) => p.vote_count), 1) : 1;
	});

	function getBarWidth(voteCount: number): string {
		return `${(voteCount / maxVotes()) * 100}%`;
	}

	function getRankBadgeClass(rank: number): string {
		switch (rank) {
			case 1:
				return 'bg-yellow-400 text-yellow-900';
			case 2:
				return 'bg-gray-300 text-gray-800';
			case 3:
				return 'bg-amber-600 text-white';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}
</script>

<div class="animate-fade-in {isPresentationMode ? 'fixed inset-0 bg-gray-900 z-50 overflow-auto' : ''}">
	{#if !isPresentationMode}
		<div class="mb-8">
			<a href={urls.voteAdminEvent(eventId)} class="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
				</svg>
				Back to Event
			</a>
			<h1 class="text-2xl font-bold text-gray-900 mt-4">
				{event?.name || 'Loading...'} - Results
			</h1>
		</div>
	{/if}

	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
			{error}
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<svg class="animate-spin h-8 w-8 {isPresentationMode ? 'text-white' : 'text-gray-600'}" viewBox="0 0 24 24">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
				<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
			</svg>
		</div>
	{:else if results}
		<!-- Controls -->
		<div class="{isPresentationMode ? 'absolute top-4 right-4 z-10' : 'mb-6'} flex gap-4">
			<button
				type="button"
				onclick={togglePresentationMode}
				class="{isPresentationMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if isPresentationMode}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
					{/if}
				</svg>
				{isPresentationMode ? 'Exit' : 'Present'}
			</button>
			<label class="inline-flex items-center gap-2 {isPresentationMode ? 'text-white' : 'text-gray-700'}">
				<input
					type="checkbox"
					bind:checked={autoRefresh}
					class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
				/>
				Auto-refresh
			</label>
		</div>

		<!-- Results display -->
		<div class="{isPresentationMode ? 'p-8' : ''}">
			{#if isPresentationMode}
				<h1 class="text-5xl font-bold text-white text-center mb-2">{event?.name}</h1>
				<p class="text-2xl text-gray-400 text-center mb-8">Voting Results</p>
			{/if}

			<!-- Total votes -->
			<div class="{isPresentationMode ? 'text-center mb-12' : 'bg-white shadow rounded-xl p-6 mb-6 text-center'}">
				<div class="{isPresentationMode ? 'text-6xl font-bold text-yellow-400' : 'text-4xl font-bold text-gray-900'}">
					{totalVotes}
				</div>
				<div class="{isPresentationMode ? 'text-xl text-gray-400' : 'text-gray-600'}">
					Total Votes Cast
				</div>
				<div class="{isPresentationMode ? 'text-lg text-gray-500 mt-2' : 'text-sm text-gray-500 mt-2'}">
					{results.student.total_votes} student · {results.parent.total_votes} parent
				</div>
			</div>

			<!-- Student Results -->
			<div class="mb-8">
				<h2 class="{isPresentationMode ? 'text-3xl font-bold text-white mb-4' : 'text-xl font-bold text-gray-900 mb-4'}">
					Student Votes
				</h2>
				{#if sortedStudentProjects.length === 0}
					<div class="{isPresentationMode ? 'text-center text-white/60 text-xl py-8' : 'bg-white shadow rounded-xl p-8 text-center text-gray-500'}">
						No student votes yet.
					</div>
				{:else}
					<div class="space-y-{isPresentationMode ? '6' : '4'}">
						{#each sortedStudentProjects as projectTally, index (projectTally.project.id)}
							{@const rank = index + 1}
							<div class="{isPresentationMode ? 'bg-white/10 backdrop-blur rounded-xl p-6' : 'bg-white shadow rounded-xl p-6'}">
								<div class="flex items-center gap-4">
									<div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg {getRankBadgeClass(rank)}">
										{rank}
									</div>
									<div class="flex-grow">
										<div class="flex items-center justify-between mb-2">
											<h3 class="{isPresentationMode ? 'text-2xl font-bold text-white' : 'text-lg font-semibold text-gray-900'}">
												{projectTally.project.name}
											</h3>
											<span class="{isPresentationMode ? 'text-3xl font-bold text-yellow-400' : 'text-2xl font-bold text-gray-900'}">
												{projectTally.vote_count}
											</span>
										</div>
										<div class="{isPresentationMode ? 'h-4 bg-white/10' : 'h-3 bg-gray-100'} rounded-full overflow-hidden">
											<div
												class="h-full {rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-400' : rank === 3 ? 'bg-amber-600' : 'bg-gray-300'} rounded-full transition-all duration-500"
												style="width: {getBarWidth(projectTally.vote_count)}"
											></div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Parent Results -->
			<div>
				<h2 class="{isPresentationMode ? 'text-3xl font-bold text-white mb-4' : 'text-xl font-bold text-gray-900 mb-4'}">
					Parent Votes
				</h2>
				{#if sortedParentProjects.length === 0}
					<div class="{isPresentationMode ? 'text-center text-white/60 text-xl py-8' : 'bg-white shadow rounded-xl p-8 text-center text-gray-500'}">
						No parent votes yet.
					</div>
				{:else}
					<div class="space-y-{isPresentationMode ? '6' : '4'}">
						{#each sortedParentProjects as projectTally, index (projectTally.project.id)}
							{@const rank = index + 1}
							<div class="{isPresentationMode ? 'bg-white/10 backdrop-blur rounded-xl p-6' : 'bg-white shadow rounded-xl p-6'}">
								<div class="flex items-center gap-4">
									<div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg {getRankBadgeClass(rank)}">
										{rank}
									</div>
									<div class="flex-grow">
										<div class="flex items-center justify-between mb-2">
											<h3 class="{isPresentationMode ? 'text-2xl font-bold text-white' : 'text-lg font-semibold text-gray-900'}">
												{projectTally.project.name}
											</h3>
											<span class="{isPresentationMode ? 'text-3xl font-bold text-blue-400' : 'text-2xl font-bold text-gray-900'}">
												{projectTally.vote_count}
											</span>
										</div>
										<div class="{isPresentationMode ? 'h-4 bg-white/10' : 'h-3 bg-gray-100'} rounded-full overflow-hidden">
											<div
												class="h-full {rank === 1 ? 'bg-blue-400' : rank === 2 ? 'bg-gray-400' : rank === 3 ? 'bg-amber-600' : 'bg-gray-300'} rounded-full transition-all duration-500"
												style="width: {getBarWidth(projectTally.vote_count)}"
											></div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body:has(.fixed.inset-0)) {
		overflow: hidden;
	}
</style>
