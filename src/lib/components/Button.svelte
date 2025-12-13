<script lang="ts">
	interface Props {
		href?: string;
		external?: boolean;
		onclick?: () => void;
		label: string;
	}

	let { href, external = false, onclick, label }: Props = $props();
</script>

<div class="mt-8 text-center">
	{#if href}
		<a
			{href}
			class="inline-block px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transform hover:scale-105 transition duration-200 ease-in-out"
			target={external ? '_blank' : undefined}
			rel={external ? 'noopener noreferrer' : undefined}
		>
			{label}
		</a>
	{:else}
		<button
			class="inline-block px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transform hover:scale-105 transition duration-200 ease-in-out"
			onclick={onclick}
		>
			{label}
		</button>
	{/if}
</div>
