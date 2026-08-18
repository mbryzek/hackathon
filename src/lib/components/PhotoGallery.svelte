<script lang="ts">
  import { shuffle } from '$lib/utils/shuffle';
  import Modal from './Modal.svelte';

  interface Props {
    photos: string[];
    shuffleOnMount?: boolean;
  }

  let { photos, shuffleOnMount = false }: Props = $props();

  // Shuffle photos when photos prop changes (if shuffleOnMount is true)
  const displayPhotos = $derived(shuffleOnMount ? shuffle(photos) : photos);

  // Lightbox state
  let lightboxOpen = $state(false);
  let currentIndex = $state(0);
  let imageLoading = $state(true);
  let imageError = $state(false);

  // Track loaded images for fade-in effect
  let loadedImages = $state<Set<number>>(new Set());

  const currentPhoto = $derived(displayPhotos[currentIndex]);

  function openLightbox(index: number) {
    currentIndex = index;
    imageLoading = true;
    imageError = false;
    lightboxOpen = true;
  }

  function closeLightbox() {
    lightboxOpen = false;
  }

  function nextPhoto() {
    imageLoading = true;
    imageError = false;
    currentIndex = (currentIndex + 1) % displayPhotos.length;
  }

  function prevPhoto() {
    imageLoading = true;
    imageError = false;
    currentIndex = (currentIndex - 1 + displayPhotos.length) % displayPhotos.length;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!lightboxOpen) return;

    switch (event.key) {
      case 'ArrowRight':
        nextPhoto();
        break;
      case 'ArrowLeft':
        prevPhoto();
        break;
    }
  }

  function handleImageLoad(index: number) {
    loadedImages = new Set([...loadedImages, index]);
  }

  function handleLightboxImageLoad() {
    imageLoading = false;
  }

  function handleLightboxImageError() {
    imageLoading = false;
    imageError = true;
  }

  // Touch handling for swipe
  let touchStartX = 0;
  let touchEndX = 0;

  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (touch) {
      touchStartX = touch.clientX;
    }
  }

  function handleTouchMove(event: TouchEvent) {
    const touch = event.touches[0];
    if (touch) {
      touchEndX = touch.clientX;
    }
  }

  function handleTouchEnd() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextPhoto();
      } else {
        prevPhoto();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="max-w-8xl mx-auto bg-white px-4 sm:px-6 lg:px-12">
  <div
    class="xs:grid-cols-2 mx-auto mt-6 grid max-w-sm grid-cols-1 gap-x-4 gap-y-8 sm:max-w-none sm:grid-cols-2 sm:gap-8 md:grid-cols-3 md:gap-10 lg:grid-cols-3 lg:gap-12 xl:grid-cols-4 2xl:grid-cols-5"
  >
    {#each displayPhotos as photo, index}
      <div class="group relative">
        <button
          type="button"
          class="w-full cursor-pointer overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
          onclick={() => openLightbox(index)}
          aria-label="View photo in lightbox"
        >
          <!-- Skeleton loader -->
          {#if !loadedImages.has(index)}
            <div class="absolute inset-0 animate-pulse rounded-lg bg-gray-200"></div>
          {/if}
          <img
            src={photo}
            alt=""
            loading="lazy"
            class="h-auto w-full object-contain transition-opacity duration-500 {loadedImages.has(index) ? 'opacity-100' : 'opacity-0'}"
            onload={() => handleImageLoad(index)}
          />
          <!-- Hover overlay -->
          <div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/10">
            <svg
              class="h-10 w-10 text-white opacity-0 drop-shadow-lg transition-opacity duration-300 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </div>
        </button>
      </div>
    {/each}
  </div>
</div>

<!-- Lightbox Modal -->
<Modal open={lightboxOpen} onclose={closeLightbox} size="full">
  <div
    class="relative flex min-h-[50vh] items-center justify-center"
    role="group"
    aria-label="Photo viewer, swipe to navigate"
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
  >
    <!-- Navigation buttons -->
    {#if displayPhotos.length > 1}
      <button
        type="button"
        class="absolute left-2 z-10 rounded-full bg-black/30 p-3 text-white/80 transition-all duration-200 hover:bg-black/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-white md:left-4"
        onclick={prevPhoto}
        aria-label="Previous photo"
      >
        <svg class="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        class="absolute right-2 z-10 rounded-full bg-black/30 p-3 text-white/80 transition-all duration-200 hover:bg-black/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-white md:right-4"
        onclick={nextPhoto}
        aria-label="Next photo"
      >
        <svg class="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    {/if}

    <!-- Image container -->
    <div class="flex max-h-[85vh] w-full items-center justify-center">
      {#if imageLoading}
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
        </div>
      {/if}

      {#if imageError}
        <div class="p-8 text-center text-white">
          <svg class="mx-auto mb-4 h-16 w-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>Failed to load image</p>
        </div>
      {:else}
        <img
          src={currentPhoto}
          alt=""
          class="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl transition-opacity duration-300 {imageLoading
            ? 'opacity-0'
            : 'opacity-100'}"
          onload={handleLightboxImageLoad}
          onerror={handleLightboxImageError}
        />
      {/if}
    </div>

    <!-- Photo counter -->
    {#if displayPhotos.length > 1}
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
        {currentIndex + 1} / {displayPhotos.length}
      </div>
    {/if}
  </div>
</Modal>
