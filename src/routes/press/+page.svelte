<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import { pressReleases } from '$lib/data/press';
</script>

<Shell title="Press">
	<div class="max-w-3xl mx-auto space-y-8">
		{#each pressReleases as release}
			<article class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<time datetime={release.dateIso} class="text-sm text-gray-500">{release.date}</time>
				<h2 class="mt-1 text-xl font-semibold text-gray-900">{release.title}</h2>
				<p class="mt-3 text-gray-700 leading-relaxed">{release.summary}</p>
				<a
					href={release.pdfUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-yellow-700 hover:text-yellow-800"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					Download PDF
				</a>
			</article>
		{:else}
			<p class="text-gray-500 text-center py-12">No press releases available.</p>
		{/each}
	</div>
</Shell>
