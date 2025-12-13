<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<Shell title="Bergen Tech Hackathon">
	<div class="flex flex-col gap-y-4">
		<!-- Save the Date -->
		<p class="text-gray-800 font-bold text-2xl text-center italic mt-8">
			Save the date: 2026 Bergen Tech Hackathon will be on April 18, 2026
		</p>

		<!-- 2025 Hackathon Video -->
		<div class="flex justify-center mt-4">
			<iframe
				src="https://www.youtube.com/embed/phM9BT55MlE"
				width="560"
				height="315"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowfullscreen
				frameborder="0"
				class="max-w-full"
				title="2025 Bergen Tech Hackathon Video"
			></iframe>
		</div>

		<!-- Button -->
		<div class="mt-8 text-center">
			<Button href="/Y25/" label="Read more about the incredible 2025 Hackathon" />
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
