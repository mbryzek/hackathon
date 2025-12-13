<script lang="ts">
	import { shuffle } from '$lib/utils/shuffle';

	export interface VideoInfo {
		url: string;
		title: string;
		poster?: string;
	}

	interface Props {
		videos: VideoInfo[];
		shuffleOnMount?: boolean;
	}

	let { videos, shuffleOnMount = false }: Props = $props();

	// Shuffle videos when videos prop changes (if shuffleOnMount is true)
	const displayVideos = $derived(shuffleOnMount ? shuffle(videos) : videos);

	// Track which videos are playing
	let playingVideos = $state<Set<number>>(new Set());
	let loadingVideos = $state<Set<number>>(new Set());

	function handlePlay(index: number) {
		playingVideos = new Set([...playingVideos, index]);
	}

	function handlePause(index: number) {
		playingVideos = new Set([...playingVideos].filter(i => i !== index));
	}

	function handleLoadStart(index: number) {
		loadingVideos = new Set([...loadingVideos, index]);
	}

	function handleCanPlay(index: number) {
		loadingVideos = new Set([...loadingVideos].filter(i => i !== index));
	}

	function playVideo(_index: number, event: MouseEvent) {
		const button = event.currentTarget as HTMLButtonElement;
		const container = button.closest('.video-container');
		const video = container?.querySelector('video');
		if (video) {
			video.play();
		}
	}
</script>

<div class="bg-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
	<div class="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-none mx-auto">
		{#each displayVideos as video, index}
			<div class="group video-container">
				<div class="relative w-full overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-gray-900">
					<!-- Video element -->
					<video
						controls
						preload="metadata"
						poster={video.poster}
						class="w-full aspect-video object-cover"
						onplay={() => handlePlay(index)}
						onpause={() => handlePause(index)}
						onloadstart={() => handleLoadStart(index)}
						oncanplay={() => handleCanPlay(index)}
					>
						<source src={video.url} type="video/mp4" />
						Your browser does not support the video tag.
					</video>

					<!-- Custom play button overlay (shows when not playing) -->
					{#if !playingVideos.has(index)}
						<button
							type="button"
							class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 group-hover:bg-black/40 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2"
							onclick={(e) => playVideo(index, e)}
							aria-label="Play video: {video.title}"
						>
							<!-- Play button circle -->
							<div class="w-20 h-20 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg">
								{#if loadingVideos.has(index)}
									<!-- Loading spinner -->
									<div class="w-8 h-8 border-4 border-gray-300 border-t-yellow-500 rounded-full animate-spin"></div>
								{:else}
									<!-- Play icon -->
									<svg class="w-10 h-10 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
										<path d="M8 5v14l11-7z" />
									</svg>
								{/if}
							</div>
						</button>
					{/if}
				</div>

				<!-- Video title -->
				<div class="mt-3 flex items-center gap-2">
					<div class="p-1.5 bg-yellow-100 rounded-lg">
						<svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
						</svg>
					</div>
					<p class="text-lg font-medium text-gray-900">{video.title}</p>
				</div>
			</div>
		{/each}
	</div>
</div>
