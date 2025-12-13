<script lang="ts">
	import { shuffle } from '$lib/utils/shuffle';

	export interface VideoInfo {
		url: string;
		title: string;
	}

	interface Props {
		videos: VideoInfo[];
		shuffleOnMount?: boolean;
	}

	let { videos, shuffleOnMount = false }: Props = $props();

	// Shuffle videos when videos prop changes (if shuffleOnMount is true)
	const displayVideos = $derived(shuffleOnMount ? shuffle(videos) : videos);
</script>

<div class="bg-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
	<div
		class="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 max-w-none mx-auto"
	>
		{#each displayVideos as video}
			<div class="p-4 group relative">
				<div class="w-full overflow-hidden rounded-xl shadow-md hover:shadow-xl transition duration-300">
					<video controls preload="auto" class="w-full h-full object-cover">
						<source src={video.url} type="video/mp4" />
						Your browser does not support the video tag.
					</video>
				</div>
				<p class="mt-2 text-lg font-medium text-gray-900">{video.title}</p>
			</div>
		{/each}
	</div>
</div>
