<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		external?: boolean;
		onclick?: () => void;
		label?: string;
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		disabled?: boolean;
		fullWidth?: boolean;
		icon?: Snippet;
		children?: Snippet;
	}

	let {
		href,
		external = false,
		onclick,
		label,
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled = false,
		fullWidth = false,
		icon,
		children
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';

	const variantClasses = {
		primary:
			'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 disabled:bg-yellow-300',
		secondary:
			'bg-gray-700 text-white hover:bg-gray-800 focus:ring-gray-500 disabled:bg-gray-400',
		ghost:
			'bg-transparent text-gray-700 hover:bg-gray-100 shadow-none focus:ring-gray-400 disabled:text-gray-400',
		danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 disabled:bg-red-300'
	};

	const sizeClasses = {
		sm: 'px-4 py-2 text-sm gap-1.5',
		md: 'px-6 py-3 text-base gap-2',
		lg: 'px-8 py-4 text-lg gap-2.5'
	};

	const hoverTransform = disabled || loading ? '' : 'hover:scale-105 active:scale-100';
	const widthClass = fullWidth ? 'w-full' : '';
	const cursorClass = disabled || loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer';

	const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${hoverTransform} ${widthClass} ${cursorClass}`;
</script>

{#if href && !disabled}
	<a
		{href}
		class={buttonClasses}
		target={external ? '_blank' : undefined}
		rel={external ? 'noopener noreferrer' : undefined}
	>
		{#if loading}
			<svg
				class="animate-spin h-5 w-5"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		{:else if icon}
			{@render icon()}
		{/if}
		{#if children}
			{@render children()}
		{:else if label}
			{label}
		{/if}
	</a>
{:else}
	<button class={buttonClasses} onclick={onclick} disabled={disabled || loading} type="button">
		{#if loading}
			<svg
				class="animate-spin h-5 w-5"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		{:else if icon}
			{@render icon()}
		{/if}
		{#if children}
			{@render children()}
		{:else if label}
			{label}
		{/if}
	</button>
{/if}
