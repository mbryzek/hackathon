<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { urls } from '$lib/urls';
	import { adminApi, type VoteEvent, type Code, type CodeSummary, type VoterType } from '$lib/api/client';
	import { MAX_LIMIT_PER_REQUEST, MAX_CODES_TO_GENERATE } from '$lib/utils/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const eventId = $derived($page.params.id ?? '');

	// Get session ID from server-provided data
	const sessionId = $derived(data.adminSession?.id);

	let event = $state<VoteEvent | null>(null);
	let codes = $state<Code[]>([]);
	let summary = $state<CodeSummary | null>(null);
	let error = $state<string | null>(null);
	let isLoading = $state(true);

	// Generate form
	let showGenerateForm = $state(false);
	let generateVoterType = $state<VoterType>('student');
	let generateCount = $state(10);
	let isGenerating = $state(false);

	// Filters
	let filterVoterType = $state<VoterType | ''>('');
	let filterHasVoted = $state<boolean | ''>('');

	// Delete
	let deletingCodeId = $state<string | null>(null);

	onMount(async () => {
		if (!sessionId) {
			return;
		}

		await loadData();
	});

	async function loadData() {
		if (!sessionId) return;

		isLoading = true;
		error = null;

		// Load event and summary in parallel
		const [eventResponse, summaryResponse] = await Promise.all([
			adminApi.getEvent(sessionId, eventId),
			adminApi.getCodeSummary(sessionId, eventId),
		]);

		if (eventResponse.errors) {
			isLoading = false;
			error = eventResponse.errors[0]?.message || 'Failed to load event';
			return;
		}

		event = eventResponse.data || null;
		summary = summaryResponse.data || null;

		// Load all codes with pagination
		const allCodes: Code[] = [];
		let offset = 0;
		let hasMore = true;

		while (hasMore) {
			const params: { voter_type?: VoterType; has_voted?: boolean; limit?: number; offset?: number } = {
				limit: MAX_LIMIT_PER_REQUEST,
				offset,
			};
			if (filterVoterType) params.voter_type = filterVoterType;
			if (filterHasVoted !== '') params.has_voted = filterHasVoted;

			const codesResponse = await adminApi.getCodes(sessionId, eventId, params);

			if (codesResponse.errors) {
				break;
			}

			const batch = codesResponse.data || [];
			allCodes.push(...batch);

			// If we got fewer than the limit, we've reached the end
			if (batch.length < MAX_LIMIT_PER_REQUEST) {
				hasMore = false;
			} else {
				offset += MAX_LIMIT_PER_REQUEST;
			}
		}

		codes = allCodes;
		isLoading = false;
	}

	async function handleGenerateCodes(evt: SubmitEvent) {
		evt.preventDefault();
		if (!sessionId) return;

		isGenerating = true;
		error = null;

		const response = await adminApi.generateCodes(sessionId, eventId, {
			voter_type: generateVoterType,
			count: generateCount,
		});

		isGenerating = false;

		if (response.errors) {
			error = response.errors[0]?.message || 'Failed to generate codes';
			return;
		}

		if (response.data) {
			codes = [...codes, ...response.data];
			showGenerateForm = false;
		}
	}

	async function deleteCode(codeId: string) {
		if (!sessionId) return;

		deletingCodeId = codeId;
		error = null;

		const response = await adminApi.deleteCode(sessionId, eventId, codeId);

		deletingCodeId = null;

		if (response.errors) {
			error = response.errors[0]?.message || 'Failed to delete code';
			return;
		}

		codes = codes.filter((c) => c.id !== codeId);
	}

	function copyAllCodes() {
		const codeText = codes.map((c) => c.code).join('\n');
		navigator.clipboard.writeText(codeText);
	}

	</script>

