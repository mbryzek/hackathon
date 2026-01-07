<script lang="ts">
	import '../../../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { urls } from '$lib/urls';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Check if we're on the login page
	const isLoginPage = $derived($page.url.pathname === urls.voteAdminLogin);
</script>

<svelte:head>
	<title>Vote Admin - Bergen Tech Hackathon</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	{#if !isLoginPage}
		<!-- Admin header -->
		<nav class="bg-gray-900">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center gap-8">
						<a href={urls.index} class="flex items-center">
							<img
								class="h-10 w-30"
								src="/assets/bt-cs-logo.png"
								alt="Bergen Tech Hackathon"
							/>
						</a>
						<span class="text-white font-semibold">Vote Admin</span>
					</div>
					<div class="flex items-center gap-4">
						<a
							href={urls.voteAdmin}
							class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
						>
							Events
						</a>
						<a
							href="/vote/admin/logout"
							class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
						>
							Logout
						</a>
					</div>
				</div>
			</div>
		</nav>
	{/if}

	<main class="{isLoginPage ? '' : 'py-8'}">
		<div class="{isLoginPage ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}">
			{@render children()}
		</div>
	</main>
</div>
