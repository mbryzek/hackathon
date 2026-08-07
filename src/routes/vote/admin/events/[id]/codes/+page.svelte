<script lang="ts">
  import { navigating, page } from '$app/state';
  import { applyAction, enhance } from '$app/forms';
  import { FileType, VoterType } from '$lib/api/client';
  import { CODES_PAGE_SIZE, MAX_CODES_TO_GENERATE, SEARCH_DEBOUNCE_MS } from '$lib/utils/constants';
  import { VOTER_TYPE_OPTIONS, voterTypeBadgeClass, voterTypeLabel } from '$lib/utils/eventDisplay';
  import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const eventId = $derived(page.params.id ?? '');
  const error = $derived(form?.error ?? data.error);

  /** The overlay the rows sit under while the next set is being fetched — which, now that the
   * filters are in the URL, is exactly while a navigation is in flight. */
  const isSearching = $derived(navigating.to !== null);

  // Generate form
  let showGenerateForm = $state(false);
  let isGenerating = $state(false);

  // Delete / export in flight
  let deletingCodeId = $state<string | null>(null);
  let exportingFormat = $state<string | null>(null);

  /**
   * The filter form. Submitting it is a GET navigation, which SvelteKit handles client-side, so
   * this is also the whole no-JavaScript story: the same submit works with the router absent.
   * `offset` is deliberately not a field, so applying a filter always lands back on page one.
   */
  let filterForm = $state<HTMLFormElement | null>(null);

  /** What is in the search box right now — changes on every keystroke and fetches nothing. */
  // svelte-ignore state_referenced_locally
  let searchText = $state(data.q);

  /**
   * The query this box last asked the URL for. A navigation that lands on something else — back,
   * forward, a shared link — did not come from here, so the box is re-seeded to match what the
   * rows were actually fetched with. Our own searches land on exactly what was asked for and
   * leave the box alone, so a keystroke typed while one is still in flight is not undone.
   */
  // svelte-ignore state_referenced_locally
  let requestedQuery = data.q;

  $effect(() => {
    if (data.q !== requestedQuery) {
      requestedQuery = data.q;
      searchText = data.q;
    }
  });

  // Debounced search: keystrokes only move `searchText`, and the timer submits the filter form.
  let searchDebounce: ReturnType<typeof setTimeout> | undefined;

  function onSearchInput() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applySearch, SEARCH_DEBOUNCE_MS);
  }

  /** Applies what is typed, now, by submitting the form the debounce would have submitted. */
  function applySearch() {
    filterForm?.requestSubmit();
  }

  /** Every route into a search lands here — the debounce, the Search button, and Enter in the
   * box. Cancelling the pending debounce is what stops the latter two from firing a second,
   * identical navigation behind the one just asked for. */
  function onFilterSubmit() {
    clearTimeout(searchDebounce);
    requestedQuery = searchText.trim();
  }

  // A debounce still pending when the page goes away would submit a form that no longer exists.
  $effect(() => () => clearTimeout(searchDebounce));

  /** The current URL with a different offset — so paging keeps whatever filters are applied. */
  function pageHref(offset: number): string {
    const params = new URLSearchParams(page.url.search);
    if (offset > 0) {
      params.set('offset', String(offset));
    } else {
      params.delete('offset');
    }
    const query = params.toString();
    return query ? `?${query}` : page.url.pathname;
  }

  const hasVotedValue = $derived(data.hasVoted === undefined ? '' : String(data.hasVoted));
  const previousOffset = $derived(Math.max(0, data.offset - CODES_PAGE_SIZE));
  const nextOffset = $derived(data.offset + CODES_PAGE_SIZE);
</script>

