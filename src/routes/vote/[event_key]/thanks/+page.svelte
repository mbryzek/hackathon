<script lang="ts">
  import Spinner from '$lib/components/Spinner.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { urls } from '$lib/urls';
  import { voteApi, VoterType, type Project } from '$lib/api/client';

  const ORGANIZER_FORM_URL = 'https://forms.gle/zh6AKeEaa415QdTp8';
  const DONATION_URL = 'https://donorbox.org/2026-bt-hackathon';

  const eventKey = $derived(page.params.event_key ?? '');
  const code = $derived(page.url.searchParams.get('code') || '');
  const changeVoteUrl = $derived(code ? `${urls.voteEvent(eventKey)}?code=${encodeURIComponent(code)}` : urls.voteEvent(eventKey));

  let selectedProjects = $state<Project[]>([]);
  let voterType = $state<VoterType | null>(null);
  let isLoading = $state(true);

  const isParent = $derived(voterType === VoterType.Parent);

  onMount(async () => {
    if (code && eventKey) {
      const response = await voteApi.verifyCode(eventKey, code);
      if (response.data) {
        voterType = response.data.voter_type;
        selectedProjects = response.data.projects.filter((pv) => pv.selected).map((pv) => pv.project);
      }
    }
    isLoading = false;
  });
</script>

<div class="animate-fade-in">
  <div class="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
    <!-- Success icon -->
    <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
      <svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>

    <h1 class="mb-4 text-2xl font-bold text-gray-900">Thank You!</h1>

    <p class="mb-6 text-gray-600">Your vote has been recorded successfully.</p>

    {#if isLoading}
      <div class="mb-6 flex items-center justify-center py-4">
        <Spinner size="md" label="Loading" class="text-gray-400" />
      </div>
    {:else if selectedProjects.length > 0}
      <div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-left">
        <p class="mb-2 text-sm font-medium text-green-800">You voted for:</p>
        <ul class="space-y-1">
          {#each selectedProjects as project (project.id)}
            <li class="flex items-center gap-2 text-green-700">
              <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="font-medium">{project.name}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="mb-6 rounded-lg bg-gray-50 p-4">
      <p class="text-sm text-gray-500">Want to change your vote? You can update your selection as long as voting is still open.</p>
    </div>

    {#if isParent}
      <div class="mb-6 border-t border-gray-200 pt-6">
        <h2 class="mb-2 text-xl font-bold text-gray-900">We need your help for next year</h2>
        <p class="mb-5 text-gray-600">
          The hackathon only happens because parents step up. Please consider joining the organizing team for 2027 — or supporting this
          year's event with a donation.
        </p>

        <div class="space-y-3">
          <a
            href={ORGANIZER_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="organizer-cta"
            class="block w-full rounded-lg bg-yellow-400 px-6 py-3 font-bold text-gray-900 transition-colors hover:bg-yellow-500"
          >
            Learn more
            <span class="sr-only">(opens in a new tab)</span>
          </a>

          <a
            href={DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="donate-cta"
            class="block w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition-colors hover:bg-green-700"
          >
            Donate to support the hackathon
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    {/if}

    <div class="space-y-3">
      <a
        href={changeVoteUrl}
        class="block w-full rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
      >
        Change My Vote
      </a>

      <a
        href={urls.index}
        class="block w-full rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
      >
        Return to Hackathon Site
      </a>
    </div>
  </div>
</div>
