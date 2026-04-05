<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';

	interface Award {
		title: string;
		prize: string;
		description: string;
	}

	const topAwards: Award[] = [
		{
			title: '1st Place',
			prize: '$1,000',
			description:
				'Highest number of points in judging criteria. Any ties are broken by the judges.',
		},
		{
			title: '2nd Place',
			prize: '$500',
			description:
				'2nd highest number of points based on judging criteria. Any ties are broken by the judges.',
		},
		{
			title: '3rd Place',
			prize: '$250',
			description:
				'3rd highest number of points based on judging criteria. Any ties are broken by the judges.',
		},
	];

	const additionalAwards: Award[] = [
		{
			title: 'No AI',
			prize: '$250',
			description:
				'Teams can elect to build without AI support - only google search is allowed. Awarded to the team with the highest number of points in this category. All team members must sign an honor pledge.',
		},
		{
			title: 'Freshman Prize',
			prize: '$250',
			description:
				'Awarded to the team with the highest number of points with all members in their first year of high school.',
		},
		{
			title: 'Cybersecurity',
			prize: '$250',
			description:
				'An application built to directly improve cyber security in some way. This criterion will be independently evaluated by the judges.',
		},
		{
			title: 'New Coder Prize',
			prize: '$250',
			description:
				'Awarded to the team with the highest number of points with all members as New Coders. A new coder is somebody with less than 1 year experience with any type of coding.',
		},
		{
			title: 'Best Visual Design',
			prize: '$250',
			description:
				'Awarded to the team that presents the most engaging Visual Design. This criterion will be independently evaluated by the judges.',
		},
		{
			title: 'Most Impactful',
			prize: '$250',
			description:
				'Awarded to the team that creates software that has the potential to most improve humanity. This criterion will be independently evaluated by the judges.',
		},
		{
			title: "Student's Choice Award",
			prize: '$250',
			description:
				'Students will each submit a single vote for which team they think should win. The team with the most votes earns this award. Ties will split the prize.',
		},
		{
			title: "Parent's Choice Award",
			prize: '$250',
			description:
				'Attending parents will each submit a single vote for which team they think should win. The team with the most votes earns this award. Ties will split the prize.',
		},
	];
</script>

<Shell title="2026 Prizes">
	<div class="flex flex-col gap-y-8">
		<div>
			<h2 class="text-xl font-semibold text-gray-800 mb-4">Awards</h2>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
				{#each topAwards as award}
					<div class="rounded-lg border border-yellow-300 bg-yellow-50 px-5 py-4">
						<div class="flex items-baseline justify-between mb-1">
							<h3 class="font-semibold text-gray-800">{award.title}</h3>
							<span class="text-yellow-600 font-bold">{award.prize}</span>
						</div>
						<p class="text-sm text-gray-600">{award.description}</p>
					</div>
				{/each}
			</div>

			<h3 class="text-lg font-semibold text-gray-800 mb-3">Additional Awards</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{#each additionalAwards as award}
					<div class="rounded-lg border border-gray-200 px-5 py-4">
						<div class="flex items-baseline justify-between mb-1">
							<h3 class="font-semibold text-gray-800">{award.title}</h3>
							<span class="text-yellow-600 font-bold">{award.prize}</span>
						</div>
						<p class="text-sm text-gray-600">{award.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</Shell>
