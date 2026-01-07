<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { urls } from '$lib/urls';

	interface Props {
		title: string;
		children: Snippet;
		sticky?: boolean;
	}

	let { title, children, sticky = false }: Props = $props();

	let mobileMenuOpen = $state(false);

	interface Section {
		href: string;
		name: string;
		children: Section[];
	}

	const sections: Section[] = [
		{ href: urls.index, name: 'Overview', children: [] },
		{ href: urls.signup, name: 'Signup', children: [] },
		{ href: urls.vote, name: 'Vote', children: [] },
		{ href: urls.donate, name: 'Donate', children: [] },
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

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	const navClasses = $derived(
		sticky ? 'bg-gray-800 sticky top-0 z-40' : 'bg-gray-800 relative z-40'
	);
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Overlay for mobile menu -->
{#if mobileMenuOpen}
	<button
		class="fixed inset-0 bg-black/30 z-30 md:hidden transition-opacity duration-300"
		onclick={closeMobileMenu}
		aria-label="Close menu"
	></button>
{/if}

<div class="min-h-full">
	<nav class={navClasses}>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center">
					<!-- Logo -->
					<div class="shrink-0">
						<a href={urls.index} class="focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded">
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
										class="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 {active
											? 'bg-gray-900 text-white'
											: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
										aria-current={active ? 'page' : undefined}
										target={isExternal(section.href) ? '_blank' : undefined}
										rel={isExternal(section.href) ? 'noopener noreferrer' : undefined}
									>
										{section.name}
										{#if isExternal(section.href)}
											<svg class="inline-block w-3 h-3 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
											</svg>
										{/if}
									</a>
								{:else}
									<div class="relative group z-50">
										<a
											href={section.href}
											class="rounded-md px-3 py-2 text-sm font-medium flex items-center gap-1 transition-colors duration-150 {active
												? 'bg-gray-900 text-white'
												: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
										>
											{section.name}
											<!-- Dropdown chevron -->
											<svg class="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
											</svg>
										</a>
										<!-- Dropdown menu with smooth transition -->
										<div class="absolute left-0 top-full w-48 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out">
											<div class="bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
												{#each section.children as child, i}
													{@const childActive = $page.url.pathname === child.href}
													<a
														href={child.href}
														class="block px-4 py-2.5 text-sm transition-colors duration-150 {childActive
															? 'bg-gray-700 text-white'
															: 'text-gray-300 hover:bg-gray-700 hover:text-white'} {i === 0 ? 'rounded-t-md' : ''} {i === section.children.length - 1 ? 'rounded-b-md' : ''}"
													>
														{child.name}
													</a>
												{/each}
											</div>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>

				<!-- Mobile menu button -->
				<div class="-mr-2 flex md:hidden">
					<button
						type="button"
						class="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-150"
						aria-controls="mobile-menu"
						aria-expanded={mobileMenuOpen}
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					>
						<span class="absolute -inset-0.5"></span>
						<span class="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>

						<!-- Animated hamburger/close icon -->
						<div class="relative w-6 h-6">
							<span
								class="absolute left-0 top-1 w-6 h-0.5 bg-current transition-all duration-300 ease-in-out {mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}"
							></span>
							<span
								class="absolute left-0 top-3 w-6 h-0.5 bg-current transition-all duration-300 ease-in-out {mobileMenuOpen ? 'opacity-0' : ''}"
							></span>
							<span
								class="absolute left-0 top-5 w-6 h-0.5 bg-current transition-all duration-300 ease-in-out {mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}"
							></span>
						</div>
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile menu with slide animation -->
		<div
			id="mobile-menu"
			class="md:hidden overflow-hidden transition-all duration-300 ease-in-out {mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}"
		>
			<div class="px-2 pt-2 pb-3 space-y-1 bg-gray-800 border-t border-gray-700">
				{#each sections as section}
					{@const active = isActive(section) || hasActiveChild(section)}
					<div>
						<a
							href={section.href}
							class="block rounded-md px-3 py-2 text-base font-medium transition-colors duration-150 {active
								? 'bg-gray-900 text-white'
								: 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
							target={isExternal(section.href) ? '_blank' : undefined}
							rel={isExternal(section.href) ? 'noopener noreferrer' : undefined}
							onclick={closeMobileMenu}
						>
							{section.name}
							{#if isExternal(section.href)}
								<svg class="inline-block w-3 h-3 ml-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
								</svg>
							{/if}
						</a>
						{#if section.children.length > 0}
							<div class="pl-4 mt-1 space-y-1">
								{#each section.children as child}
									{@const childActive = $page.url.pathname === child.href}
									<a
										href={child.href}
										class="block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 {childActive
											? 'bg-gray-700 text-white'
											: 'text-gray-400 hover:bg-gray-700 hover:text-white'}"
										onclick={closeMobileMenu}
									>
										{child.name}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
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
