<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import Button from '$lib/components/Button.svelte';
  import { urls } from '$lib/urls';
</script>

<Shell title="2024 Hackathon Event Summary">
  <div class="mx-auto max-w-3xl space-y-6 px-4 py-8 text-lg leading-relaxed">
    <p class="font-light text-gray-800">
      The inaugural 2024 Bergen Tech Hackathon was a huge success! We wanted to deeply thank you for your support and share a few highlights
      from the day - we could not have put this event together without you!
    </p>

    <div class="text-center">
      <Button href={urls.y24EventSummary} label="Download our 2024 event summary" external />
    </div>

    <p class="font-light text-gray-800">
      52 students from grades 9-12 competed in a 12-hour coding event. From idea generation to building their apps and projects to final
      presentations, the students impressed everyone involved.
    </p>

    <!-- Projects Section -->
    <div class="mt-4 pl-4">
      <h3 class="mb-2 text-xl font-semibold text-gray-800">Projects</h3>
      <ul class="list-disc space-y-2 pl-6">
        <li class="pl-2 font-light text-gray-800">AI Recipe Generator: Enter ingredients to get tailored recipes using AI.</li>
        <li class="pl-2 font-light text-gray-800">Disease Identifier: Identifies diseases based on symptoms with AI assistance.</li>
        <li class="pl-2 font-light text-gray-800">Competition Platform: An end-to-end platform for creating and hosting events.</li>
        <li class="pl-2 font-light text-gray-800">Drawing Game: A browser-based recreation of Microsoft Paint.</li>
        <li class="pl-2 font-light text-gray-800">Carbon Movement Tracker: Tracks carbon emissions based on transportation mode.</li>
        <li class="pl-2 font-light text-gray-800">Spotify Mood Playlist: Generates Spotify playlists based on mood using AI.</li>
        <li class="pl-2 font-light text-gray-800">Find Your Lost Dog: A drone algorithm to locate lost pets efficiently.</li>
      </ul>
    </div>

    <!-- By the Numbers Section -->
    <div class="mt-4 pl-4">
      <h2 class="mb-2 text-2xl font-semibold text-gray-800">By the Numbers</h2>
      <ul class="list-disc space-y-2 pl-6">
        <li class="pl-2 font-light text-gray-800">52 student participants</li>
        <li class="pl-2 font-light text-gray-800">18 teams</li>
        <li class="pl-2 font-light text-gray-800">10 awards</li>
        <li class="pl-2 font-light text-gray-800">$5,730 in prizes</li>
        <li class="pl-2 font-light text-gray-800">8 sponsors</li>
        <li class="pl-2 font-light text-gray-800">~50 donors</li>
        <li class="pl-2 font-light text-gray-800">~20 volunteers</li>
        <li class="pl-2 font-light text-gray-800">5 industry speakers</li>
      </ul>
      <img class="mt-4" src={urls.y24GroupPhoto} alt="Students jumping in celebration at the 2024 hackathon" />
    </div>
  </div>
</Shell>
