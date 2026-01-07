<script lang="ts">
	import { page } from '$app/stores';
	import { urls } from '$lib/urls';

	const eventKey = $derived($page.params.event_key ?? '');
	const code = $derived($page.url.searchParams.get('code') || '');
	const changeVoteUrl = $derived(
		code ? `${urls.voteEvent(eventKey)}?code=${encodeURIComponent(code)}` : urls.voteEvent(eventKey)
	);
</script>

<div class="animate-fade-in">
	<div class="bg-white shadow-lg rounded-xl p-8 max-w-md mx-auto text-center">
		<!-- Success icon -->
		<div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
			<svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
			</svg>
		</div>

		<h1 class="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>

		<p class="text-gray-600 mb-6">
			Your vote has been recorded successfully.
		</p>

		<div class="bg-gray-50 rounded-lg p-4 mb-6">
			<p class="text-sm text-gray-500">
				Want to change your vote? You can update your selection as long as voting is still open.
			</p>
		</div>

		<div class="space-y-3">
			<a
				href={changeVoteUrl}
				class="block w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
			>
				Change My Vote
			</a>

			<a
				href={urls.index}
				class="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
			>
				Return to Hackathon Site
			</a>
		</div>
	</div>
</div>
