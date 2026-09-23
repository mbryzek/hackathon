<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} — Bergen Tech Hackathon</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
  <div class="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
    <h1 class="text-xl font-semibold text-gray-900">{page.status === 404 ? 'Not found' : 'Something went wrong'}</h1>
    <p class="mt-2 text-gray-600">{page.error?.message}</p>
    {#if page.error?.errorId}
      <!-- The id the server logged this under. Quoting it is the only way a report connects
           to a line in the Worker log. -->
      <p class="mt-2 text-sm text-gray-500">Reference {page.error.errorId}</p>
    {/if}
    <a href="/" class="mt-6 inline-block text-blue-600 hover:underline">Back to home</a>
  </div>
</div>
