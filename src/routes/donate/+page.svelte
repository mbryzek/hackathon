<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import PricingTier from '$lib/components/PricingTier.svelte';

	const sponsorshipTiers = [
		{
			name: 'Headline Sponsor',
			cost: '$5,000',
			benefits: [
				'All Platinum tier benefits plus',
				'Exclusive: Only 1 headline sponsor for the entire event',
				'Official "sponsored by" on all event branding',
				'Option to speak at the event',
			],
			featured: true,
		},
		{
			name: 'Platinum Sponsor',
			cost: '$2,000',
			benefits: [
				'All Gold tier benefits plus',
				'Option to join the judging panel',
				'Large logo placement on event T-shirts',
				'Large banner in event space',
			],
		},
		{
			name: 'Gold Sponsor',
			cost: '$1,000',
			benefits: [
				'All Silver tier benefits plus',
				'Placement of merchandise/content in Goodie Bag',
			],
		},
		{
			name: 'Silver Sponsor',
			cost: '$500',
			benefits: [
				'Logo placement on event T-Shirt',
			],
		},
	];
</script>

<Shell title="Support the Hackathon">
	<div class="max-w-5xl mx-auto px-4 py-8 space-y-12">
		<!-- Introduction -->
		<div class="text-center max-w-2xl mx-auto">
			<p class="text-xl text-gray-800 font-light">
				The Bergen Tech Hackathon is only possible thanks to the generosity of our sponsors and
				donors. If you would like to support our mission of empowering the next generation of tech
				leaders, please consider donating to our cause.
			</p>
			<p class="mt-4 text-lg text-gray-600 font-medium">Thank you for your support!</p>
		</div>

		<!-- Individual Donors Section -->
		<Card variant="elevated">
			{#snippet header()}
				<div class="flex items-center gap-3">
					<div class="p-2 bg-red-100 rounded-lg">
						<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-gray-900">Individual Donors</h2>
				</div>
			{/snippet}

			<div class="space-y-4">
				<p class="text-gray-800 font-light">
					Every contribution, big or small, makes a difference. Let's come together to inspire and
					nurture the next generation of tech wizards at Bergen Tech!
				</p>
				<p class="text-gray-800 font-light">
					We are also looking for donations for the event and raffle - eg. food, drink, and small
					prizes that the students will enjoy. Last year's raffle included gift certificates to local
					restaurants, subscriptions to online coding platforms, and more.
				</p>
				<div class="pt-4">
					<Button href="https://donorbox.org/2026-bt-hackathon" label="Make a Donation" external />
				</div>
			</div>
		</Card>

		<!-- Corporate Sponsorship Section -->
		<div>
			<div class="text-center mb-8">
				<h2 class="text-3xl font-bold text-gray-900">Corporate Sponsorship Levels</h2>
				<p class="mt-2 text-gray-600">Choose the sponsorship tier that's right for your organization</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
				{#each sponsorshipTiers as tier}
					<PricingTier
						name={tier.name}
						cost={tier.cost}
						benefits={tier.benefits}
						featured={tier.featured ?? false}
						href="https://donorbox.org/events/816634"
						buttonLabel="Become a Sponsor"
					/>
				{/each}
			</div>
		</div>

		<!-- Tax Deductible Notice -->
		<div class="text-center">
			<p class="text-gray-600 font-light text-sm bg-gray-50 rounded-lg p-4 inline-block">
				<span class="font-medium">Tax Deductible:</span> Bergen Youth Enrichment is a registered 501(c)(3) public charity. All donations are tax deductible.
			</p>
		</div>
	</div>
</Shell>
