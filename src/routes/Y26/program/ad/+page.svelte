<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import Button from '$lib/components/Button.svelte';

	interface SizeOption {
		label: string;
		dimensions: string;
		price: string;
		width: string;
		height: string;
	}

	const sizes: SizeOption[] = [
		{ label: 'Full Page', dimensions: '10 in x 4 in', price: '$150', width: '240px', height: '600px' },
		{ label: 'Half Page', dimensions: '5 in x 4 in', price: '$90', width: '240px', height: '300px' },
		{ label: 'Quarter Page', dimensions: '2.5 in x 4 in', price: '$50', width: '240px', height: '150px' },
	];

	let encouragementSize = $state(0);
	let businessSize = $state(0);

	let currentEncouragementSize: SizeOption = $derived(sizes[encouragementSize]!);
	let currentBusinessSize: SizeOption = $derived(sizes[businessSize]!);

	const formUrl = 'https://forms.gle/aU3B4u73KqUcoSja8';
</script>

<Shell title="Program Ad Space">
	<div class="max-w-3xl mx-auto px-4 py-8 pb-24 space-y-12 text-lg leading-relaxed">
		<p class="text-gray-800 font-light">
			Our printed event program is handed to every participant, parent, and judge at the hackathon.
			Place an ad to support the event and connect with our community of students, families, and
			educators — or create an ad to further encourage your students.
		</p>

		<p class="text-gray-600 font-light text-base">
			Half page and full page ads can include a photo or logo — just upload it with your order.
		</p>

		<!-- Pricing overview -->
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="border-b-2 border-gray-200">
						<th class="py-3 pr-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">Size</th>
						<th class="py-3 pr-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">Dimensions</th>
						<th class="py-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Price</th>
					</tr>
				</thead>
				<tbody>
					{#each sizes as size}
						<tr class="border-b border-gray-100">
							<td class="py-3 pr-4 font-medium text-gray-900">{size.label}</td>
							<td class="py-3 pr-4 text-gray-600">{size.dimensions}</td>
							<td class="py-3 font-semibold text-gray-900">{size.price}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Encouragement Message -->
		<div>
			<h2 class="text-2xl font-bold text-gray-900 mb-1">Encouragement Message</h2>
			<p class="text-gray-600 font-light mb-4">
				A simple written message to cheer on your student or team. Your words of support will be
				printed in the program and handed directly to them on event day. Half and full page ads
				can include a photo.
			</p>

			<div class="flex gap-2 mb-4">
				{#each sizes as size, i}
					<button
						class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors {encouragementSize === i ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						onclick={() => encouragementSize = i}
					>{size.label}</button>
				{/each}
			</div>

			<div class="border-2 rounded-lg p-4 flex flex-col items-center justify-center mx-auto overflow-hidden" style="border-color: #b8960c; width: {currentEncouragementSize.width}; height: {currentEncouragementSize.height};">
				<div class="text-center" style="max-width: 180px;">
					{#if encouragementSize <= 1}
						<div class="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-2 flex items-center justify-center">
							<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
						</div>
					{/if}
					<p class="font-bold text-gray-900" class:text-lg={encouragementSize === 0} class:text-base={encouragementSize === 1} class:text-sm={encouragementSize === 2}>Alex, we are SO proud of you!</p>
					{#if encouragementSize === 0}
						<p class="text-xs text-gray-700 italic mt-2">
							From your very first "Hello World" to building real apps &mdash; watching you grow as a coder and a person has been the greatest joy. Today, show them what you've got. We'll be cheering the loudest!
						</p>
						<p class="text-xs mt-3" style="color: #b8960c;">Love, Mom & Dad</p>
						<p class="text-xs text-gray-500 mt-1">&mdash; The Martinez Family</p>
					{:else if encouragementSize === 1}
						<p class="text-xs text-gray-700 italic mt-1">
							We're so proud of everything you've built. Show them what you've got!
						</p>
						<p class="text-xs mt-2" style="color: #b8960c;">Love, Mom & Dad</p>
					{:else}
						<p class="text-xs mt-1" style="color: #b8960c;">Love, Mom & Dad</p>
					{/if}
				</div>
			</div>
			<p class="text-sm text-gray-500 mt-2 text-center">
				{currentEncouragementSize.label} &mdash; {currentEncouragementSize.dimensions} &mdash; {currentEncouragementSize.price}
			</p>
		</div>

		<!-- Business Ad Space -->
		<div>
			<h2 class="text-2xl font-bold text-gray-900 mb-1">Business Ad Space</h2>
			<p class="text-gray-600 font-light mb-4">
				Promote your business in the program. Reach hundreds of students, parents,
				and educators at the event. Half and full page ads can include your logo.
			</p>

			<div class="flex gap-2 mb-4">
				{#each sizes as size, i}
					<button
						class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors {businessSize === i ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						onclick={() => businessSize = i}
					>{size.label}</button>
				{/each}
			</div>

			<div class="border-2 rounded-lg p-4 flex flex-col items-center justify-center mx-auto overflow-hidden" style="border-color: #b8960c; width: {currentBusinessSize.width}; height: {currentBusinessSize.height};">
				<div class="text-center" style="max-width: 180px;">
					{#if businessSize <= 1}
						<div class="w-16 h-12 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
							<span class="text-[10px] text-gray-400 font-medium">YOUR LOGO</span>
						</div>
					{/if}
					<p class="font-bold text-gray-900" class:text-lg={businessSize === 0} class:text-base={businessSize === 1} class:text-sm={businessSize === 2}>Your Business Name</p>
					{#if businessSize === 0}
						<p class="text-xs text-gray-700 italic mt-2">Your message or tagline here</p>
						<p class="text-xs mt-2" style="color: #b8960c;">yourwebsite.com</p>
					{:else if businessSize === 1}
						<p class="text-xs text-gray-700 italic mt-1">Your tagline here</p>
					{/if}
				</div>
			</div>
			<p class="text-sm text-gray-500 mt-2 text-center">
				{currentBusinessSize.label} &mdash; {currentBusinessSize.dimensions} &mdash; {currentBusinessSize.price}
			</p>
		</div>
	</div>

	<!-- Floating CTA -->
	<div class="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t-2 border-yellow-400 py-3 px-4 text-center z-50">
		<div class="flex items-center justify-center gap-3">
			<p class="text-gray-900 font-semibold text-sm sm:text-base">
				Show your student you're cheering for them
			</p>
			<Button
				href={formUrl}
				external
				label="Purchase an Ad"
				variant="primary"
				size="sm"
			/>
		</div>
	</div>
</Shell>
