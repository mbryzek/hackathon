<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import Card from '$lib/components/Card.svelte';

  const email = 'bergenyouthenrichment@gmail.com';
  let copied = $state(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(email);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    }
  }
</script>

<Shell title="Contact The Hackathon Organizers">
  <div class="mx-auto max-w-2xl space-y-8 px-4 py-8">
    <!-- Introduction -->
    <p class="text-center text-lg font-light text-gray-800">
      The Bergen Tech Hackathon is run by Bergen Youth Enrichment, a 501(c)(3) non-profit organization which is 100% volunteer-run.
    </p>

    <!-- Contact Card -->
    <Card variant="elevated">
      {#snippet header()}
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-blue-100 p-2">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900">Get In Touch</h2>
        </div>
      {/snippet}

      <div class="space-y-6">
        <!-- Contact Person -->
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
            <svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <p class="text-lg font-semibold text-gray-900">Michael Bryzek</p>
            <p class="text-gray-600">Event Organizer</p>
          </div>
        </div>

        <!-- Email with Copy Button -->
        <div class="flex flex-col items-start gap-3 rounded-lg bg-gray-50 p-4 sm:flex-row sm:items-center">
          <div class="flex min-w-0 flex-grow items-center gap-3">
            <svg class="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <a href="mailto:{email}" class="truncate font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800">
              {email}
            </a>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {copied
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
            onclick={copyToClipboard}
          >
            {#if copied}
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            {:else}
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            {/if}
          </button>
        </div>

        <!-- Quick Action -->
        <div class="pt-2 text-center">
          <a
            href="mailto:{email}"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Send Email
          </a>
        </div>
      </div>
    </Card>
  </div>
</Shell>
