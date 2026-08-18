<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import Card from '$lib/components/Card.svelte';
  import { overallPrizes, additionalPrizes } from '$lib/data/prizes-y25';
</script>

<Shell title="2025 Prizes">
  <div class="mx-auto flex max-w-4xl flex-col gap-y-8">
    <!-- Introduction -->
    <p class="text-lg font-light text-gray-800">
      This year we are trying a new format for the awards - there will still be a ton of cash prizes across two broad themes and specific
      individual awards. As teams register, they must indicate their theme and any individual awards for which the team would like to be
      considered.
    </p>

    <!-- Overall Prizes Section -->
    <Card variant="elevated">
      {#snippet header()}
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-yellow-100 p-2">
            <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Overall Awards</h2>
        </div>
      {/snippet}

      <div class="grid gap-4 sm:grid-cols-2">
        {#each overallPrizes as prize}
          <div class="rounded-lg border-l-4 border-yellow-500 bg-gray-50 p-4 transition-colors duration-200 hover:bg-gray-100">
            <div class="mb-2 flex items-start justify-between gap-2">
              <h3 class="text-lg font-bold text-gray-900">{prize.title}</h3>
              <span class="inline-flex items-center whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                {prize.amount}
              </span>
            </div>
            <p class="text-sm text-gray-600">{prize.description}</p>
          </div>
        {/each}
      </div>
    </Card>

    <!-- Additional Awards Section -->
    <Card variant="elevated">
      {#snippet header()}
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-blue-100 p-2">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Additional Awards</h2>
        </div>
      {/snippet}

      <div class="grid gap-4 sm:grid-cols-2">
        {#each additionalPrizes as prize}
          <div class="rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4 transition-colors duration-200 hover:bg-gray-100">
            <div class="mb-2 flex items-start justify-between gap-2">
              <h3 class="text-lg font-bold text-gray-900">{prize.title}</h3>
              <span class="inline-flex items-center whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                {prize.amount}
              </span>
            </div>
            <p class="text-sm text-gray-600">{prize.description}</p>
          </div>
        {/each}
      </div>
    </Card>
  </div>
</Shell>
