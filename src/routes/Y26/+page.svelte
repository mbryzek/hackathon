<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import CalloutBox from '$lib/components/CalloutBox.svelte';
	import Button from '$lib/components/Button.svelte';
	import { urls } from '$lib/urls';
</script>

<Shell title="2026 Bergen Tech Hackathon">
	<div class="max-w-3xl mx-auto px-4 py-8 space-y-6 text-lg leading-relaxed">
		<!-- Callout Boxes -->
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
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-wrap items-center gap-3">
			<Button href={urls.signup} external label="Sign up" size="sm" />
			<Button href={urls.y26Rubric} label="View the rubric" size="sm" variant="secondary" />
			<Button href={urls.y26Sponsors} label="Our sponsors" size="sm" variant="secondary" />
			<Button href={urls.donate} label="Donate" size="sm" variant="secondary" />
			<Button href={urls.y26ProgramAd} label="Buy a Program Ad" size="sm" variant="secondary" />
		</div>

		<p class="text-gray-800 font-light">
			The 3rd annual Bergen Tech Hackathon brings together high school students for 12 hours of
			collaborative coding, mentorship, and hands-on learning. Teams will ideate, build, and demo
			real projects — competing for over $5,000 in prizes across 11 award categories.
		</p>

		<p class="text-gray-800 font-light">
			No experience required. Whether you're writing your first line of code or you've been
			programming for years, there's a place for you. We welcome students of all skill levels with
			dedicated prizes for new coders and freshmen.
		</p>

		<!-- What to Expect -->
		<div class="mt-4">
			<h3 class="text-xl font-semibold mb-4 text-gray-800">What to Expect</h3>
			<ul class="space-y-3">
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					12 hours to build something amazing with your team
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					Mentors and industry speakers to guide and inspire you
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					Science fair-style demos where you show off your work
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					11 award categories including 1st/2nd/3rd place, No AI, Cybersecurity, and more
				</li>
				<li class="flex items-start gap-3 text-gray-800 font-light">
					<span class="text-yellow-500 mt-1">&#9679;</span>
					Food, snacks, and drinks throughout the day
				</li>
			</ul>
		</div>

		<!-- Sign Up CTA -->
		<div class="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 text-center mt-8">
			<p class="text-gray-900 font-bold text-xl">Ready to build something amazing?</p>
			<div class="mt-4">
				<Button href={urls.signup} external label="Sign Up Now" variant="primary" size="lg" />
			</div>
		</div>
	</div>
</Shell>
