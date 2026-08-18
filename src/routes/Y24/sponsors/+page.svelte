<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import PhotoGallery from '$lib/components/PhotoGallery.svelte';
  import { sponsorsY24 } from '$lib/data/sponsors-y24';
</script>

<Shell title="2024 Sponsors">
  <div class="mx-auto max-w-4xl">
    <p class="mb-6 text-lg font-light text-gray-800">A huge thank you to our sponsors who made our 2024 Hackathon possible!</p>
    <PhotoGallery photos={sponsorsY24} />
  </div>
</Shell>
