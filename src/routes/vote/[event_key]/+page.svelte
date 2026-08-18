<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { urls } from '$lib/urls';
  import { voteApi, VoterType, type Vote } from '$lib/api/client';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const eventKey = $derived(page.params.event_key ?? '');

  // Get initial code from URL (only read once on mount)
  const initialCode = page.url.searchParams.get('code') || '';

  let code = $state(initialCode);
  let verification = $state<Vote | null>(null);
  let selectedProjectIds = $state<Set<string>>(new Set());
  let error = $state<string | null>(null);
  let isVerifying = $state(false);
  let isSubmitting = $state(false);
  let codeVerified = $state(false);

  // Auto-verify code if provided in URL
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

  const canSubmit = $derived(verification && selectedProjectIds.size > 0 && selectedProjectIds.size <= (verification?.max_votes || 0));

  // Keyed by the generated enum rather than a bare 'student' string: a voter_type the UI
  // does not know about used to silently render as "Parent/Guest".
  const VOTER_TYPE_LABELS: Record<VoterType, string> = {
    [VoterType.Student]: 'Student',
    [VoterType.Parent]: 'Parent/Guest'
  };

  const voterTypeLabel = $derived(verification ? VOTER_TYPE_LABELS[verification.voter_type] : '');

  const voteInstructions = $derived(
    verification?.max_votes === 1 ? 'Select 1 project' : `Select up to ${verification?.max_votes} projects`
  );

  // One vote is a radio group (picking one un-picks the other); several votes are independent
  // checkboxes. Rendering the matching native input is what makes handleProjectSelect's two
  // branches audible — the browser announces the role, the group and "3 of 5", and gives radios
  // arrow-key navigation, none of which a <button aria-pressed> conveys.
  const inputType = $derived(verification?.max_votes === 1 ? 'radio' : 'checkbox');

  const eventName = $derived(verification?.event.name ?? data.event?.name ?? 'Project Voting');

  let ballotHeading = $state<HTMLElement | null>(null);

  // Verifying swaps the whole code-entry form — including the button that had focus — for the
  // ballot. That is an in-page content swap, not a navigation, so SvelteKit's focus reset does
  // not apply and focus falls back to <body>: a keyboard or screen-reader voter is given no
  // indication that a new screen appeared and has to re-explore from the top of the document.
  $effect(() => {
    if (codeVerified && ballotHeading) {
      ballotHeading.focus();
    }
  });
</script>

<svelte:head>
  <title>{eventName} - Vote - Bergen Tech Hackathon</title>
</svelte:head>

