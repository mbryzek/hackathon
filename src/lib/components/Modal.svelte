<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
		children: Snippet;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
	}

	let { open, onclose, children, size = 'lg' }: Props = $props();

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		full: 'max-w-[90vw] max-h-[90vh]'
	};

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			onclose();
		}
	}

</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
		role="dialog"
		aria-modal="true"
	>
		<button type="button" class="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-default" onclick={onclose} aria-label="Close" tabindex="-1"></button>
		<!-- Modal content -->
		<div
			class="relative {sizeClasses[size]} w-full mx-4 animate-scale-in"
		>
			<!-- Close button -->
			<button
				type="button"
				class="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white"
				onclick={onclose}
				aria-label="Close modal"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			{@render children()}
		</div>
	</div>
{/if}
