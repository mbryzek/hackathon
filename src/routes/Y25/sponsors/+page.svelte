<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import PhotoGallery from '$lib/components/PhotoGallery.svelte';
  import { sponsorsY25 } from '$lib/data/sponsors-y25';
</script>

<Shell title="2025 Sponsors">
  <p class="mb-6 font-light text-gray-800">A huge thank you to our sponsors who made our 2025 Hackathon possible!</p>
  <PhotoGallery photos={sponsorsY25} />
</Shell>
