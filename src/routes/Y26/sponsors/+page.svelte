<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import { sponsorsY26 } from '$lib/data/sponsors-y26';
</script>

<Shell title="2026 Sponsors">
	<p class="text-gray-800 font-light mb-6">
		A huge thank you to our sponsors who make the 2026 Hackathon possible!
	</p>
	<PhotoGallery photos={sponsorsY26} />
</Shell>
