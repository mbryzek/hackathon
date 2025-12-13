<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';

	const executionRubric = [
		{
			score: 4,
			description:
				'Flawless Execution - The project is fully functional, stable, and free of major bugs. Performance is smooth, and all intended features work as expected. The team has handled edge cases and ensured robustness.',
		},
		{
			score: 3,
			description:
				'Solid Execution - The project is mostly functional, with minor bugs or missing features. Performance is acceptable, but some refinements could improve usability. Some edge cases may not be handled.',
		},
		{
			score: 2,
			description:
				'Partial Execution - The project works in some cases but has noticeable bugs, crashes, or incomplete features. Some core functionality may be missing, but the concept is demonstrated.',
		},
		{
			score: 1,
			description:
				'Minimal Execution - The project barely works or is incomplete. Most features are non-functional, and the team struggled to implement their ideas.',
		},
		{ score: 0, description: 'Non-functional - The project does not run or function at all.' },
	];

	const ambitionRubric = [
		{
			score: 4,
			description:
				'World-Changing Innovation - The project aims to solve a significant problem in a novel way. It pushes the boundaries of technology or creates something entirely new. The team tackled a highly ambitious idea.',
		},
		{
			score: 3,
			description:
				'Impressive Challenge - The project demonstrates a unique or difficult technical challenge. It is innovative and requires a high level of skill, but it may not be groundbreaking.',
		},
		{
			score: 2,
			description:
				'Moderate Challenge - The project is useful and well-scoped but does not push beyond common applications. The team took on a reasonable challenge with some creative elements.',
		},
		{
			score: 1,
			description:
				'Trivial Application - The project is simple. It might be functional but lacks novelty or difficulty.',
		},
		{
			score: 0,
			description:
				'No Ambition - The project does not show any effort toward solving a real problem or attempting a challenge.',
		},
	];
</script>

<Shell title="2025 Rubric">
	<div class="flex flex-col gap-y-8">
		<p class="text-gray-800 font-light">
			This year's evaluation format will be similar to a science fair. Towards the end of the
			evening, all teams will stop working on their projects and shift to presenting their projects
			to the audience. Judges, parents, and students are encouraged to visit each project to see
			what other teams have built.
		</p>

		<p class="text-gray-800 font-light">
			During this period, judges will evaluate each team's work against the rubric below. As we
			announce the prizes, we'll invite the first place team in each theme to demo their work for
			the full audience.
		</p>

		<p class="text-gray-800 font-light">
			The maximum score from a single judge is 8 points (4 points each for Execution and Ambition).
			Each team's final score will be averaged across all judges. Judges with children on a team
			will be excused from evaluating that team.
		</p>

		<p class="text-gray-800 font-light">
			The criteria are intended to be applied equally to all teams - team backgrounds and skill
			levels should not influence scoring.
		</p>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<!-- Execution -->
			<div class="rounded-lg border border-gray-200 overflow-hidden">
				<div class="bg-gray-100 px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-yellow-600">Execution</h3>
				</div>
				<div class="px-6 py-4">
					<div class="flex flex-col gap-y-4">
						{#each executionRubric as item}
							<div class="flex gap-x-4">
								<div class="font-bold min-w-[2rem] text-yellow-600">{item.score}</div>
								<div>{item.description}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Ambition -->
			<div class="rounded-lg border border-gray-200 overflow-hidden">
				<div class="bg-gray-100 px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-yellow-600">Ambition</h3>
				</div>
				<div class="px-6 py-4">
					<div class="flex flex-col gap-y-4">
						{#each ambitionRubric as item}
							<div class="flex gap-x-4">
								<div class="font-bold min-w-[2rem] text-yellow-600">{item.score}</div>
								<div>{item.description}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</Shell>
