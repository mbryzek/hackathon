<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import PhotoGallery from '$lib/components/PhotoGallery.svelte';
  import { photosY26 } from '$lib/data/photos-y26';
</script>

<Shell title="2026 Photos">
  <PhotoGallery photos={photosY26} shuffleOnMount={true} />
</Shell>