<div class="animate-fade-in">
	<div class="mb-8">
		<a href={urls.voteAdminEvent(eventId)} class="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
			</svg>
			Back to Event
		</a>
		<h1 class="text-2xl font-bold text-gray-900 mt-4">
			{event?.name || 'Loading...'} - Voting Codes
		</h1>
		<p class="text-gray-600 mt-1">Generate and manage voting codes</p>
	</div>

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
		<!-- Stats -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
			<div class="bg-white shadow rounded-xl p-4 text-center">
				<div class="text-3xl font-bold text-gray-900">{summary?.total ?? 0}</div>
				<div class="text-sm text-gray-600">Total Codes</div>
			</div>
			<div class="bg-white shadow rounded-xl p-4 text-center">
				<div class="text-3xl font-bold text-blue-600">{summary?.student ?? 0}</div>
				<div class="text-sm text-gray-600">Student Codes</div>
			</div>
			<div class="bg-white shadow rounded-xl p-4 text-center">
				<div class="text-3xl font-bold text-purple-600">{summary?.parent ?? 0}</div>
				<div class="text-sm text-gray-600">Parent Codes</div>
			</div>
			<div class="bg-white shadow rounded-xl p-4 text-center">
				<div class="text-3xl font-bold text-green-600">{summary?.votes ?? 0}</div>
				<div class="text-sm text-gray-600">Votes Cast</div>
			</div>
		</div>

		<!-- Generate codes form -->
		<div class="mb-6">
			{#if showGenerateForm}
				<div class="bg-white shadow rounded-xl p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Generate New Codes</h3>
					<form onsubmit={handleGenerateCodes} class="space-y-4">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="voter-type" class="block text-sm font-medium text-gray-700 mb-2">
									Voter Type
								</label>
								<select
									id="voter-type"
									bind:value={generateVoterType}
									class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
									disabled={isGenerating}
								>
									<option value="student">Student (1 vote)</option>
									<option value="parent">Parent (3 votes)</option>
								</select>
							</div>
							<div>
								<label for="count" class="block text-sm font-medium text-gray-700 mb-2">
									Number of Codes
								</label>
								<input
									type="number"
									id="count"
									bind:value={generateCount}
									min="1"
									max={MAX_CODES_TO_GENERATE}
									class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
									disabled={isGenerating}
								/>
							</div>
						</div>
						<div class="flex gap-3">
							<button
								type="submit"
								disabled={isGenerating || generateCount < 1}
								class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
							>
								{isGenerating ? 'Generating...' : `Generate ${generateCount} Codes`}
							</button>
							<button
								type="button"
								onclick={() => showGenerateForm = false}
								class="text-gray-600 hover:text-gray-900 py-2 px-4 transition-colors"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			{:else}
				<div class="flex flex-wrap gap-4">
					<button
						type="button"
						onclick={() => showGenerateForm = true}
						class="inline-flex items-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
						</svg>
						Generate Codes
					</button>
					{#if codes.length > 0}
						<button
							type="button"
							onclick={copyAllCodes}
							class="inline-flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
						>
							<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
							</svg>
							Copy All Codes
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Filters -->
		<div class="bg-white shadow rounded-xl p-4 mb-6">
			<div class="flex flex-wrap gap-4 items-end">
				<div>
					<label for="filter-type" class="block text-sm font-medium text-gray-700 mb-2">
						Voter Type
					</label>
					<select
						id="filter-type"
						bind:value={filterVoterType}
						onchange={() => loadData()}
						class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
					>
						<option value="">All</option>
						<option value="student">Student</option>
						<option value="parent">Parent</option>
					</select>
				</div>
				<div>
					<label for="filter-voted" class="block text-sm font-medium text-gray-700 mb-2">
						Status
					</label>
					<select
						id="filter-voted"
						bind:value={filterHasVoted}
						onchange={() => loadData()}
						class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
					>
						<option value="">All</option>
						<option value={true}>Used</option>
						<option value={false}>Unused</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Codes list -->
		{#if codes.length === 0}
			<div class="bg-white shadow rounded-xl p-12 text-center">
				<svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
				</svg>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">No codes yet</h3>
				<p class="text-gray-600">Generate codes for voters to use.</p>
			</div>
		{:else}
			<div class="bg-white shadow rounded-xl overflow-hidden">
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Code
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Type
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each codes as code (code.id)}
								<tr class="hover:bg-gray-50 transition-colors">
									<td class="px-6 py-4 whitespace-nowrap">
										<code class="text-lg font-mono font-bold tracking-widest">{code.code}</code>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="px-2 py-1 text-xs font-medium rounded-full
											{code.voter_type === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
											{code.voter_type}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if code.has_voted}
											<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
												Voted
											</span>
										{:else}
											<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
												Unused
											</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right">
										<button
											type="button"
											onclick={() => deleteCode(code.id)}
											disabled={deletingCodeId === code.id || code.has_voted}
											class="text-red-600 hover:text-red-700 p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											title={code.has_voted ? 'Cannot delete used code' : 'Delete'}
										>
											{#if deletingCodeId === code.id}
												<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
													<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
													<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
												</svg>
											{:else}
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
												</svg>
											{/if}
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>
