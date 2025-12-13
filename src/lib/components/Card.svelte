<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'elevated' | 'bordered';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		hover?: boolean;
		header?: Snippet;
		footer?: Snippet;
		children: Snippet;
	}

	let {
		variant = 'default',
		padding = 'md',
		hover = false,
		header,
		footer,
		children
	}: Props = $props();

	const variantClasses = {
		default: 'bg-white shadow-md',
		elevated: 'bg-white shadow-lg hover:shadow-xl',
		bordered: 'bg-white border border-gray-200'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const hoverClass = $derived(hover ? 'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg' : '');

	const cardClasses = $derived(
		`rounded-lg overflow-hidden ${variantClasses[variant]} ${hoverClass}`
	);

	const contentPadding = $derived(paddingClasses[padding]);
</script>

<div class={cardClasses}>
	{#if header}
		<div class="border-b border-gray-100 px-6 py-4 bg-gray-50">
			{@render header()}
		</div>
	{/if}

	<div class={contentPadding}>
		{@render children()}
	</div>

	{#if footer}
		<div class="border-t border-gray-100 px-6 py-4 bg-gray-50">
			{@render footer()}
		</div>
	{/if}
</div>
