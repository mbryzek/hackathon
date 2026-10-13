<!--
  The signed-in admin's own page, reached from Your Profile in the account menu. The layout's
  load supplies the name and email; nothing here calls the API.
-->
<script lang="ts">
  import Card from '#lib/components/Card.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Your Profile - Vote Admin</title>
</svelte:head>

<div class="max-w-2xl animate-fade-in">
  <h1 class="mb-6 text-2xl font-bold text-gray-900">Your Profile</h1>

  <Card variant="bordered">
    <dl class="grid grid-cols-1 gap-4 sm:grid-cols-[8rem_1fr]">
      <dt class="text-sm font-medium text-gray-500">Name</dt>
      <dd class="text-gray-900" data-testid="profile-name">{data.admin?.name ?? '—'}</dd>
      <dt class="text-sm font-medium text-gray-500">Email</dt>
      <dd class="break-all text-gray-900" data-testid="profile-email">{data.admin?.email ?? '—'}</dd>
    </dl>
  </Card>
</div>
