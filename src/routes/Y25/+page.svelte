<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import CalloutBox from '$lib/components/CalloutBox.svelte';
	import Button from '$lib/components/Button.svelte';
	import StatCard from '$lib/components/StatCard.svelte';

	const stats = [
		{ value: '100+', label: 'Students' },
		{ value: '30', label: 'Teams' },
		{ value: '12', label: 'Awards' },
		{ value: '$5k+', label: 'In Prizes' },
		{ value: '8', label: 'Sponsors' },
		{ value: '~50', label: 'Donors' },
		{ value: '~20', label: 'Volunteers' },
		{ value: '3', label: 'Industry Speakers' },
	];
</script>

<Shell title="2025 Hackathon Event Summary">
	<div class="max-w-3xl mx-auto px-4 py-8 space-y-6 text-lg leading-relaxed">
		<!-- Callout Boxes - responsive stack on mobile -->
		<div class="flex flex-col sm:flex-row gap-4">
			<CalloutBox title="Date & Time">
				<div class="flex flex-col gap-y-2">
					<div>April 5, 2025</div>
					<div>9am - 9pm</div>
				</div>
			</CalloutBox>
			<CalloutBox title="Location">
				<div class="flex flex-col gap-y-2">
					<div>Bergen Tech High School</div>
					<div>Teterboro NJ</div>
				</div>
			</CalloutBox>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-wrap items-center gap-3">
			<Button href="/Y25/demos" label="Watch the demos" size="sm" />
			<Button href="/Y25/photos" label="View the photos" size="sm" />
			<Button
				href="https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2025/2025-Event-Summary.pdf"
				label="Event summary"
				size="sm"
				external
			/>
		</div>

		<p class="text-gray-800 font-light">
			The 2025 Bergen Tech Hackathon was a huge success! We wanted to deeply thank you for your
			support and share a few highlights from the day - we could not have put this event together
			without you!
		</p>

		<p class="text-gray-800 font-light">
			This year the event doubled in size with 102 high school students registering from both the
			Teterboro and Paramus campuses. These students formed 30 teams to compete in the 12-hour
			coding event. From idea generation to building their apps and projects to final demos, the
			students impressed everyone involved.
		</p>

		<!-- Projects Section -->
		<div class="mt-4">
			<h3 class="text-xl font-semibold mb-4 text-gray-800">Projects</h3>
			<ul class="space-y-3">
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					A Chrome Extension to help you detect phishing attacks directly in your browser
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					An app to generate a bracket for your upcoming sports tournament
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					A robotic grid to detect cars at intersections and optimize traffic lights for maximum flow
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					An AI to help you find new albums based on your listening preferences
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					A two sided app to help Alzheimer's patients and their caregivers connect more with their family and friends
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					An emergency services dispatch tool ensuring people get help even in remote areas
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					A vacation planner to help you optimize for fun and budget
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					A physics tutor - automatically building summaries, practice problems, and more based on your textbook, all locally trained
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					An IOT network scanner to find vulnerabilities in your home
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					An app to translate sign language to text
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					A game to motivate you to exercise and stay fit
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					and much more!
				</li>
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

		<!-- Group Photo -->
		<div class="mt-8">
			<img
				class="w-full rounded-lg shadow-lg"
				src="https://github.com/mbryzek/hackathon-static/blob/main/2025/everybody.w640.jpg?raw=true"
				alt="All participants gathered together at the 2025 hackathon"
			/>
		</div>
	</div>
</Shell>
