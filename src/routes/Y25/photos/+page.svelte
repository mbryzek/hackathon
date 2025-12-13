<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import { photosY25 } from '$lib/data/photos-y25';
</script>

<Shell title="2025 Photos">
	<PhotoGallery photos={photosY25} shuffleOnMount={true} />
</Shell>
