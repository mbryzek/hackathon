<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
</script>

<Shell title="Luna - My Amazing Dog">
	<div class="max-w-3xl mx-auto py-8 flex flex-col md:flex-row gap-8">
		<img
			src="https://raw.githubusercontent.com/mbryzek/hackathon-static/main/luna/luna.jpg"
			alt="Luna, my beautiful red-coated collie/shepherd mix"
			class="md:w-1/3 rounded-lg shadow-lg object-cover h-[300px]"
		/>
		<div class="md:w-2/3">
			<h2 class="text-2xl font-bold text-amber-800 mb-4">Meet Luna</h2>
			<p class="mb-4">
				Luna is a stunning collie/Australian shepherd mix with a gorgeous ruby red coat that
				resembles a fox. Her medium-length fur and elegant appearance make her truly unique,
				combining the grace and intelligence of both breeds with a striking red coloration that
				turns heads wherever she goes.
			</p>

			<h3 class="text-xl font-bold text-amber-700 mt-6 mb-3">Why Dogs Are Our Best Friends</h3>
			<ul class="list-disc pl-6 space-y-2 mb-6">
				<li>Unconditional love and loyalty</li>
				<li>Emotional support and companionship</li>
				<li>Protection and security</li>
				<li>Motivation to stay active and healthy</li>
				<li>A constant source of joy and laughter</li>
			</ul>

			<h3 class="text-xl font-bold text-amber-700 mt-6 mb-3">Understanding Fear of Dogs</h3>
			<p class="mb-4">
				While dogs can be wonderful companions, it's important to understand why some people may be
				cautious around them:
			</p>
			<ul class="list-disc pl-6 space-y-2">
				<li>Past experiences with aggressive dogs</li>
				<li>Lack of exposure to friendly dogs during childhood</li>
				<li>Cultural differences in how dogs are viewed</li>
				<li>Natural caution around large animals</li>
				<li>Concerns about unpredictable behavior</li>
			</ul>

			<h3 class="text-xl font-bold text-amber-700 mt-6 mb-3">Tips for Overcoming Fear of Dogs</h3>
			<p class="mb-4">Here are some gentle ways to build confidence around dogs:</p>
			<ul class="list-disc pl-6 space-y-2">
				<li>Start with calm, well-trained dogs in controlled environments</li>
				<li>Learn to read dog body language and behavior signals</li>
				<li>Take things at your own pace - there's no rush</li>
				<li>Ask dog owners before interacting with their pets</li>
				<li>Begin with smaller or older dogs who are typically calmer</li>
			</ul>
		</div>
	</div>
</Shell>
