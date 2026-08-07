<script lang="ts">
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import { EXPIRED_SESSION_MESSAGE, redirectIfUnauthorized } from '$lib/utils/adminSession';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { adminApi, type VoteEvent, type Code, type CodeSummary, FileType, VoterType } from '$lib/api/client';
  import { MAX_CODES_TO_GENERATE, SEARCH_DEBOUNCE_MS } from '$lib/utils/constants';
  import { VOTER_TYPE_OPTIONS, voterTypeBadgeClass, voterTypeLabel } from '$lib/utils/eventDisplay';
  import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const eventId = $derived(page.params.id ?? '');

  // Get session ID from server-provided data
  const sessionId = $derived(data.adminSession?.id);

  let event = $state<VoteEvent | null>(null);
  let codes = $state<Code[]>([]);
  let summary = $state<CodeSummary | null>(null);
  let error = $state<string | null>(null);
  // The page spinner covers both first loads: the event/summary header and the first page of codes.
  // Without the codes half, the "No codes yet" empty state flashes before the first rows land.
  let eventLoaded = $state(false);
  let codesLoaded = $state(false);
  const isLoading = $derived(!eventLoaded || !codesLoaded);
  let isSearching = $state(false);

  // Generate form
  let showGenerateForm = $state(false);
  let generateVoterType = $state<VoterType>(VoterType.Student);
  let generateCount = $state(10);
  let isGenerating = $state(false);

  // Filters
  let filterVoterType = $state<VoterType | ''>('');
  let filterHasVoted = $state<boolean | ''>('');
  /** What is in the search box right now — changes on every keystroke and fetches nothing. */
  let searchText = $state('');
  /** The query the codes on screen were fetched with, and the one an export matches. Only the
   * debounce (or Enter / the Search button) applies a new one, so a burst of typing is one fetch. */
  let filterQuery = $state('');

  // Pagination
  let currentOffset = $state(0);
  let hasMoreCodes = $state(false);
  const PAGE_SIZE = 50;

  /** Bumped to ask for the same page again — the refetches that no change to a filter or the
   * offset implies: a generate, a delete, and the Search button pressed on unchanged filters. */
  let reloadNonce = $state(0);

  /** Identifies the newest in-flight request. A response whose id is no longer the latest belongs
   * to a request that a newer one has overtaken, and is dropped rather than painted — otherwise a
   * slow earlier page repaints rows the admin has already moved off. Deliberately not `$state`:
   * nothing renders it, and it must not become a reactive dependency of anything. */
  let latestRequestId = 0;

  // Delete
  let deletingCodeId = $state<string | null>(null);

  // Export
  let isExporting = $state(false);
  let isExportingPdf = $state(false);

  // Debounced search: keystrokes only move `searchText`, and the timer applies it to `filterQuery`,
  // which is what the effect below fetches on.
  let searchDebounce: ReturnType<typeof setTimeout> | undefined;

  function onSearchInput() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applySearch, SEARCH_DEBOUNCE_MS);
  }

  /** Applies what is typed, now. Cancelling the pending debounce is what stops Enter and the Search
   * button from firing a second, identical request behind the one they just asked for. The nonce
   * makes Search on unchanged filters still refetch, and because Svelte batches these three writes
   * into one effect run, a changed query costs one request rather than two. */
  function applySearch() {
    clearTimeout(searchDebounce);
    filterQuery = searchText;
    currentOffset = 0;
    reloadNonce += 1;
  }

  onMount(() => {
    if (!sessionId) {
      eventLoaded = true;
      codesLoaded = true;
      error = EXPIRED_SESSION_MESSAGE;
      return;
    }

    void loadData();
  });

  // A debounce still pending when the page goes away would apply a query to a destroyed component.
  $effect(() => () => clearTimeout(searchDebounce));

  // The only thing that fetches codes. Handlers change state and stop there; they used to call
  // `loadCodes()` themselves as well, which is how a search could go out twice.
  $effect(() => {
    void reloadNonce; // read so a generate, a delete or Search can ask for the same page again
    const session = sessionId;
    if (!session) {
      codesLoaded = true;
      return;
    }
    void loadCodes({
      sessionId: session,
      eventId,
      voterType: filterVoterType,
      hasVoted: filterHasVoted,
      q: filterQuery.trim(),
      offset: currentOffset
    });
  });

  async function loadData() {
    if (!sessionId) return;

    error = null;

    // Load event and summary in parallel
    const [eventResponse, summaryResponse] = await Promise.all([
      adminApi.getEvent(sessionId, eventId),
      adminApi.getCodeSummary(sessionId, eventId)
    ]);

    eventLoaded = true;

    if (eventResponse.errors) {
      if (await redirectIfUnauthorized(eventResponse)) return;
      error = eventResponse.errors[0]?.message || 'Failed to load event';
      return;
    }

    event = eventResponse.data || null;
    summary = summaryResponse.data || null;
  }

  /** Everything a codes fetch depends on, captured when the effect decided to run. Passing it in
   * rather than reading the state inside `loadCodes` keeps the effect's dependency set explicit,
   * instead of it being whatever state `loadCodes` happened to read before its first `await`. */
  type CodesRequest = {
    sessionId: string;
    eventId: string;
    voterType: VoterType | '';
    hasVoted: boolean | '';
    q: string;
    offset: number;
  };

  async function loadCodes(request: CodesRequest) {
    const requestId = ++latestRequestId;

    // A stale banner from an earlier failed search must not survive a successful one.
    error = null;
    isSearching = true;

    const params: { voter_type?: VoterType; has_voted?: boolean; q?: string; limit?: number; offset?: number } = {
      limit: PAGE_SIZE + 1, // Fetch one extra to check if there are more
      offset: request.offset
    };
    if (request.voterType) params.voter_type = request.voterType;
    if (request.hasVoted !== '') params.has_voted = request.hasVoted;
    if (request.q) params.q = request.q;

    const codesResponse = await adminApi.getCodes(request.sessionId, request.eventId, params);

    // A superseded response paints nothing, raises no banner, and leaves the spinner alone: the
    // request that overtook it is still running and owns all three.
    if (requestId !== latestRequestId) return;

    codesLoaded = true;
    isSearching = false;

    if (codesResponse.errors) {
      if (await redirectIfUnauthorized(codesResponse)) return;
      error = codesResponse.errors[0]?.message || 'Failed to load codes';
      return;
    }

    const batch = codesResponse.data || [];

    // Check if there are more codes
    if (batch.length > PAGE_SIZE) {
      hasMoreCodes = true;
      codes = batch.slice(0, PAGE_SIZE);
    } else {
      hasMoreCodes = false;
      codes = batch;
    }
  }

  function nextPage() {
    currentOffset += PAGE_SIZE;
  }

  function prevPage() {
    currentOffset = Math.max(0, currentOffset - PAGE_SIZE);
  }

  function resetPagination() {
    currentOffset = 0;
  }

  async function handleGenerateCodes(evt: SubmitEvent) {
    evt.preventDefault();
    if (!sessionId) return;

    isGenerating = true;
    error = null;

    const response = await adminApi.generateCodes(sessionId, eventId, {
      voter_type: generateVoterType,
      count: generateCount
    });

    isGenerating = false;

    if (response.errors) {
      error = response.errors[0]?.message || 'Failed to generate codes';
      return;
    }

    showGenerateForm = false;
    // Reload summary and codes
    const summaryResponse = await adminApi.getCodeSummary(sessionId, eventId);
    summary = summaryResponse.data || null;
    reloadNonce += 1;
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

    // Refetch the page rather than splicing locally: dropping the row left the page one
    // short and kept `hasMoreCodes`/the offset pointing past the code that shifted up,
    // so the next page skipped an entry.
    const summaryResponse = await adminApi.getCodeSummary(sessionId, eventId);
    summary = summaryResponse.data || null;
    reloadNonce += 1;
  }

  /**
   * The server builds the export, stores it, and returns a file whose `url` is signed and
   * expiring — so the browser follows it directly with no credentials attached, and the
   * filename comes from the stored file rather than being guessed here.
   */
  async function exportCodes(format: FileType, failureMessage: string) {
    if (!sessionId) return;

    error = null;

    const response = await adminApi.exportCodes(sessionId, eventId, {
      format,
      voter_type: filterVoterType || undefined,
      has_voted: filterHasVoted === '' ? undefined : filterHasVoted,
      q: filterQuery.trim() || undefined
    });

    if (response.errors || !response.data) {
      if (await redirectIfUnauthorized(response)) return;
      error = response.errors?.[0]?.message || failureMessage;
      return;
    }

    window.location.href = response.data.url;
  }

  async function exportCsv() {
    isExporting = true;
    try {
      await exportCodes(FileType.Csv, 'Failed to export codes');
    } finally {
      isExporting = false;
    }
  }

  async function exportPdf() {
    isExportingPdf = true;
    try {
      await exportCodes(FileType.Pdf, 'Failed to export PDF');
    } finally {
      isExportingPdf = false;
    }
  }