<div class="animate-fade-in">
  <EventAdminTabs {eventId} eventName={data.event?.name} activeTab="codes" />

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
      {error}
    </div>
  {/if}

  <!-- Stats -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    <div class="bg-white shadow rounded-xl p-4 text-center">
      <div class="text-3xl font-bold text-gray-900">{data.summary?.total ?? 0}</div>
      <div class="text-sm text-gray-600">Total Codes</div>
    </div>
    <div class="bg-white shadow rounded-xl p-4 text-center">
      <div class="text-3xl font-bold text-blue-600">{data.summary?.student.codes ?? 0}</div>
      <div class="text-sm text-gray-600">Student Codes</div>
    </div>
    <div class="bg-white shadow rounded-xl p-4 text-center">
      <div class="text-3xl font-bold text-blue-600">{data.summary?.student.votes ?? 0}</div>
      <div class="text-sm text-gray-600">Student Votes</div>
    </div>
    <div class="bg-white shadow rounded-xl p-4 text-center">
      <div class="text-3xl font-bold text-purple-600">{data.summary?.parent.codes ?? 0}</div>
      <div class="text-sm text-gray-600">Parent Codes</div>
    </div>
    <div class="bg-white shadow rounded-xl p-4 text-center">
      <div class="text-3xl font-bold text-purple-600">{data.summary?.parent.votes ?? 0}</div>
      <div class="text-sm text-gray-600">Parent Votes</div>
    </div>
  </div>

  <!-- Generate codes form -->
  <div class="mb-6">
    {#if showGenerateForm}
      <div class="bg-white shadow rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Generate New Codes</h3>
        <form
          method="POST"
          action="?/generate"
          use:enhance={() => {
            isGenerating = true;
            return async ({ result, update }) => {
              await update();
              isGenerating = false;
              if (result.type === 'success') showGenerateForm = false;
            };
          }}
          class="space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="voter-type" class="block text-sm font-medium text-gray-700 mb-2"> Voter Type </label>
              <select
                id="voter-type"
                name="voter_type"
                value={VoterType.Student}
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
                name="count"
                value="10"
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
              disabled={isGenerating}
              class="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Codes'}
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

        <!--
          One form, two submit buttons: the button's own name/value picks the format, so the
          applied filters are carried once rather than duplicated per export. The action answers
          with a redirect to the signed, expiring file url; `window.location` follows it so the
          download starts without the router trying to treat an external url as a navigation.
        -->
        <form
          method="POST"
          action="?/export"
          class="flex flex-wrap gap-4"
          use:enhance={({ submitter }) => {
            exportingFormat = (submitter as HTMLButtonElement | null)?.value ?? null;
            return async ({ result }) => {
              exportingFormat = null;
              if (result.type === 'redirect') {
                window.location.href = result.location;
                return;
              }
              await applyAction(result);
            };
          }}
        >
          <input type="hidden" name="q" value={data.q} />
          <input type="hidden" name="voter_type" value={data.voterType ?? ''} />
          <input type="hidden" name="has_voted" value={hasVotedValue} />

          <button
            type="submit"
            name="format"
            value={FileType.Csv}
            disabled={exportingFormat !== null || (data.summary?.total ?? 0) === 0}
            class="inline-flex items-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if exportingFormat === FileType.Csv}
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
            type="submit"
            name="format"
            value={FileType.Pdf}
            disabled={exportingFormat !== null || (data.summary?.total ?? 0) === 0}
            class="inline-flex items-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Print cards for distribution"
          >
            {#if exportingFormat === FileType.Pdf}
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
        </form>
      </div>
    {/if}
  </div>

  <!-- Filters -->
  <div class="bg-white shadow rounded-xl p-4 mb-6">
    <form
      method="GET"
      bind:this={filterForm}
      onsubmit={onFilterSubmit}
      data-sveltekit-keepfocus
      data-sveltekit-replacestate
      data-sveltekit-noscroll
      class="flex flex-wrap gap-4 items-end"
    >
      <div class="flex-1 min-w-48">
        <label for="filter-search" class="block text-sm font-medium text-gray-700 mb-2"> Search </label>
        <input
          type="text"
          id="filter-search"
          name="q"
          bind:value={searchText}
          oninput={onSearchInput}
          placeholder="Search codes..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
        />
      </div>
      <div>
        <label for="filter-type" class="block text-sm font-medium text-gray-700 mb-2"> Voter Type </label>
        <select
          id="filter-type"
          name="voter_type"
          value={data.voterType ?? ''}
          onchange={() => filterForm?.requestSubmit()}
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
          name="has_voted"
          value={hasVotedValue}
          onchange={() => filterForm?.requestSubmit()}
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
        >
          <option value="">All</option>
          <option value="true">Used</option>
          <option value="false">Unused</option>
        </select>
      </div>
      <button type="submit" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors">
        Search
      </button>
    </form>
  </div>

  <!-- Codes list -->
  <div class="relative">
    {#if isSearching}
      <div class="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
        <Spinner size="lg" label="Searching" class="text-gray-600" />
      </div>
    {/if}
    {#if data.codes.length === 0}
      <div class="bg-white shadow rounded-xl p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          ></path>
        </svg>
        {#if data.offset > 0}
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No codes on this page</h3>
          <p class="text-gray-600 mb-6">Codes may have been deleted while you were paging.</p>
          <a
            href={pageHref(previousOffset)}
            class="inline-block px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Previous page
          </a>
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
              {#each data.codes as code (code.id)}
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
                    <form
                      method="POST"
                      action="?/delete"
                      class="inline"
                      use:enhance={() => {
                        deletingCodeId = code.id;
                        return async ({ update }) => {
                          await update();
                          deletingCodeId = null;
                        };
                      }}
                    >
                      <input type="hidden" name="id" value={code.id} />
                      <button
                        type="submit"
                        disabled={deletingCodeId === code.id || code.has_voted}
                        class="text-red-600 hover:text-red-700 p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={code.has_voted ? 'Cannot delete used code' : 'Delete'}
                        aria-label="Delete code {code.code}"
                      >
                        {#if deletingCodeId === code.id}
                          <Spinner />
                        {:else}
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        {/if}
                      </button>
                    </form>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Showing {data.offset + 1} - {data.offset + data.codes.length}
          </div>
          <div class="flex gap-2">
            {#if data.offset > 0}
              <a
                href={pageHref(previousOffset)}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </a>
            {:else}
              <span class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg opacity-50">Previous</span
              >
            {/if}
            {#if data.hasMore}
              <a
                href={pageHref(nextOffset)}
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Next
              </a>
            {:else}
              <span class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg opacity-50">Next</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
