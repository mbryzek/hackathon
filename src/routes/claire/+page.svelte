<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
</script>

<Shell title="Claire">
	<div class="max-w-3xl mx-auto py-8">
		<h2 class="text-2xl font-bold text-amber-800 mb-4">Welcome to Claire's Page</h2>
		<img
			src="https://github.com/mbryzek/hackathon-static/blob/main/claire/head.jpg?raw=true"
			alt="Claire smiling"
			style="width: 200px; border-radius: 50%;"
		/>
		<p class="mt-4 mb-4 text-lg">
			Exciting news! I'm heading to Cancun tomorrow for some sun and relaxation! I'll be staying at
			the GR Solaris Cancun resort.
		</p>
		<p class="mt-4 mb-4 text-lg text-rose-600 font-semibold">BTW, Happy Valentine's Day!</p>
		<h3 class="text-xl font-bold text-amber-700 mt-6 mb-3">This is where we are staying!</h3>
		<img
			src="https://images.trvl-media.com/lodging/2000000/1120000/1110100/1110099/1d5a8cd9.jpg?impolicy=resizecrop&rw=1200&ra=fit"
			alt="GR Solaris Cancun resort"
			class="w-full max-w-lg rounded-lg shadow-lg mt-2 mx-auto block"
		/>
		<h3 class="text-xl font-bold text-amber-700 mt-6 mb-3">This is a photo of the town of Cancun</h3>
		<img
			src="https://images.unsplash.com/photo-1552074284-5e88ef1aef18"
			alt="Beautiful Cancun beach with turquoise water and white sand"
			class="w-full max-w-lg rounded-lg shadow-lg mt-2 mx-auto block"
		/>
	</div>
</Shell>
