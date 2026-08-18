<script lang="ts">
  import { navigating, page } from '$app/state';
  import { applyAction, enhance } from '$app/forms';
  import { FileType, VoterType } from '$lib/api/client';
  import { CODES_PAGE_SIZE, MAX_CODES_TO_GENERATE, SEARCH_DEBOUNCE_MS } from '$lib/utils/constants';
  import { VOTER_TYPE_OPTIONS, voterTypeBadgeClass, voterTypeLabel } from '$lib/utils/eventDisplay';
  import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
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
    <ErrorBanner {error} class="mb-6" />
  {/if}

  <!-- Stats -->
  <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
    <div class="rounded-xl bg-white p-4 text-center shadow">
      <div class="text-3xl font-bold text-gray-900">{data.summary?.total ?? 0}</div>
      <div class="text-sm text-gray-600">Total Codes</div>
    </div>
    <div class="rounded-xl bg-white p-4 text-center shadow">
      <div class="text-3xl font-bold text-blue-600">{data.summary?.student.codes ?? 0}</div>
      <div class="text-sm text-gray-600">Student Codes</div>
    </div>
    <div class="rounded-xl bg-white p-4 text-center shadow">
      <div class="text-3xl font-bold text-blue-600">{data.summary?.student.votes ?? 0}</div>
      <div class="text-sm text-gray-600">Student Votes</div>
    </div>
    <div class="rounded-xl bg-white p-4 text-center shadow">
      <div class="text-3xl font-bold text-purple-600">{data.summary?.parent.codes ?? 0}</div>
      <div class="text-sm text-gray-600">Parent Codes</div>
    </div>
    <div class="rounded-xl bg-white p-4 text-center shadow">
      <div class="text-3xl font-bold text-purple-600">{data.summary?.parent.votes ?? 0}</div>
      <div class="text-sm text-gray-600">Parent Votes</div>
    </div>
  </div>

  <!-- Generate codes form -->
  <div class="mb-6">
    {#if showGenerateForm}
      <div class="rounded-xl bg-white p-6 shadow">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">Generate New Codes</h3>
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
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label for="voter-type" class="mb-2 block text-sm font-medium text-gray-700"> Voter Type </label>
              <select
                id="voter-type"
                name="voter_type"
                value={VoterType.Student}
                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
                disabled={isGenerating}
              >
                {#each VOTER_TYPE_OPTIONS as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="count" class="mb-2 block text-sm font-medium text-gray-700"> Number of Codes </label>
              <input
                type="number"
                id="count"
                name="count"
                value="10"
                min="1"
                max={MAX_CODES_TO_GENERATE}
                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
                disabled={isGenerating}
              />
            </div>
          </div>
          <div class="flex gap-3">
            <button
              type="submit"
              disabled={isGenerating}
              class="rounded-lg bg-yellow-400 px-4 py-2 font-bold text-gray-900 transition-colors hover:bg-yellow-500 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Codes'}
            </button>
            <button
              type="button"
              onclick={() => (showGenerateForm = false)}
              class="px-4 py-2 text-gray-600 transition-colors hover:text-gray-900"
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
          class="inline-flex items-center rounded-lg bg-yellow-400 px-6 py-3 font-bold text-gray-900 transition-colors hover:bg-yellow-500"
        >
          <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {#if exportingFormat === FileType.Csv}
              <Spinner class="mr-2" />
              Exporting...
            {:else}
              <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Print cards for distribution"
          >
            {#if exportingFormat === FileType.Pdf}
              <Spinner class="mr-2" />
              Exporting...
            {:else}
              <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  <div class="mb-6 rounded-xl bg-white p-4 shadow">
    <form
      method="GET"
      bind:this={filterForm}
      onsubmit={onFilterSubmit}
      data-sveltekit-keepfocus
      data-sveltekit-replacestate
      data-sveltekit-noscroll
      class="flex flex-wrap items-end gap-4"
    >
      <div class="min-w-48 flex-1">
        <label for="filter-search" class="mb-2 block text-sm font-medium text-gray-700"> Search </label>
        <input
          type="text"
          id="filter-search"
          name="q"
          bind:value={searchText}
          oninput={onSearchInput}
          placeholder="Search codes..."
          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
        />
      </div>
      <div>
        <label for="filter-type" class="mb-2 block text-sm font-medium text-gray-700"> Voter Type </label>
        <select
          id="filter-type"
          name="voter_type"
          value={data.voterType ?? ''}
          onchange={() => filterForm?.requestSubmit()}
          class="rounded-lg border border-gray-300 px-4 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">All</option>
          {#each VOTER_TYPE_OPTIONS as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="filter-voted" class="mb-2 block text-sm font-medium text-gray-700"> Status </label>
        <select
          id="filter-voted"
          name="has_voted"
          value={hasVotedValue}
          onchange={() => filterForm?.requestSubmit()}
          class="rounded-lg border border-gray-300 px-4 py-2 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">All</option>
          <option value="true">Used</option>
          <option value="false">Unused</option>
        </select>
      </div>
      <button type="submit" class="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300">
        Search
      </button>
    </form>
  </div>

  <!-- Codes list -->
  <div class="relative">
    {#if isSearching}
      <div class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70">
        <Spinner size="lg" label="Searching" class="text-gray-600" />
      </div>
    {/if}
    {#if data.codes.length === 0}
      <div class="rounded-xl bg-white p-12 text-center shadow">
        <svg class="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          ></path>
        </svg>
        {#if data.offset > 0}
          <h3 class="mb-2 text-lg font-semibold text-gray-900">No codes on this page</h3>
          <p class="mb-6 text-gray-600">Codes may have been deleted while you were paging.</p>
          <a
            href={pageHref(previousOffset)}
            class="inline-block rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Previous page
          </a>
        {:else}
          <h3 class="mb-2 text-lg font-semibold text-gray-900">No codes yet</h3>
          <p class="text-gray-600">Generate codes for voters to use.</p>
        {/if}
      </div>
    {:else}
      <div class="overflow-hidden rounded-xl bg-white shadow">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Code </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Type </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"> Status </th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"> Actions </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {#each data.codes as code (code.id)}
                <tr class="transition-colors hover:bg-gray-50">
                  <td class="whitespace-nowrap px-6 py-4">
                    <code class="font-mono text-lg font-bold tracking-widest">{code.code}</code>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    <span class="rounded-full px-2 py-1 text-xs font-medium {voterTypeBadgeClass(code.voter_type)}">
                      {voterTypeLabel(code.voter_type)}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    {#if code.has_voted}
                      <span class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"> Voted </span>
                    {:else}
                      <span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"> Unused </span>
                    {/if}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-right">
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
                        class="p-2 text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        title={code.has_voted ? 'Cannot delete used code' : 'Delete'}
                        aria-label="Delete code {code.code}"
                      >
                        {#if deletingCodeId === code.id}
                          <Spinner />
                        {:else}
                          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
        <div class="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div class="text-sm text-gray-600">
            Showing {data.offset + 1} - {data.offset + data.codes.length}
          </div>
          <div class="flex gap-2">
            {#if data.offset > 0}
              <a
                href={pageHref(previousOffset)}
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Previous
              </a>
            {:else}
              <span class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 opacity-50">Previous</span
              >
            {/if}
            {#if data.hasMore}
              <a
                href={pageHref(nextOffset)}
                class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Next
              </a>
            {:else}
              <span class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 opacity-50">Next</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
