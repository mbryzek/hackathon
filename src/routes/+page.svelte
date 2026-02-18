<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import Button from '$lib/components/Button.svelte';
	import { urls } from '$lib/urls';
</script>

<Shell title="Bergen Tech Hackathon">
	<div class="flex flex-col gap-y-4">
		<!-- Sign Up CTA -->
		<div class="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mt-4 text-center">
			<p class="text-gray-900 font-bold text-2xl sm:text-3xl">
				2026 Bergen Tech Hackathon — April 18, 2026
			</p>
			<p class="text-gray-700 text-lg mt-2">
				Registration is open! Sign up now to secure your spot.
			</p>
			<div class="mt-4">
				<Button href={urls.signup} external label="Sign Up for 2026" variant="primary" size="lg" />
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row justify-center items-center gap-3 mt-2">
			<Button href="/donate" label="Donate" variant="primary" />
			<Button href="/Y25/" label="2025 Hackathon" variant="secondary" />
		</div>

		<!-- 2025 Hackathon Video -->
		<div class="mt-6 max-w-2xl mx-auto">
			<div class="video-responsive">
				<iframe
					src="https://www.youtube.com/embed/phM9BT55MlE"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowfullscreen
					title="2025 Bergen Tech Hackathon Video"
				></iframe>
			</div>
		</div>

		<!-- Thank You Message -->
		<p class="text-gray-800 font-semibold text-center italic mt-8">
			Thank you for being a part of our community's growth and innovation!
		</p>

		<!-- Student Photo -->
		<img
			src="https://github.com/mbryzek/hackathon-static/blob/main/2025/everybody.w640.jpg?raw=true"
			alt="2025 Hackathon participants"
		/>
	</div>
</Shell>
