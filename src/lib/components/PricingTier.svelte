<script lang="ts">
	import Button from './Button.svelte';

	interface Props {
		name: string;
		cost: string;
		benefits: string[];
		featured?: boolean;
		href?: string;
		buttonLabel?: string;
	}

	let { name, cost, benefits, featured = false, href, buttonLabel = 'Select' }: Props = $props();

	const cardClasses = $derived(
		featured
			? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white ring-2 ring-yellow-400 ring-offset-2'
			: 'bg-white border border-gray-200'
	);

	const titleClasses = $derived(featured ? 'text-white' : 'text-gray-900');

	const costClasses = $derived(featured ? 'text-white' : 'text-gray-900');

	const benefitTextClasses = $derived(featured ? 'text-white/90' : 'text-gray-600');

	const checkClasses = $derived(featured ? 'text-white' : 'text-green-500');
</script>

<div class="relative rounded-xl p-6 {cardClasses} shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
	<!-- Featured badge -->
	{#if featured}
		<div class="absolute -top-3 left-1/2 -translate-x-1/2">
			<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-900 text-white uppercase tracking-wide">
				Most Popular
			</span>
		</div>
	{/if}

	<!-- Header -->
	<div class="text-center mb-6">
		<h3 class="text-xl font-bold {titleClasses}">{name}</h3>
		<div class="mt-2">
			<span class="text-4xl font-bold {costClasses}">{cost}</span>
		</div>
	</div>

	<!-- Benefits -->
	<ul class="space-y-3 flex-grow mb-6">
		{#each benefits as benefit}
			<li class="flex items-start gap-3">
				<svg class="w-5 h-5 {checkClasses} mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span class="{benefitTextClasses} text-sm">{benefit}</span>
			</li>
		{/each}
	</ul>

	<!-- CTA Button -->
	{#if href}
		<div class="mt-auto">
			<Button
				{href}
				label={buttonLabel}
				variant={featured ? 'secondary' : 'primary'}
				fullWidth
				external
			/>
		</div>
	{/if}
</div>
