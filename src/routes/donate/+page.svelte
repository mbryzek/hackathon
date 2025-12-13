<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import Button from '$lib/components/Button.svelte';

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
			benefits: ['All Silver tier benefits plus', 'Placement of merchandise/content in Goodie Bag'],
		},
		{
			name: 'Silver Sponsor',
			cost: '$500',
			benefits: ['Logo placement on event T-Shirt'],
		},
	];
</script>

<Shell title="Support the Hackathon">
	<div class="max-w-3xl mx-auto px-4 py-8 space-y-6 text-lg leading-relaxed">
		<p class="text-gray-800 font-light">
			The Bergen Tech Hackathon is only possible thanks to the generosity of our sponsors and
			donors. If you would like to support our mission of empowering the next generation of tech
			leaders, please consider donating to our cause.
		</p>

		<p class="text-gray-800 font-light">Thank you for your support!</p>

		<!-- Individual Donors Section -->
		<div>
			<h2 class="text-2xl font-bold mb-4">Individual Donors</h2>
			<p class="text-gray-800 font-light">
				Every contribution, big or small, makes a difference. Let's come together to inspire and
				nurture the next generation of tech wizards at Bergen Tech!
			</p>
			<p class="text-gray-800 font-light">
				We are also looking for donations for the event and raffle - eg. food, drink, and small
				prizes that the students will enjoy. Last year's raffle included gift certificates to local
				restaurants, subscriptions to online coding platforms, and more.
			</p>
			<Button href="https://donorbox.org/2026-bt-hackathon" label="Donate here" external />
		</div>

		<!-- Corporate Sponsorship Section -->
		<div>
			<h2 class="text-2xl font-bold mt-8 mb-4">Corporate Sponsorship Levels</h2>
			<Button href="https://donorbox.org/events/816634" label="Become a sponsor here" external />
			<div class="mt-4">
				<ul class="space-y-6">
					{#each sponsorshipTiers as tier}
						<li class="border-l-4 border-yellow-500 pl-4">
							<div class="flex gap-x-4">
								<div><h3 class="text-xl font-semibold">{tier.name}</h3></div>
								<div class="text-lg font-semibold">{tier.cost}</div>
							</div>
							<ul class="pl-4 list-disc list-inside">
								{#each tier.benefits as benefit}
									<li class="text-gray-800 font-light">{benefit}</li>
								{/each}
							</ul>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<p class="text-gray-800 font-light">
			Bergen Youth Enrichment is a registered 501(c)(3) public charity. All donations are tax
			deductible.
		</p>
	</div>
</Shell>
