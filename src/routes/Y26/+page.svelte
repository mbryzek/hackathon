<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import CalloutBox from '$lib/components/CalloutBox.svelte';
	import Button from '$lib/components/Button.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import { urls } from '$lib/urls';

	const stats = [
		{ value: '130', label: 'Students' },
		{ value: '39', label: 'Teams' },
		{ value: '13', label: 'Prize Categories' },
		{ value: '$4,500', label: 'In Prizes' },
		{ value: '15+', label: 'Sponsors & Donors' },
		{ value: '~30', label: 'Volunteers' },
		{ value: '4', label: 'Industry Speakers & Judges' },
		{ value: '12', label: 'Hours' },
	];

	const projects = [
		'A mobile app that helps the visually impaired navigate the real world',
		'An AI recipe builder to improve nutrition and variety in refugee camps',
		'A mapping system that finds safe walking routes through a neighborhood',
		"A DMV RPG that turns passing your driver's test into a game",
		'A study app that grades you on whether you can teach the material to an AI',
		'A financial budgeting app for teens, making it easy to save toward real goals',
		'A water-usage estimator for your interactions with AI chatbots',
		'An app to help you actually learn CSS, not just copy it',
		'A virtual drum kit you can play from your keyboard',
		'and much more!',
	];
</script>

<Shell title="2026 Hackathon Event Summary">
	<div class="max-w-3xl mx-auto px-4 py-8 space-y-6 text-lg leading-relaxed">
		<!-- Callout Boxes - responsive stack on mobile -->
		<div class="flex flex-col sm:flex-row gap-4">
			<CalloutBox title="Date & Time">
				<div class="flex flex-col gap-y-2">
					<div>April 18, 2026</div>
					<div>9am - 9pm</div>
				</div>
			</CalloutBox>
			<CalloutBox title="Location">
				<div class="flex flex-col gap-y-2">
					<div>Bergen Tech High School</div>
					<div>Teterboro NJ</div>
				</div>
			</CalloutBox>
			<CalloutBox title="Theme">
				Build with AI
			</CalloutBox>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-wrap items-center gap-3">
			<Button href={urls.y26EventSummary} label="Event summary" size="sm" external />
			<Button href={urls.y26Prizes} label="Prizes" size="sm" variant="secondary" />
			<Button href={urls.y26Sponsors} label="Our sponsors" size="sm" variant="secondary" />
		</div>

		<p class="text-gray-800 font-light">
			The 2026 Bergen Tech Hackathon was our best year yet! We want to thank you — our sponsors,
			donors, speakers, judges, mentors, teachers and families — for making it possible. Not one
			piece of this event happens without you.
		</p>

		<p class="text-gray-800 font-light">
			This year the event grew again, with 130 high school students from both the Teterboro and
			Paramus campuses registering to compete. Students formed 39 teams for a 12-hour sprint under
			our "Build with AI" theme — going from a blank screen to a working demo in a single day. From
			idea generation, to building, to final presentations in front of industry judges, the
			creativity and ambition on display was genuinely extraordinary.
		</p>

		<p class="text-gray-800 font-light">
			We awarded $4,500 in prizes across 13 categories, recognizing everything from best use of AI
			and most technically ambitious build to social impact, design, and rookie team of the year.
		</p>

		<!-- Projects Section -->
		<div class="mt-4">
			<h3 class="text-xl font-semibold mb-4 text-gray-800">A few example projects</h3>
			<ul class="space-y-3">
				{#each projects as project}
					<li class="flex items-start gap-3 text-gray-800 font-light">
						<span class="text-yellow-500 mt-1">&#9679;</span>
						{project}
					</li>
				{/each}
			</ul>
		</div>

		<!-- By the Numbers Section -->
		<div class="mt-8">
			<h2 class="text-2xl font-semibold mb-6 text-gray-800">By the Numbers</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				{#each stats as stat, i}
					<StatCard value={stat.value} label={stat.label} highlight={i === 0} />
				{/each}
			</div>
		</div>

		<!-- Download CTA -->
		<div class="mt-8 text-center">
			<Button href={urls.y26EventSummary} label="Download our 2026 event summary" external />
		</div>
	</div>
</Shell>