</script>

<div class="animate-fade-in">
  <EventAdminTabs {eventId} eventName={event?.name} activeTab="codes" />

  {#if error}
    <ErrorBanner message={error} class="mb-6" />
  {/if}

  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <Spinner size="lg" label="Loading" class="text-gray-600" />
    </div>
  {:else}
    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white shadow rounded-xl p-4 text-center">
        <div class="text-3xl font-bold text-gray-900">{summary?.total ?? 0}</div>
        <div class="text-sm text-gray-600">Total Codes</div>
      </div>
      <div class="bg-white shadow rounded-xl p-4 text-center">
        <div class="text-3xl font-bold text-blue-600">{summary?.student.codes ?? 0}</div>
        <div class="text-sm text-gray-600">Student Codes</div>
      </div>
      <div class="bg-white shadow rounded-xl p-4 text-center">
        <div class="text-3xl font-bold text-blue-600">{summary?.student.votes ?? 0}</div>
        <div class="text-sm text-gray-600">Student Votes</div>
      </div>
      <div class="bg-white shadow rounded-xl p-4 text-center">
        <div class="text-3xl font-bold text-purple-600">{summary?.parent.codes ?? 0}</div>
        <div class="text-sm text-gray-600">Parent Codes</div>
      </div>
      <div class="bg-white shadow rounded-xl p-4 text-center">
        <div class="text-3xl font-bold text-purple-600">{summary?.parent.votes ?? 0}</div>
        <div class="text-sm text-gray-600">Parent Votes</div>
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
                <label for="voter-type" class="block text-sm font-medium text-gray-700 mb-2"> Voter Type </label>
                <select
                  id="voter-type"
                  bind:value={generateVoterType}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  disabled={isGenerating}
                >
                  {#each VOTER_TYPE_OPTIONS as option (option.value)}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </div>
              <div>
                <label for="count" class="block text-sm font-medium text-gray-700 mb-2"> Number of Codes </label>
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
                onclick={() => (showGenerateForm = false)}
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
            onclick={() => (showGenerateForm = true)}
            class="inline-flex items-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Generate Codes
          </button>
          <button
            type="button"
            onclick={exportCsv}
            disabled={isExporting || (summary?.total ?? 0) === 0}
            class="inline-flex items-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isExporting}
              <Spinner class="mr-2" />
              Exporting...
            {:else}
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Export CSV
            {/if}
          </button>
          <button
            type="button"
            onclick={exportPdf}
            disabled={isExportingPdf || (summary?.total ?? 0) === 0}
            class="inline-flex items-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Print cards for distribution"
          >
            {#if isExportingPdf}
              <Spinner class="mr-2" />
              Exporting...
            {:else}
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                ></path>
              </svg>
              Print Cards
            {/if}
          </button>
        </div>
      {/if}
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-xl p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-48">
          <label for="filter-search" class="block text-sm font-medium text-gray-700 mb-2"> Search </label>
          <input
            type="text"
            id="filter-search"
            bind:value={searchText}
            oninput={onSearchInput}
            onkeydown={(e) => e.key === 'Enter' && applySearch()}
            placeholder="Search codes..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          />
        </div>
        <div>
          <label for="filter-type" class="block text-sm font-medium text-gray-700 mb-2"> Voter Type </label>
          <select
            id="filter-type"
            bind:value={filterVoterType}
            onchange={() => resetPagination()}
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          >
            <option value="">All</option>
            {#each VOTER_TYPE_OPTIONS as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="filter-voted" class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
          <select
            id="filter-voted"
            bind:value={filterHasVoted}
            onchange={() => resetPagination()}
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          >
            <option value="">All</option>
            <option value={true}>Used</option>
            <option value={false}>Unused</option>
          </select>
        </div>
        <button
          type="button"
          onclick={applySearch}
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
        >
          Search
        </button>
      </div>
    </div>

    <!-- Codes list -->
    <div class="relative">
      {#if isSearching}
        <div class="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
          <Spinner size="lg" label="Searching" class="text-gray-600" />
        </div>
      {/if}
      {#if codes.length === 0}
        <div class="bg-white shadow rounded-xl p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            ></path>
          </svg>
          {#if currentOffset > 0}
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No codes on this page</h3>
            <p class="text-gray-600 mb-6">Codes may have been deleted while you were paging.</p>
            <button
              type="button"
              onclick={prevPage}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Previous page
            </button>
          {:else}
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No codes yet</h3>
            <p class="text-gray-600">Generate codes for voters to use.</p>
          {/if}
        </div>
      {:else}
        <div class="bg-white shadow rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Code </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Type </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Status </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"> Actions </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each codes as code (code.id)}
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <code class="text-lg font-mono font-bold tracking-widest">{code.code}</code>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs font-medium rounded-full {voterTypeBadgeClass(code.voter_type)}">
                        {voterTypeLabel(code.voter_type)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      {#if code.has_voted}
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"> Voted </span>
                      {:else}
                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"> Unused </span>
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
                          <Spinner />
                        {:else}
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        {/if}
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div class="text-sm text-gray-600">
              Showing {currentOffset + 1} - {currentOffset + codes.length}
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                onclick={prevPage}
                disabled={currentOffset === 0}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onclick={nextPage}
                disabled={!hasMoreCodes}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
