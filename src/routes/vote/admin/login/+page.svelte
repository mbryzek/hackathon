<script lang="ts">
	import { goto } from '$app/navigation';
	import { urls } from '$lib/urls';
	import { adminApi } from '$lib/api/client';
	import { setSessionCookie } from '$lib/utils/session';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let isSubmitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = null;

		if (!email.trim() || !password) {
			error = 'Please enter your email and password';
			return;
		}

		isSubmitting = true;

		const response = await adminApi.login(email.trim(), password);

		isSubmitting = false;

		if (response.errors) {
			error = response.errors[0]?.message || 'Login failed';
			return;
		}

		if (response.data) {
			// Store session in cookie (8 hours expiry)
			setSessionCookie(response.data.session.id);

			// Navigate to admin dashboard
			await goto(urls.voteAdmin);
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full">
		<div class="bg-white shadow-lg rounded-xl p-8">
			<div class="text-center mb-8">
				<img
					class="h-16 w-auto mx-auto mb-4"
					src="/assets/bt-cs-logo.png"
					alt="Bergen Tech Hackathon"
				/>
				<h1 class="text-2xl font-bold text-gray-900">Vote Admin Login</h1>
				<p class="text-gray-600 mt-2">Sign in to manage voting events</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						Email
					</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						placeholder="admin@example.com"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
						autocomplete="email"
						disabled={isSubmitting}
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						placeholder="Enter your password"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors"
						autocomplete="current-password"
						disabled={isSubmitting}
					/>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={isSubmitting || !email.trim() || !password}
					class="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<span class="inline-flex items-center justify-center gap-2">
							<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
								<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Signing in...
						</span>
					{:else}
						Sign In
					{/if}
				</button>
			</form>
		</div>

		<p class="text-center text-gray-500 text-sm mt-6">
			<a href={urls.index} class="hover:text-gray-700 transition-colors">
				Return to Hackathon Site
			</a>
		</p>
	</div>
</div>
