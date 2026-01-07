<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { urls } from '$lib/urls';
	import { voteApi, type Project } from '$lib/api/client';

	const eventKey = $derived($page.params.event_key ?? '');
	const code = $derived($page.url.searchParams.get('code') || '');
	const changeVoteUrl = $derived(
		code ? `${urls.voteEvent(eventKey)}?code=${encodeURIComponent(code)}` : urls.voteEvent(eventKey)
	);

	let selectedProjects = $state<Project[]>([]);
	let isLoading = $state(true);
	let voterTypeLabel = $state('');

	onMount(async () => {
		if (code && eventKey) {
			const response = await voteApi.verifyCode(eventKey, code);
			if (response.data) {
				selectedProjects = response.data.projects
					.filter((pv) => pv.selected)
					.map((pv) => pv.project);
				voterTypeLabel = response.data.voter_type === 'student' ? 'Student' : 'Parent/Guest';
			}
		}
		isLoading = false;
	});
</script>

<div class="animate-fade-in">
	<div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto text-center">
		<!-- Success icon -->
		<div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
			<svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>

		<h1 class="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>

		<p class="text-gray-600 mb-6">
			Your vote has been recorded successfully.
		</p>

		{#if isLoading}
			<div class="flex items-center justify-center py-4 mb-6">
				<svg class="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
					<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
			</div>
		{:else if selectedProjects.length > 0}
			<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
				<p class="text-sm font-medium text-green-800 mb-2">
					{voterTypeLabel} vote{selectedProjects.length > 1 ? 's' : ''} for:
				</p>
				<ul class="space-y-1">
					{#each selectedProjects as project (project.id)}
						<li class="flex items-center gap-2 text-green-700">
							<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
							</svg>
							<span class="font-medium">{project.name}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="bg-gray-50 rounded-lg p-4 mb-6">
			<p class="text-sm text-gray-500">
				Want to change your vote? You can update your selection as long as voting is still open.
			</p>
		</div>

		<div class="space-y-3">
			<a
				href={changeVoteUrl}
				class="block w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
			>
				Change My Vote
			</a>

			<a
				href={urls.index}
				class="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
			>
				Return to Hackathon Site
			</a>
		</div>
	</div>
</div>
