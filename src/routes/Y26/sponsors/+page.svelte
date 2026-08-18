<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import { sponsorsY26 } from '$lib/data/sponsors-y26';

  const leadSponsors = $derived(sponsorsY26.filter((s) => s.isLead));
  const otherSponsors = $derived(sponsorsY26.filter((s) => !s.isLead));
</script>

{#snippet sponsorCard(sponsor: (typeof sponsorsY26)[number], isLead: boolean)}
  {@const sizeClass = isLead ? 'h-64 sm:h-72' : 'h-32 sm:h-40'}
  {@const baseClass = `bg-white rounded-xl shadow-sm border border-gray-100 ${sizeClass}`}
  {#if sponsor.url}
    <a
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      class="{baseClass} block transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
    >
      <img src={sponsor.logo} alt={sponsor.name} class="h-full w-full object-contain p-4" />
    </a>
  {:else}
    <div class={baseClass}>
      <img src={sponsor.logo} alt={sponsor.name} class="h-full w-full object-contain p-4" />
    </div>
  {/if}
{/snippet}

<Shell title="2026 Sponsors">
  <p class="mb-8 font-light text-gray-800">A huge thank you to our sponsors who make the 2026 Hackathon possible!</p>

  {#if leadSponsors.length > 0}
    <div class="mb-10">
      <h2 class="mb-4 text-center text-lg font-semibold uppercase tracking-wide text-gray-600">Lead Sponsor</h2>
      <div class="flex justify-center">
        {#each leadSponsors as sponsor}
          <div class="w-full max-w-md">
            {@render sponsorCard(sponsor, true)}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if otherSponsors.length > 0}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4">
      {#each otherSponsors as sponsor}
        {@render sponsorCard(sponsor, false)}
      {/each}
    </div>
  {/if}
</Shell>
