<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<Shell title="2024 Hackathon Event Summary">
	<div class="max-w-3xl mx-auto px-4 py-8 space-y-6 text-lg leading-relaxed">
		<p class="text-gray-800 font-light">
			The inaugural 2024 Bergen Tech Hackathon was a huge success! We wanted to deeply thank you
			for your support and share a few highlights from the day - we could not have put this event
			together without you!
		</p>

		<Button
			href="https://raw.githubusercontent.com/mbryzek/hackathon-static/refs/heads/main/2024/2024-Event-Summary.pdf"
			label="Download our 2024 event summary"
			external
		/>

		<p class="text-gray-800 font-light">
			52 students from grades 9-12 competed in a 12-hour coding event. From idea generation to
			building their apps and projects to final presentations, the students impressed everyone
			involved.
		</p>

		<!-- Projects Section -->
		<div class="mt-4 pl-4">
			<h3 class="text-xl font-semibold mb-2 text-gray-800">Projects</h3>
			<ul class="list-disc pl-6 space-y-2">
				<li class="pl-2 text-gray-800 font-light">
					AI Recipe Generator: Enter ingredients to get tailored recipes using AI.
				</li>
				<li class="pl-2 text-gray-800 font-light">
					Disease Identifier: Identifies diseases based on symptoms with AI assistance.
				</li>
				<li class="pl-2 text-gray-800 font-light">
					Competition Platform: An end-to-end platform for creating and hosting events.
				</li>
				<li class="pl-2 text-gray-800 font-light">
					Drawing Game: A browser-based recreation of Microsoft Paint.
				</li>
				<li class="pl-2 text-gray-800 font-light">
					Carbon Movement Tracker: Tracks carbon emissions based on transportation mode.
				</li>
				<li class="pl-2 text-gray-800 font-light">
					Spotify Mood Playlist: Generates Spotify playlists based on mood using AI.
				</li>
				<li class="pl-2 text-gray-800 font-light">
					Find Your Lost Dog: A drone algorithm to locate lost pets efficiently.
				</li>
			</ul>
		</div>

		<!-- By the Numbers Section -->
		<div class="mt-4 pl-4">
			<h2 class="text-2xl font-semibold mb-2 text-gray-800">By the Numbers</h2>
			<ul class="list-disc pl-6 space-y-2">
				<li class="pl-2 text-gray-800 font-light">52 student participants</li>
				<li class="pl-2 text-gray-800 font-light">18 teams</li>
				<li class="pl-2 text-gray-800 font-light">10 awards</li>
				<li class="pl-2 text-gray-800 font-light">$5,730 in prizes</li>
				<li class="pl-2 text-gray-800 font-light">8 sponsors</li>
				<li class="pl-2 text-gray-800 font-light">~50 donors</li>
				<li class="pl-2 text-gray-800 font-light">~20 volunteers</li>
				<li class="pl-2 text-gray-800 font-light">5 industry speakers</li>
			</ul>
			<img
				class="mt-4"
				src="https://github.com/mbryzek/hackathon-static/blob/main/2024/jumping.jpg?raw=true"
				alt="Students jumping in celebration at the 2024 hackathon"
			/>
		</div>
	</div>
</Shell>