<div class="animate-fade-in">
  {#if !codeVerified}
    <!-- Code entry form -->
    <div class="mx-auto max-w-md rounded-xl bg-white p-8 shadow-lg">
      <div class="mb-8 text-center">
        <h1 class="mb-2 text-2xl font-bold text-gray-900">Enter your code</h1>
      </div>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          verifyCode();
        }}
        class="space-y-6"
      >
        <div>
          <label for="code" class="sr-only">Voting code</label>
          <input
            type="text"
            id="code"
            value={code}
            oninput={handleCodeInput}
            placeholder="AB1234"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-2xl tracking-widest transition-colors focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            autocomplete="off"
            disabled={isVerifying}
          />
        </div>

        {#if error}
          <ErrorBanner {error} class="text-center" />
        {/if}

        <button
          type="submit"
          disabled={isVerifying}
          class="w-full rounded-lg bg-yellow-400 px-6 py-4 text-lg font-bold text-gray-900 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if isVerifying}
            <span class="inline-flex items-center justify-center gap-2">
              <Spinner />
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
      <div class="rounded-xl bg-white p-6 shadow-lg">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <!-- tabindex="-1" so focus can be moved here when the ballot replaces the code form.
                 It is not a tab stop; -1 only makes it programmatically focusable. -->
            <h1 class="text-2xl font-bold text-gray-900 focus:outline-none" bind:this={ballotHeading} tabindex="-1">
              {verification.event.name}
            </h1>
            <p class="mt-1 text-gray-600">
              Voting as: <span class="font-semibold">{voterTypeLabel}</span>
            </p>
          </div>
          <div class="rounded-lg bg-yellow-100 px-4 py-2 text-center text-yellow-800">
            <!-- The same string is also the ballot's <legend>, so a bare text match now finds two
                 elements. The testid names the visible badge specifically. -->
            <span class="font-semibold" data-testid="vote-instructions">{voteInstructions}</span>
            <br />
            <span class="text-sm">
              {selectedProjectIds.size} of {verification.max_votes}
              selected
            </span>
          </div>
        </div>
      </div>

      {#if error}
        <ErrorBanner {error} />
      {/if}

      <!-- Projects list. A <fieldset> named by its <legend> is the native form of the grouping
           `role="group"` used to assert by hand, and the inputs inside it carry the rest: the
           browser announces "radio"/"checkbox", checked state, and position within the group, and
           gives a radio group arrow-key navigation. That is the whole reason there is no ARIA left
           on this list — the semantics are now the markup rather than a claim layered over it.
           The visible card is the sibling of a visually hidden input, so `peer-focus-visible`
           is what draws the keyboard focus ring; the input's own ring would be 1px and unseeable.
           `min-w-0` overrides the UA's `min-inline-size: min-content` on a fieldset, so a long
           project name cannot push the ballot wider than its container on a phone. -->
      <fieldset class="min-w-0">
        <legend class="sr-only">{voteInstructions}</legend>
        <div class="space-y-4">
          {#each verification.projects as pv (pv.project.id)}
            {@const isSelected = selectedProjectIds.has(pv.project.id)}
            {@const isDisabled = verification.max_votes > 1 && !isSelected && selectedProjectIds.size >= verification.max_votes}
            <!-- `relative` is load-bearing, not cosmetic: `sr-only` positions the input absolutely,
                 so without it the input is placed against whatever distant ancestor happens to be
                 positioned, and the browser scrolling the focused control into view jumps somewhere
                 other than the card the voter is on. Scoping it to the label keeps the two together. -->
            <label class="relative block {isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}">
              <input
                class="peer sr-only"
                type={inputType}
                name="project-vote"
                value={pv.project.id}
                checked={isSelected}
                disabled={isDisabled}
                onchange={() => handleProjectSelect(pv.project.id)}
              />
              <!-- Everything under the <label> is a <span>, not the <div>/<h3>/<p> the card used as
                   a <button>: a label may only contain phrasing content. The project name stops
                   being an <h3> for the same reason, and loses nothing — it is now the accessible
                   name of the control itself, which is a better landmark than a heading was. -->
              <span
                class="block rounded-xl bg-white p-6 shadow transition-all duration-200
							peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 peer-focus-visible:ring-offset-2
							{isSelected ? 'bg-yellow-50 ring-2 ring-yellow-400' : 'hover:shadow-lg'}
							{isDisabled ? 'opacity-50' : ''}"
              >
                <span class="flex items-start gap-4">
                  <!-- Selection indicator. aria-hidden: the input already announces checked state,
                       so exposing this too would say it twice. -->
                  <span class="mt-1 flex-shrink-0" aria-hidden="true">
                    {#if verification.max_votes === 1}
                      <!-- Radio style -->
                      <span
                        class="flex h-6 w-6 items-center justify-center rounded-full border-2
											{isSelected ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'}"
                      >
                        {#if isSelected}
                          <span class="block h-3 w-3 rounded-full bg-white"></span>
                        {/if}
                      </span>
                    {:else}
                      <!-- Checkbox style -->
                      <span
                        class="flex h-6 w-6 items-center justify-center rounded border-2
											{isSelected ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'}"
                      >
                        {#if isSelected}
                          <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        {/if}
                      </span>
                    {/if}
                  </span>

                  <!-- Project info -->
                  <span class="flex-grow">
                    <span class="block text-lg font-semibold text-gray-900">
                      {pv.project.name}
                    </span>
                    {#if pv.project.description}
                      <span class="mt-1 block text-gray-600">
                        {pv.project.description}
                      </span>
                    {/if}
                  </span>
                </span>
              </span>
            </label>
          {/each}
        </div>
      </fieldset>

      <!-- Submit button -->
      <div class="rounded-xl bg-white p-6 shadow-lg">
        <button
          type="button"
          onclick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          class="w-full rounded-lg bg-yellow-400 px-6 py-4 text-lg font-bold text-gray-900 shadow-md transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if isSubmitting}
            <span class="inline-flex items-center justify-center gap-2">
              <Spinner />
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
