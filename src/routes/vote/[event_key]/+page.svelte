<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { voteApi, type Vote } from '$lib/api/client';

	const eventKey = $derived($page.params.event_key ?? '');

	// Get initial code from URL (only read once on mount)
	const initialCode = $page.url.searchParams.get('code') || '';

	let code = $state(initialCode);
	let verification = $state<Vote | null>(null);
	let selectedProjectIds = $state<Set<string>>(new Set());
	let error = $state<string | null>(null);
	let isVerifying = $state(false);
	let isSubmitting = $state(false);
	let codeVerified = $state(false);

	// Auto-verify if code was provided in URL
	onMount(() => {
		if (initialCode) {
			verifyCode();
		}
	});

	async function verifyCode() {
		error = null;
		isVerifying = true;

		const response = await voteApi.verifyCode(eventKey, code);

		isVerifying = false;

		if (response.errors) {
			error = response.errors[0]?.message || 'Invalid code';
			verification = null;
			codeVerified = false;
			return;
		}

		if (response.data) {
			verification = response.data;
			codeVerified = true;

			// Pre-select already voted projects
			const preSelected = new Set<string>();
			for (const pv of verification.projects) {
				if (pv.selected) {
					preSelected.add(pv.project.id);
				}
			}
			selectedProjectIds = preSelected;
		}
	}

	function handleProjectSelect(projectId: string) {
		if (!verification) return;

		const newSelected = new Set(selectedProjectIds);

		if (verification.max_votes === 1) {
			// Student: radio behavior
			newSelected.clear();
			newSelected.add(projectId);
		} else {
			// Parent: checkbox behavior
			if (newSelected.has(projectId)) {
				newSelected.delete(projectId);
			} else if (newSelected.size < verification.max_votes) {
				newSelected.add(projectId);
			}
		}

		selectedProjectIds = newSelected;
	}

	async function handleSubmit() {
		if (!verification || selectedProjectIds.size === 0) {
			error = 'Please select at least one project';
			return;
		}

		if (selectedProjectIds.size > verification.max_votes) {
			error = `You can only vote for up to ${verification.max_votes} project(s)`;
			return;
		}

		error = null;
		isSubmitting = true;

		const response = await voteApi.submitVote(eventKey, code, Array.from(selectedProjectIds));

		isSubmitting = false;

		if (response.errors) {
			error = response.errors[0]?.message || 'Failed to submit vote';
			return;
		}

		// Navigate to thank you page with code for "change vote" functionality
		await goto(`${urls.voteThanks(eventKey)}?code=${encodeURIComponent(code)}`);
	}

	function handleCodeInput(evt: globalThis.Event) {
		const input = evt.target as HTMLInputElement;
		code = input.value;
	}

	const canSubmit = $derived(
		verification && selectedProjectIds.size > 0 && selectedProjectIds.size <= (verification?.max_votes || 0)
	);

	const voterTypeLabel = $derived(
		verification?.voter_type === 'student' ? 'Student' : 'Parent/Guest'
	);

	const voteInstructions = $derived(
		verification?.max_votes === 1
			? 'Select 1 project'
			: `Select up to ${verification?.max_votes} projects`
	);
</script>

<div class="animate-fade-in">
	{#if !codeVerified}
		<!-- Code entry form -->
		<div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto">
			<div class="text-center mb-8">
				<h1 class="text-2xl font-bold text-gray-900 mb-2">Enter your code</h1>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); verifyCode(); }} class="space-y-6">
				<div>
					<input
						type="text"
						id="code"
						value={code}
						oninput={handleCodeInput}
						placeholder="AB1234"
						class="w-full px-4 py-3 text-2xl text-center font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
						autocomplete="off"
						disabled={isVerifying}
					/>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={isVerifying}
					class="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
				>
					{#if isVerifying}
						<span class="inline-flex items-center justify-center gap-2">
							<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
								<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Verifying...
						</span>
					{:else}
						Verify Code
					{/if}
				</button>
			</form>
		</div>
	{:else if verification}
		<!-- Voting interface -->
		<div class="space-y-6">
			<!-- Header -->
			<div class="bg-white shadow-lg rounded-xl p-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 class="text-2xl font-bold text-gray-900">{verification.event.name}</h1>
						<p class="text-gray-600 mt-1">
							Voting as: <span class="font-semibold">{voterTypeLabel}</span>
						</p>
					</div>
					<div class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-center">
						<span class="font-semibold">{voteInstructions}</span>
						<br />
						<span class="text-sm">
							{selectedProjectIds.size} of {verification.max_votes} selected
						</span>
					</div>
				</div>
			</div>

			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
					{error}
				</div>
			{/if}

			<!-- Projects list -->
			<div class="space-y-4">
				{#each verification.projects as pv (pv.project.id)}
					{@const isSelected = selectedProjectIds.has(pv.project.id)}
					{@const isDisabled = !isSelected && selectedProjectIds.size >= verification.max_votes}
					<button
						type="button"
						onclick={() => handleProjectSelect(pv.project.id)}
						disabled={isDisabled && verification.max_votes > 1}
						class="w-full text-left bg-white shadow rounded-xl p-6 transition-all duration-200
							{isSelected ? 'ring-2 ring-yellow-400 bg-yellow-50' : 'hover:shadow-lg'}
							{isDisabled && verification.max_votes > 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
					>
						<div class="flex items-start gap-4">
							<!-- Selection indicator -->
							<div class="flex-shrink-0 mt-1">
								{#if verification.max_votes === 1}
									<!-- Radio style -->
									<div class="w-6 h-6 rounded-full border-2 flex items-center justify-center
										{isSelected ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'}">
										{#if isSelected}
											<div class="w-3 h-3 rounded-full bg-white"></div>
										{/if}
									</div>
								{:else}
									<!-- Checkbox style -->
									<div class="w-6 h-6 rounded border-2 flex items-center justify-center
										{isSelected ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'}">
										{#if isSelected}
											<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
											</svg>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Project info -->
							<div class="flex-grow">
								<h3 class="text-lg font-semibold text-gray-900">{pv.project.name}</h3>
								{#if pv.project.description}
									<p class="text-gray-600 mt-1">{pv.project.description}</p>
								{/if}
							</div>
						</div>
					</button>
				{/each}
			</div>

			<!-- Submit button -->
			<div class="bg-white shadow-lg rounded-xl p-6">
				<button
					type="button"
					onclick={handleSubmit}
					disabled={!canSubmit || isSubmitting}
					class="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-md"
				>
					{#if isSubmitting}
						<span class="inline-flex items-center justify-center gap-2">
							<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
								<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Submitting Vote...
						</span>
					{:else}
						Submit Vote
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>
