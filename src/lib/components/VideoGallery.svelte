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
    playingVideos = new Set([...playingVideos].filter((i) => i !== index));
  }

  function handleLoadStart(index: number) {
    loadingVideos = new Set([...loadingVideos, index]);
  }

  function handleCanPlay(index: number) {
    loadingVideos = new Set([...loadingVideos].filter((i) => i !== index));
  }

  function playVideo(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const container = button.closest('.video-container');
    const video = container?.querySelector('video');
    if (video) {
      // Fire-and-forget: play() rejects when the autoplay policy blocks it or another play
      // interrupts it. Neither is actionable, and `controls` is the user's fallback.
      void video.play();
    }
  }
</script>

<div class="mx-auto max-w-7xl bg-white px-4 sm:px-6 lg:px-8">
  <div class="mx-auto mt-6 grid max-w-none grid-cols-1 gap-8 md:grid-cols-2">
    {#each displayVideos as video, index}
      <div class="video-container group">
        <div class="relative w-full overflow-hidden rounded-xl bg-gray-900 shadow-md transition-all duration-300 hover:shadow-xl">
          <!-- Video element -->
          <video
            controls
            preload="metadata"
            poster={video.poster}
            class="aspect-video w-full object-cover"
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
              class="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 opacity-100 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 group-hover:bg-black/40"
              onclick={playVideo}
              aria-label="Play video: {video.title}"
            >
              <!-- Play button circle -->
              <div
                class="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-white"
              >
                {#if loadingVideos.has(index)}
                  <!-- Loading spinner -->
                  <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-yellow-500"></div>
                {:else}
                  <!-- Play icon -->
                  <svg class="ml-1 h-10 w-10 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                {/if}
              </div>
            </button>
          {/if}
        </div>

        <!-- Video title -->
        <div class="mt-3 flex items-center gap-2">
          <div class="rounded-lg bg-yellow-100 p-1.5">
            <svg class="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p class="text-lg font-medium text-gray-900">{video.title}</p>
        </div>
      </div>
    {/each}
  </div>
</div>
