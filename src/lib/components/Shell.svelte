<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { urls } from '$lib/urls';

	interface Props {
		title: string;
		children: Snippet;
	}

	let { title, children }: Props = $props();

	let mobileMenuOpen = $state(false);

	interface Section {
		href: string;
		name: string;
		children: Section[];
	}

	const sections: Section[] = [
		{ href: urls.index, name: 'Overview', children: [] },
		{ href: urls.signup, name: 'Signup', children: [] },
		{
			href: urls.y25Index,
			name: '2025',
			children: [
				{ href: urls.y25Index, name: 'Event', children: [] },
				{ href: urls.y25Demos, name: 'Demos', children: [] },
				{ href: urls.y25Photos, name: 'Photos', children: [] },
				{ href: urls.y25Sponsors, name: 'Sponsors', children: [] },
				{ href: urls.y25Prizes, name: 'Prizes', children: [] },
				{ href: urls.y25Rubric, name: 'Rubric', children: [] },
			],
		},
		{
			href: urls.y24Index,
			name: '2024',
			children: [
				{ href: urls.y24Index, name: 'Event', children: [] },
				{ href: urls.y24Photos, name: 'Photos', children: [] },
				{ href: urls.y24Sponsors, name: 'Sponsors', children: [] },
			],
		},
		{ href: urls.donate, name: 'Donate', children: [] },
		{ href: urls.contact, name: 'Contact', children: [] },
	];

	function isActive(section: Section): boolean {
		return $page.url.pathname === section.href;
	}

	function hasActiveChild(section: Section): boolean {
		return section.children.some((child) => $page.url.pathname === child.href);
	}

	function isExternal(href: string): boolean {
		return href.startsWith('http');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && mobileMenuOpen) {
			mobileMenuOpen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-full">
	<nav class="bg-gray-800">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center">
					<!-- Logo -->
					<div class="shrink-0">
						<a href={urls.index}>
							<img
								class="h-12 w-36 cursor-pointer"
								src="/assets/bt-cs-logo.png"
								alt="2025 Bergen Tech Hackathon"
							/>
						</a>
					</div>

					<!-- Desktop Navigation -->
					<div class="md:block hidden">
						<div class="ml-10 flex items-baseline space-x-4">
							{#each sections as section}
								{@const active = isActive(section) || hasActiveChild(section)}
								{#if section.children.length === 0}
									<a
										href={section.href}
										class="rounded-md px-3 py-2 text-sm font-medium {active
											? 'bg-gray-900 text-white'
											: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
										aria-current={active ? 'page' : undefined}
										target={isExternal(section.href) ? '_blank' : undefined}
										rel={isExternal(section.href) ? 'noopener noreferrer' : undefined}
									>
										{section.name}
									</a>
								{:else}
									<div class="relative group z-50">
										<a
											href={section.href}
											class="rounded-md px-3 py-2 text-sm font-medium {active
												? 'bg-gray-900 text-white'
												: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
										>
											{section.name}
										</a>
										<div class="absolute left-0 top-full w-48">
											<div class="pt-2 pb-1">
												<div
													class="bg-gray-800 rounded-md shadow-lg hidden group-hover:block transition-[display] duration-300 z-[150]"
												>
													{#each section.children as child}
														<a
															href={child.href}
															class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
														>
															{child.name}
														</a>
													{/each}
												</div>
											</div>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>

				<!-- Mobile menu button -->
				<div class="-mr-2 flex md:hidden relative">
					<button
						type="button"
						class="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
						aria-controls="mobile-menu"
						aria-expanded={mobileMenuOpen}
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					>
						<span class="absolute -inset-0.5"></span>
						<span class="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>

						{#if mobileMenuOpen}
							<!-- Close icon -->
							<svg
								class="block h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
						{:else}
							<!-- Hamburger icon -->
							<svg
								class="block h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
								/>
							</svg>
						{/if}
					</button>

					<!-- Mobile menu dropdown (outside button for accessibility) -->
					{#if mobileMenuOpen}
						<div
							id="mobile-menu"
							class="absolute right-0 top-full mt-4 w-48 bg-white shadow-lg rounded-md z-50"
						>
							{#each sections as section}
								<div>
									<a
										href={section.href}
										class="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
										target={isExternal(section.href) ? '_blank' : undefined}
										rel={isExternal(section.href) ? 'noopener noreferrer' : undefined}
										onclick={() => (mobileMenuOpen = false)}
									>
										{section.name}
									</a>
									{#if section.children.length > 0}
										<div class="pl-4">
											{#each section.children as child}
												<a
													href={child.href}
													class="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
													onclick={() => (mobileMenuOpen = false)}
												>
													{child.name}
												</a>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<header class="bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<h1 class="text-gray-800 text-lg/6 font-semibold">{title}</h1>
		</div>
	</header>

	<main>
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			{@render children()}
		</div>
	</main>
</div>
