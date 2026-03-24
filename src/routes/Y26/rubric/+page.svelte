<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';

	const executionRubric = [
		{
			score: '4',
			description:
				'Flawless Execution - The project is fully functional, stable, and free of major bugs. Performance is smooth, and all intended features work as expected. The team has handled edge cases and ensured robustness.',
		},
		{
			score: '3',
			description:
				'Solid Execution - The project is mostly functional, with minor bugs or missing features. Performance is acceptable, but some refinements could improve usability. Some edge cases may not be handled.',
		},
		{
			score: '2',
			description:
				'Partial Execution - The project works in some cases but has noticeable bugs, crashes, or incomplete features. Some core functionality may be missing, but the concept is demonstrated.',
		},
		{
			score: '1',
			description:
				'Minimal Execution - The project barely works or is incomplete. Most features are non-functional, and the team struggled to implement their ideas.',
		},
		{ score: '0', description: 'Non-functional - The project does not run or function at all.' },
	];

	const difficultyRubric = [
		{
			score: '4',
			description:
				'Very Challenging - Project tackles problems where AI assistants provide limited help. Involves novel algorithms, complex system integrations, cutting-edge APIs, or domain-specific logic that requires genuine problem-solving beyond what tools like Copilot or ChatGPT can readily generate.',
		},
		{
			score: '3',
			description:
				'Challenging - Project requires significant problem-solving beyond AI assistance. Students had to develop custom solutions, integrate multiple complex systems, or work with technologies that AI tools handle poorly. Clear evidence of debugging and adaptation.',
		},
		{
			score: '2',
			description:
				'Moderate Difficulty - Student had to significantly modify generated code, troubleshoot non-obvious issues, or combine multiple AI-assisted components in ways that demanded real comprehension of the underlying systems.',
		},
		{
			score: '1',
			description:
				'Basic Difficulty - Project required some modification of AI-generated code but follows common patterns. Students made minor adaptations and showed some understanding of the code.',
		},
		{
			score: '0',
			description:
				'Normal Difficulty - Project could be largely assembled using AI-generated code with minimal modification. Standard CRUD apps, basic templates, or well-documented tutorials that AI tools handle effectively. Limited evidence of problem-solving.',
		},
	];

	const aiRubric = [
		{
			score: '0',
			description:
				'Expert AI Collaboration - The team demonstrates deep understanding of how they prompted AI tools and can clearly explain their reasoning. They critically reviewed and understand all generated code, can identify what the AI did well and where they made modifications, and show genuine comprehension of how their project works.',
		},
		{
			score: '-1',
			description:
				'Strong AI Understanding - The team shows solid understanding of their prompting approach and can explain most of the generated code. They reviewed the output thoughtfully and can describe the key components, though some areas may be less fully understood.',
		},
		{
			score: '-2',
			description:
				'Partial AI Understanding - The team has basic awareness of how they used AI and can explain some portions of the code. Review of generated code was superficial, and they struggle to explain significant parts of how their project works.',
		},
	];

	const ambitionRubric = [
		{
			score: '+2',
			description:
				"Global Impact - The project directly addresses one of humanity's grand challenges. It aims to solve problems affecting millions or billions of people: health, water, food, energy, education, poverty, or environmental sustainability. The team is thinking at a scale that could meaningfully change the world.",
		},
		{
			score: '+1',
			description:
				"Meaningful Impact - The project addresses a real societal problem that affects a specific community or population. It may not be global in scope, but it demonstrates awareness of human needs and a genuine desire to make people's lives better.",
		},
		{
			score: '0',
			description:
				'Limited Impact - The project solves a personal convenience problem, is purely entertainment-focused, or does not demonstrate intent to address broader human needs.',
		},
	];

	const presentationRubric = [
		{
			score: '+1',
			description:
				'Clear & Engaging - The team clearly explains what they built, why it matters, and demonstrates it working.',
		},
		{
			score: '0',
			description:
				'Unclear or Incomplete - The presentation is confusing, overly brief, or fails to convey what the project actually does or why.',
		},
	];

	interface Award {
		title: string;
		prize: string;
		description: string;
		note?: string;
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
			prize: '$1,000',
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

	interface RubricSection {
		title: string;
		subtitle: string;
		items: { score: string; description: string }[];
	}

	const rubricSections: RubricSection[] = [
		{ title: 'Execution', subtitle: '0-4 points', items: executionRubric },
		{ title: 'Level of Difficulty', subtitle: '0-4 points', items: difficultyRubric },
		{ title: 'AI Proficiency', subtitle: '0 to -2 points', items: aiRubric },
		{ title: 'Ambition', subtitle: '0 to +2 points', items: ambitionRubric },
		{ title: 'Presentation', subtitle: '0 to +1 points', items: presentationRubric },
	];
</script>

<Shell title="2026 Rubric">
	<div class="flex flex-col gap-y-8">
		<!-- Awards Section -->
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

		<!-- Judging Format -->
		<div>
			<h2 class="text-xl font-semibold text-gray-800 mb-3">Judging Format</h2>
			<div class="space-y-3 text-gray-800 font-light">
				<p>
					This year's evaluation format will continue as a science fair. Towards the end of the
					evening, all teams will stop working on their projects and shift to presenting their
					projects to the audience. Judges, parents, and students are encouraged to visit each
					project to see what other teams have built. During this period, judges will evaluate each
					team's work against the rubric.
				</p>
				<p>
					The maximum number of points a single judge can award to a single team is 11. Maximum
					penalty is -2. Each team's score will be an average across all of the judges. Judges who
					have a child on a particular team will be excused from evaluating that team.
				</p>
				<p>
					The criteria are intended to be applied equally to all teams - team backgrounds,
					reputation, and skill levels do not influence scoring.
				</p>
				<p>
					The top 3 teams will be invited to present for the full audience - and then prizes will be
					announced.
				</p>
			</div>
		</div>

		<!-- Scoring Summary -->
		<div>
			<h2 class="text-xl font-semibold text-gray-800 mb-3">Scoring Summary</h2>
			<div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
				{#each rubricSections as section}
					<div class="rounded-lg border border-gray-200 px-4 py-3 text-center">
						<div class="text-sm font-semibold text-gray-800">{section.title}</div>
						<div class="text-yellow-600 font-bold mt-1">{section.subtitle}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Rubric Details -->
		<div>
			<h2 class="text-xl font-semibold text-gray-800 mb-4">Judging Rubric</h2>
			<div class="flex flex-col gap-y-6">
				{#each rubricSections as section}
					<div class="rounded-lg border border-gray-200 overflow-hidden">
						<div class="bg-gray-100 px-6 py-4 border-b border-gray-200">
							<h3 class="text-lg font-semibold text-yellow-600">
								{section.title}
								<span class="text-sm font-normal text-gray-500 ml-2">({section.subtitle})</span>
							</h3>
						</div>
						<div class="px-6 py-4">
							<div class="flex flex-col gap-y-4">
								{#each section.items as item}
									<div class="flex gap-x-4">
										<div class="font-bold min-w-[2.5rem] text-yellow-600">{item.score}</div>
										<div class="text-gray-800">{item.description}</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- AI Rubric Note -->
		<div class="rounded-lg border border-blue-200 bg-blue-50 px-6 py-4">
			<h3 class="font-semibold text-blue-800 mb-2">About the AI Rubric</h3>
			<p class="text-sm text-blue-700">
				AI has become a powerful tool and we encourage interested teams to use AI to build their
				projects. However, we want to also encourage teams to understand what the AI is doing. We
				also want to create a level rubric for our No AI Teams - thus, the AI rubric is built as
				possible negative points based on understanding.
			</p>
		</div>
	</div>
</Shell>
