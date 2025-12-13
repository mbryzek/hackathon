<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import Card from '$lib/components/Card.svelte';

	const email = 'bergenyouthenrichment@gmail.com';
	let copied = $state(false);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(email);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = email;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}
</script>

<Shell title="Contact The Hackathon Organizers">
	<div class="max-w-2xl mx-auto px-4 py-8 space-y-8">
		<!-- Introduction -->
		<p class="text-gray-800 font-light text-lg text-center">
			The Bergen Tech Hackathon is run by Bergen Youth Enrichment, a 501(c)(3) non-profit
			organization which is 100% volunteer-run.
		</p>

		<!-- Contact Card -->
		<Card variant="elevated">
			{#snippet header()}
				<div class="flex items-center gap-3">
					<div class="p-2 bg-blue-100 rounded-lg">
						<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>
					<h2 class="text-xl font-bold text-gray-900">Get In Touch</h2>
				</div>
			{/snippet}

			<div class="space-y-6">
				<!-- Contact Person -->
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
						<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</div>
					<div>
						<p class="text-lg font-semibold text-gray-900">Michael Bryzek</p>
						<p class="text-gray-600">Event Organizer</p>
					</div>
				</div>

				<!-- Email with Copy Button -->
				<div class="bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
					<div class="flex items-center gap-3 flex-grow min-w-0">
						<svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						<a
							href="mailto:{email}"
							class="text-blue-600 hover:text-blue-800 font-medium truncate transition-colors duration-200"
						>
							{email}
						</a>
					</div>
					<button
						type="button"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 {copied
							? 'bg-green-100 text-green-700'
							: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
						onclick={copyToClipboard}
					>
						{#if copied}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Copied!
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
							Copy
						{/if}
					</button>
				</div>

				<!-- Quick Action -->
				<div class="text-center pt-2">
					<a
						href="mailto:{email}"
						class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						Send Email
					</a>
				</div>
			</div>
		</Card>

	</div>
</Shell>
