<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import { overallPrizes, additionalPrizes } from '$lib/data/prizes-y25';
</script>

<Shell title="2025 Prizes">
	<div class="flex flex-col gap-y-8">
		<!-- Introduction -->
		<p class="text-gray-800 font-light">
			This year we are trying a new format for the awards - there will still be a ton of cash
			prizes across two broad themes and specific individual awards. As teams register, they must
			indicate their theme and any individual awards for which the team would like to be considered.
		</p>

		<!-- Overall Prizes Section -->
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-2xl font-bold mb-4">Overall Awards</h2>
			<div class="flex flex-col gap-y-4">
				{#each overallPrizes as prize}
					<div class="border-l-4 border-yellow-500 pl-4">
						<div class="flex items-baseline gap-x-2">
							<h3 class="text-xl font-bold text-yellow-600">{prize.title}</h3>
							<span class="text-lg font-semibold text-green-600">{prize.amount}</span>
						</div>
						<p class="text-gray-800 font-light">{prize.description}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Additional Awards Section -->
		<div class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-2xl font-bold mb-4">Additional Awards</h2>
			<div class="flex flex-col gap-y-4">
				{#each additionalPrizes as prize}
					<div class="border-l-4 border-yellow-500 pl-4">
						<div class="flex items-baseline gap-x-2">
							<h3 class="text-xl font-bold text-yellow-600">{prize.title}</h3>
							<span class="text-lg font-semibold text-green-600">{prize.amount}</span>
						</div>
						<p class="text-gray-800 font-light">{prize.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</Shell>
