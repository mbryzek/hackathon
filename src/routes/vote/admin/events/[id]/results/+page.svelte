<script lang="ts">
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import { type ProjectTally } from '$lib/api/client';
  import { RESULTS_REFRESH_INTERVAL_MS } from '$lib/utils/constants';
  import { visibilityAwareInterval } from '$lib/utils/polling';
  import EventAdminTabs from '$lib/components/EventAdminTabs.svelte';
  import ErrorBanner from '$lib/components/ErrorBanner.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const eventId = $derived(page.params.id ?? '');
  const event = $derived(data.event);
  const results = $derived(data.results);
  const error = $derived(data.error);

  let isPresentationMode = $state(false);
  let autoRefresh = $state(false);

  // Refreshing means re-running the page's `load`, which fetches with the session id the server
  // holds; the browser never sees it. The effect's own teardown owns the timer — assigning to an
  // outer variable leaked an interval on every re-run, leaving two pollers on the endpoint.
  //
  // visibilityAwareInterval, not a bare setInterval: results are left up on a projector for the
  // length of an event, and an admin who switches tabs with auto-refresh on would otherwise keep
  // hitting the endpoint every 5s for hours with nobody looking at the answer.
  //
  // This effect reads `autoRefresh` and nothing else. That matters: the poll calls
  // `invalidateAll()`, which replaces `data` — if the effect read `data` (or anything derived from
  // it) the refresh would re-run the effect, which polls once immediately on start, and the page
  // would spin in a refresh loop instead of waiting out the interval.
  $effect(() => {
    if (!autoRefresh) {
      return;
    }

    return visibilityAwareInterval(() => invalidateAll(), RESULTS_REFRESH_INTERVAL_MS);
  });

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

  // Max votes for bar width (across both categories). A value, not a function: as
  // `$derived(() => …)` this was a getter that rescanned every project on each call, and
  // `getBarWidth` calls it once per bar — so a 40-project event walked the list 40 times per
  // render, and again on every 5s auto-refresh. `$derived` already caches, so the whole scan
  // now runs once per change to the tallies.
  const maxVotes = $derived(Math.max(...[...sortedStudentProjects, ...sortedParentProjects].map((p: ProjectTally) => p.vote_count), 1));

  function getBarWidth(voteCount: number): string {
    return `${(voteCount / maxVotes) * 100}%`;
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

  // Calculate rank with ties - tied teams share the same place
  // e.g., if two teams have 3 votes each, both get rank 1, next team gets rank 3
  function getRank(projects: ProjectTally[], index: number): number {
    if (index === 0) return 1;
    const current = projects[index];
    const previous = projects[index - 1];
    if (!current || !previous) return index + 1;
    if (current.vote_count === previous.vote_count) {
      // Same vote count as previous - share their rank
      return getRank(projects, index - 1);
    }
    // Different vote count - rank is position + 1
    return index + 1;
  }
</script>

<div class="animate-fade-in {isPresentationMode ? 'fixed inset-0 z-50 overflow-auto bg-gray-900' : ''}">
  {#if !isPresentationMode}
    <EventAdminTabs {eventId} eventName={event?.name} activeTab="results" />
  {/if}

  {#if error}
    <ErrorBanner {error} class="mb-6" />
  {/if}

  {#if results}
    <!-- Controls -->
    <div class="{isPresentationMode ? 'absolute right-4 top-4 z-10' : 'mb-6'} flex gap-4">
      <button
        type="button"
        onclick={togglePresentationMode}
        class="{isPresentationMode
          ? 'bg-white/10 text-white hover:bg-white/20'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {#if isPresentationMode}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          {:else}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            ></path>
          {/if}
        </svg>
        {isPresentationMode ? 'Exit' : 'Present'}
      </button>
      <label class="inline-flex items-center gap-2 {isPresentationMode ? 'text-white' : 'text-gray-700'}">
        <input type="checkbox" bind:checked={autoRefresh} class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400" />
        Auto-refresh
      </label>
    </div>

    <!-- Results display -->
    <div class={isPresentationMode ? 'p-8' : ''}>
      {#if isPresentationMode}
        <h1 class="mb-2 text-center text-5xl font-bold text-white">{event?.name}</h1>
        <p class="mb-8 text-center text-2xl text-gray-400">Voting Results</p>
      {/if}

      <!-- Vote counts by type -->
      <div class={isPresentationMode ? 'mb-12 flex justify-center gap-16' : 'mb-6 grid grid-cols-2 gap-4'}>
        <div class={isPresentationMode ? 'text-center' : 'rounded-xl bg-white p-6 text-center shadow'}>
          <div class={isPresentationMode ? 'text-5xl font-bold text-yellow-400' : 'text-3xl font-bold text-blue-600'}>
            {results.student.total_votes}
          </div>
          <div class={isPresentationMode ? 'text-xl text-gray-400' : 'text-gray-600'}>Student Votes</div>
        </div>
        <div class={isPresentationMode ? 'text-center' : 'rounded-xl bg-white p-6 text-center shadow'}>
          <div class={isPresentationMode ? 'text-5xl font-bold text-blue-400' : 'text-3xl font-bold text-purple-600'}>
            {results.parent.total_votes}
          </div>
          <div class={isPresentationMode ? 'text-xl text-gray-400' : 'text-gray-600'}>Parent Votes</div>
        </div>
      </div>

      <!-- Student Results -->
      <div class="mb-8">
        <h2 class={isPresentationMode ? 'mb-4 text-3xl font-bold text-white' : 'mb-4 text-xl font-bold text-gray-900'}>Student Votes</h2>
        {#if sortedStudentProjects.length === 0}
          <div
            class={isPresentationMode
              ? 'py-8 text-center text-xl text-white/60'
              : 'rounded-xl bg-white p-8 text-center text-gray-500 shadow'}
          >
            No student votes yet.
          </div>
        {:else}
          <div class="space-y-{isPresentationMode ? '6' : '4'}">
            {#each sortedStudentProjects as projectTally, index (projectTally.project.id)}
              {@const rank = getRank(sortedStudentProjects, index)}
              <div class={isPresentationMode ? 'rounded-xl bg-white/10 p-6 backdrop-blur' : 'rounded-xl bg-white p-6 shadow'}>
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold {getRankBadgeClass(
                      rank
                    )}"
                  >
                    {rank}
                  </div>
                  <div class="flex-grow">
                    <div class="mb-2 flex items-center justify-between">
                      <h3 class={isPresentationMode ? 'text-2xl font-bold text-white' : 'text-lg font-semibold text-gray-900'}>
                        {projectTally.project.name}
                      </h3>
                      <span class={isPresentationMode ? 'text-3xl font-bold text-yellow-400' : 'text-2xl font-bold text-gray-900'}>
                        {projectTally.vote_count}
                      </span>
                    </div>
                    <div class="{isPresentationMode ? 'h-4 bg-white/10' : 'h-3 bg-gray-100'} overflow-hidden rounded-full">
                      <div
                        class="h-full {rank === 1
                          ? 'bg-yellow-400'
                          : rank === 2
                            ? 'bg-gray-400'
                            : rank === 3
                              ? 'bg-amber-600'
                              : 'bg-gray-300'} rounded-full transition-all duration-500"
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
        <h2 class={isPresentationMode ? 'mb-4 text-3xl font-bold text-white' : 'mb-4 text-xl font-bold text-gray-900'}>Parent Votes</h2>
        {#if sortedParentProjects.length === 0}
          <div
            class={isPresentationMode
              ? 'py-8 text-center text-xl text-white/60'
              : 'rounded-xl bg-white p-8 text-center text-gray-500 shadow'}
          >
            No parent votes yet.
          </div>
        {:else}
          <div class="space-y-{isPresentationMode ? '6' : '4'}">
            {#each sortedParentProjects as projectTally, index (projectTally.project.id)}
              {@const rank = getRank(sortedParentProjects, index)}
              <div class={isPresentationMode ? 'rounded-xl bg-white/10 p-6 backdrop-blur' : 'rounded-xl bg-white p-6 shadow'}>
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold {getRankBadgeClass(
                      rank
                    )}"
                  >
                    {rank}
                  </div>
                  <div class="flex-grow">
                    <div class="mb-2 flex items-center justify-between">
                      <h3 class={isPresentationMode ? 'text-2xl font-bold text-white' : 'text-lg font-semibold text-gray-900'}>
                        {projectTally.project.name}
                      </h3>
                      <span class={isPresentationMode ? 'text-3xl font-bold text-blue-400' : 'text-2xl font-bold text-gray-900'}>
                        {projectTally.vote_count}
                      </span>
                    </div>
                    <div class="{isPresentationMode ? 'h-4 bg-white/10' : 'h-3 bg-gray-100'} overflow-hidden rounded-full">
                      <div
                        class="h-full {rank === 1
                          ? 'bg-blue-400'
                          : rank === 2
                            ? 'bg-gray-400'
                            : rank === 3
                              ? 'bg-amber-600'
                              : 'bg-gray-300'} rounded-full transition-all duration-500"
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
