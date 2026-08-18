<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import VideoGallery from '$lib/components/VideoGallery.svelte';
  import { videosY25 } from '$lib/data/videos-y25';
</script>

<Shell title="2025 Demos">
  <p class="mb-6 font-light text-gray-800">
    In 2025, we had ~30 teams participate in the Hackathon and build amazing projects. View screen recordings from the teams who chose to
    share their demos online.
  </p>
  <VideoGallery videos={videosY25} shuffleOnMount={true} />
</Shell>
