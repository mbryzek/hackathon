<script lang="ts">
	import { shuffle } from '$lib/utils/shuffle';

	interface Props {
		photos: string[];
		shuffleOnMount?: boolean;
	}

	let { photos, shuffleOnMount = false }: Props = $props();

	// Shuffle photos when photos prop changes (if shuffleOnMount is true)
	const displayPhotos = $derived(shuffleOnMount ? shuffle(photos) : photos);
</script>

<div class="bg-white px-4 sm:px-6 lg:px-12 max-w-8xl mx-auto">
	<div
		class="mt-6 grid grid-cols-1 gap-y-8 gap-x-4 sm:gap-8 md:gap-10 lg:gap-12 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-sm sm:max-w-none mx-auto"
	>
		{#each displayPhotos as photo}
			<div class="group relative">
				<div
					class="w-full overflow-hidden rounded-lg group-hover:opacity-75 hover:shadow-lg transition duration-300"
				>
					<a href={photo}>
						<img src={photo} alt="" loading="lazy" class="h-auto w-full object-contain" />
					</a>
				</div>
			</div>
		{/each}
	</div>
</div>
