<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import Button from '$lib/components/Button.svelte';

  interface SizeOption {
    label: string;
    dimensions: string;
    price: string;
    width: string;
    height: string;
  }

  const sizes: SizeOption[] = [
    { label: 'Full Page', dimensions: '10 in x 4 in', price: '$150', width: '240px', height: '600px' },
    { label: 'Half Page', dimensions: '5 in x 4 in', price: '$90', width: '240px', height: '300px' },
    { label: 'Quarter Page', dimensions: '2.5 in x 4 in', price: '$50', width: '240px', height: '150px' }
  ];

  let encouragementSize = $state(0);
  let businessSize = $state(0);

  let currentEncouragementSize: SizeOption = $derived(sizes[encouragementSize]!);
  let currentBusinessSize: SizeOption = $derived(sizes[businessSize]!);
</script>

<Shell title="Program Ad Space">
  <div class="mx-auto max-w-3xl space-y-12 px-4 py-8 pb-24 text-lg leading-relaxed">
    <p class="font-light text-gray-800">
      Our printed event program is handed to every participant, parent, and judge at the hackathon. Place an ad to support the event and
      connect with our community of students, families, and educators — or create an ad to further encourage your students.
    </p>

    <p class="text-base font-light text-gray-600">
      Half page and full page ads can include a photo or logo — just upload it with your order.
    </p>

    <!-- Pricing overview -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b-2 border-gray-200">
            <th class="py-3 pr-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Size</th>
            <th class="py-3 pr-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Dimensions</th>
            <th class="py-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Price</th>
          </tr>
        </thead>
        <tbody>
          {#each sizes as size}
            <tr class="border-b border-gray-100">
              <td class="py-3 pr-4 font-medium text-gray-900">{size.label}</td>
              <td class="py-3 pr-4 text-gray-600">{size.dimensions}</td>
              <td class="py-3 font-semibold text-gray-900">{size.price}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Encouragement Message -->
    <div>
      <h2 class="mb-1 text-2xl font-bold text-gray-900">Encouragement Message</h2>
      <p class="mb-4 font-light text-gray-600">
        A simple written message to cheer on your student or team. Your words of support will be printed in the program and handed directly
        to them on event day. Half and full page ads can include a photo.
      </p>

      <div class="mb-4 flex gap-2">
        {#each sizes as size, i}
          <button
            class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {encouragementSize === i
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
            onclick={() => (encouragementSize = i)}>{size.label}</button
          >
        {/each}
      </div>

      <div
        class="mx-auto flex flex-col items-center justify-center overflow-hidden rounded-lg border-2 p-4"
        style="border-color: #b8960c; width: {currentEncouragementSize.width}; height: {currentEncouragementSize.height};"
      >
        <div class="text-center" style="max-width: 180px;">
          {#if encouragementSize <= 1}
            <div class="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                /></svg
              >
            </div>
          {/if}
          <p
            class="font-bold text-gray-900"
            class:text-lg={encouragementSize === 0}
            class:text-base={encouragementSize === 1}
            class:text-sm={encouragementSize === 2}
          >
            Alex, we are SO proud of you!
          </p>
          {#if encouragementSize === 0}
            <p class="mt-2 text-xs italic text-gray-700">
              From your very first "Hello World" to building real apps &mdash; watching you grow as a coder and a person has been the
              greatest joy. Today, show them what you've got. We'll be cheering the loudest!
            </p>
            <p class="mt-3 text-xs" style="color: #b8960c;">Love, Mom & Dad</p>
            <p class="mt-1 text-xs text-gray-500">&mdash; The Martinez Family</p>
          {:else if encouragementSize === 1}
            <p class="mt-1 text-xs italic text-gray-700">We're so proud of everything you've built. Show them what you've got!</p>
            <p class="mt-2 text-xs" style="color: #b8960c;">Love, Mom & Dad</p>
          {:else}
            <p class="mt-1 text-xs" style="color: #b8960c;">Love, Mom & Dad</p>
          {/if}
        </div>
      </div>
      <p class="mt-2 text-center text-sm text-gray-500">
        {currentEncouragementSize.label} &mdash; {currentEncouragementSize.dimensions} &mdash; {currentEncouragementSize.price}
      </p>
    </div>

    <!-- Example: Real Ad -->
    <div>
      <h2 class="mb-1 text-2xl font-bold text-gray-900">Example Ad</h2>
      <p class="mb-4 font-light text-gray-600">Here's an example of what an encouragement ad with photo.</p>

      <div class="mx-auto overflow-hidden rounded-lg border-2" style="border-color: #b8960c; width: 240px;">
        <img src="/assets/ad.people.jpg" alt="Example encouragement ad" class="h-auto w-full" />
      </div>
    </div>

    <!-- Business Ad Space -->
    <div>
      <h2 class="mb-1 text-2xl font-bold text-gray-900">Business Ad Space</h2>
      <p class="mb-4 font-light text-gray-600">
        Promote your business in the program. Reach hundreds of students, parents, and educators at the event. Half and full page ads can
        include your logo.
      </p>

      <div class="mb-4 flex gap-2">
        {#each sizes as size, i}
          <button
            class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {businessSize === i
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
            onclick={() => (businessSize = i)}>{size.label}</button
          >
        {/each}
      </div>

      <div
        class="mx-auto flex flex-col items-center justify-center overflow-hidden rounded-lg border-2 p-4"
        style="border-color: #b8960c; width: {currentBusinessSize.width}; height: {currentBusinessSize.height};"
      >
        <div class="text-center" style="max-width: 180px;">
          {#if businessSize <= 1}
            <div class="mx-auto mb-2 flex h-12 w-16 items-center justify-center rounded bg-gray-200">
              <span class="text-[10px] font-medium text-gray-400">YOUR LOGO</span>
            </div>
          {/if}
          <p
            class="font-bold text-gray-900"
            class:text-lg={businessSize === 0}
            class:text-base={businessSize === 1}
            class:text-sm={businessSize === 2}
          >
            Your Business Name
          </p>
          {#if businessSize === 0}
            <p class="mt-2 text-xs italic text-gray-700">Your message or tagline here</p>
            <p class="mt-2 text-xs" style="color: #b8960c;">yourwebsite.com</p>
          {:else if businessSize === 1}
            <p class="mt-1 text-xs italic text-gray-700">Your tagline here</p>
          {/if}
        </div>
      </div>
      <p class="mt-2 text-center text-sm text-gray-500">
        {currentBusinessSize.label} &mdash; {currentBusinessSize.dimensions} &mdash; {currentBusinessSize.price}
      </p>
    </div>
  </div>

  <!-- Floating CTA -->
  <div class="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-yellow-400 bg-yellow-50 px-4 py-3 text-center">
    <div class="flex items-center justify-center gap-3">
      <p class="text-sm font-semibold text-gray-900 sm:text-base">Deadline has passed. Support your students with a donation.</p>
      <Button href="/donate" label="Donate" variant="primary" size="sm" />
    </div>
  </div>
</Shell>
