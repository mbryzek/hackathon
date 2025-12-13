<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import CalloutBox from '$lib/components/CalloutBox.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<Shell title="2025 Hackathon Event Summary">
	<div class="max-w-3xl mx-auto px-4 py-8 space-y-6 text-lg leading-relaxed">
		<!-- Callout Boxes -->
		<div class="flex gap-x-4">
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
		<div class="flex items-center gap-x-4">
			<Button href="/Y25/demos" label="Watch the demos" />
			<Button href="/Y25/photos" label="View the photos" />
			<Button
				href="https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2025/2025-Event-Summary.pdf"
				label="Event summary"
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
		<div class="mt-4 pl-4">
			<h3 class="text-xl font-semibold mb-2 text-gray-800">Projects</h3>
			<ul class="list-disc pl-6 space-y-2">
				<li class="pl-2 text-gray-800 font-light">
					A Chrome Extension to help you detect phishing, attacks directly in your browser
				</li>
				<li class="pl-2 text-gray-800 font-light">
					An app to generate a bracket for your upcoming sports tournament
				</li>
				<li class="pl-2 text-gray-800 font-light">
					A robotic grid to detect cars at intersections and to optimize traffic lights for maximum
					flow
				</li>
				<li class="pl-2 text-gray-800 font-light">
					An AI to help you find new albums based on your listening preferences
				</li>
				<li class="pl-2 text-gray-800 font-light">
					A two sided app to help Alzheimer's patients and their caregivers connect more with their
					family and friends
				</li>
				<li class="pl-2 text-gray-800 font-light">
					An emergency services dispatch tool ensuring people get help even in remote areas
				</li>
				<li class="pl-2 text-gray-800 font-light">
					A vacation planner to help you optimize for fun and budget
				</li>
				<li class="pl-2 text-gray-800 font-light">
					A physics tutor - automatically building summaries, practice problems, and more based on
					your textbook, all locally trained
				</li>
				<li class="pl-2 text-gray-800 font-light">
					An IOT network scanner to find vulnerabilities in your home
				</li>
				<li class="pl-2 text-gray-800 font-light">An app to translate sign language to text</li>
				<li class="pl-2 text-gray-800 font-light">
					A game to motivate you to exercise and stay fit
				</li>
				<li class="pl-2 text-gray-800 font-light">and much more!</li>
			</ul>
		</div>

		<!-- By the Numbers Section -->
		<div class="mt-4 pl-4">
			<h2 class="text-2xl font-semibold mb-2 text-gray-800">By the Numbers</h2>
			<ul class="list-disc pl-6 space-y-2">
				<li class="pl-2 text-gray-800 font-light">100+ students</li>
				<li class="pl-2 text-gray-800 font-light">30 teams</li>
				<li class="pl-2 text-gray-800 font-light">12 awards</li>
				<li class="pl-2 text-gray-800 font-light">$5k+ in prizes</li>
				<li class="pl-2 text-gray-800 font-light">8 sponsors</li>
				<li class="pl-2 text-gray-800 font-light">~50 donors</li>
				<li class="pl-2 text-gray-800 font-light">~20 volunteers</li>
				<li class="pl-2 text-gray-800 font-light">3 industry speakers</li>
			</ul>
			<img
				class="mt-4"
				src="https://github.com/mbryzek/hackathon-static/blob/main/2025/everybody.w640.jpg?raw=true"
				alt="All participants gathered together at the 2025 hackathon"
			/>
		</div>
	</div>
</Shell>
