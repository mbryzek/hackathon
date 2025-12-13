<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import { photosY24 } from '$lib/data/photos-y24';
</script>

<Shell title="2024 Photos">
	<PhotoGallery photos={photosY24} shuffleOnMount={true} />
</Shell>
