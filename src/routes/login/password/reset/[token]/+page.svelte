<script lang="ts">
  /**
   * Takes a new password for the reset the link identifies. Every outcome of the submission is a
   * redirect or a message on the form (see `$lib/server/setPassword`), including the token
   * turning out to be spent or expired — which is the only way this page can learn that.
   */
  import SetPasswordCard from '$lib/components/SetPasswordCard.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Reset your password - Bergen Tech Hackathon</title>
</svelte:head>

<SetPasswordCard
  heading="Reset your password"
  intro="Choose a new password for your hackathon account."
  submitLabel="Set my password"
  error={form?.error ?? null}
/>
