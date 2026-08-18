<script lang="ts">
  import Shell from '$lib/components/Shell.svelte';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import { urls } from '$lib/urls';

  interface ScheduleItem {
    time: string;
    event: string;
    details: string;
  }

  const schedule: ScheduleItem[] = [
    {
      time: '8:30 AM',
      event: 'Registration & Check-In',
      details: 'Check in, receive your welcome packet, and enjoy breakfast in the gym.'
    },
    { time: '9:00 AM', event: 'Opening Ceremony', details: 'Official kickoff! Schedule overview, logistics, judging criteria, and more.' },
    { time: '9:15 AM', event: 'Hackathon Coding Starts', details: 'Start building your projects!' },
    { time: '10:00 AM', event: 'AI Workshop', details: 'Learn how to build with AI tools and integrate them into your projects.' },
    { time: '12:30 PM', event: 'Lunch Break', details: 'Lunch served outside the gym — take a break and recharge.' },
    { time: '2:00 PM', event: 'Industry Speaker', details: 'Dwight Merriman – founder of Double Click, MongoDB, race car driver and more' },
    { time: '4:00 PM', event: 'Industry Speaker', details: 'Michael Lysaght from Instructure, Weight Watchers, Nasdaq.' },
    { time: '4:10 PM', event: 'Snack Break', details: 'Quick break — grab some snacks and keep coding!' },
    { time: '6:10 PM', event: 'Dinner Break', details: 'All students stop working. Fuel up for your presentations.' },
    { time: '6:20 PM', event: 'Science Fair', details: 'Setup and share your projects with judges and parents' },
    {
      time: '8:15 PM',
      event: 'Student & Parent Choice Awards, Raffle and Photo',
      details: 'Vote for your favorite project and win raffle prizes!'
    },
    { time: '8:30 PM', event: 'Awards Ceremony', details: 'See Demos from teams contending for 1st, 2nd, and 3rd. All prizes awarded.' },
    { time: '9:00 PM', event: 'Event Finished', details: 'See you next year!' }
  ];

  interface Tip {
    title: string;
    description: string;
  }

  const tips: Tip[] = [
    {
      title: 'Solve a real problem',
      description: 'Pick something that matters to you or your community. Judges love projects with heart.'
    },
    { title: 'Keep it simple and functional', description: "A polished, working prototype beats an ambitious idea that doesn't run." },
    { title: 'Focus on one strong feature', description: "Don't try to build everything — nail one thing really well." },
    { title: 'Use AI wisely', description: 'Show that you understand how AI enhances your project, not just that you used it.' },
    { title: 'Make your demo work reliably', description: 'Test it before presentations.' }
  ];
</script>

<Shell title="2026 Program">
  <div class="mx-auto max-w-3xl space-y-10 px-4 py-8 text-lg leading-relaxed">
    <!-- Theme -->
    <div class="border-l-4 border-yellow-500 py-2 pl-6">
      <h2 class="mb-2 text-2xl font-bold text-gray-800">2026 Theme: Build</h2>
      <p class="font-light text-gray-800">
        This year's theme is simple and powerful: <span class="font-semibold">Build</span>. Whether you're building an AI-powered app, a
        cybersecurity tool, a game, or a solution to a real-world problem, today is about turning your ideas into reality.
      </p>
    </div>

    <!-- Welcome Messages -->
    <div class="space-y-6">
      <h2 class="text-2xl font-semibold text-gray-800">Welcome</h2>

      <div class="border-l-4 border-yellow-400 py-2 pl-6">
        <p class="font-light italic text-gray-800">
          "Today isn't about getting everything perfect. In fact, perfection is what stands in the way of creating something that endures
          beyond tomorrow. Innovation can only take place when you move beyond ideas. Stop thinking and start doing! At the end of the day,
          the team with the most failures will be the only one left standing."
        </p>
        <p class="mt-2 font-semibold text-gray-600">— David Tankard, Principal, Bergen Tech</p>
      </div>

      <div class="border-l-4 border-yellow-400 py-2 pl-6">
        <p class="font-light italic text-gray-800">
          "Hackathons are about exploring, learning, and creating. Today you get to take what you know and turn it into something real. You
          might hit walls and change direction along the way. That's exactly how the best ideas take shape. Stay curious, keep
          experimenting, and go make something you're proud of!"
        </p>
        <p class="mt-2 font-semibold text-gray-600">— Emre Gemici, Bergen Tech Teacher</p>
      </div>

      <div class="border-l-4 border-yellow-400 py-2 pl-6">
        <p class="font-light italic text-gray-800">
          "Today you chose to come here early, prepared to spend all day working together with your teammates to create projects and
          prototypes that could potentially change people's lives. You will meet like-minded people, get professional feedback, and talk to
          industry leaders. You are all so very impressive. Be proud of yourself, because we are all proud of you!"
        </p>
        <p class="mt-2 font-semibold text-gray-600">— Michael Yob, Applied Tech Teacher</p>
      </div>
    </div>

    <!-- Schedule -->
    <div>
      <h2 class="mb-6 text-2xl font-semibold text-gray-800">Schedule</h2>
      <div class="ml-2 border-l-2 border-yellow-300">
        {#each schedule as item}
          <div class="relative flex items-start gap-4 py-3 pl-6">
            <span class="absolute -left-[5px] top-4 h-2 w-2 rounded-full bg-yellow-500"></span>
            <span class="w-24 shrink-0 text-sm font-semibold text-yellow-600">{item.time}</span>
            <div>
              <span class="font-semibold text-gray-800">{item.event}</span>
              <p class="text-base font-light text-gray-600">{item.details}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- The Challenge -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold text-gray-800">The Challenge</h2>
      <p class="font-light text-gray-800">
        Identify a real-world problem that matters to you and build a technology solution to address it. Your project should demonstrate
        creativity, technical skill, and meaningful impact.
      </p>

      <h3 class="mb-3 mt-6 text-xl font-semibold text-gray-800">Required Deliverables</h3>
      <ul class="space-y-3">
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          <span
            ><span class="font-semibold">Working Prototype:</span> A functional demo of your solution (app, website, tool, robot, etc.)</span
          >
        </li>
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          <span
            ><span class="font-semibold">7-Minute Pitch & Demo:</span> Present your project to the judges with a clear problem statement, solution,
            and live demo walkthrough.</span
          >
        </li>
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          <span
            ><span class="font-semibold">No Slides Required:</span> Focus on showing your project working. The demo and walkthrough is what matters
            most.</span
          >
        </li>
      </ul>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <Button href={urls.y26Rubric} label="Rubric" size="sm" variant="secondary" />
        <Button href={urls.y26Prizes} label="Prizes" size="sm" variant="secondary" />
      </div>
    </div>

    <!-- Rules & Guidelines -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold text-gray-800">Rules & Guidelines</h2>

      <h3 class="mb-3 mt-4 text-xl font-semibold text-gray-800">Team Rules</h3>
      <ul class="space-y-3">
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          Teams of 1–4 students
        </li>
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          All team members must be registered participants
        </li>
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          Teams can be formed before or during the event
        </li>
      </ul>

      <h3 class="mb-3 mt-6 text-xl font-semibold text-gray-800">Project Rules</h3>
      <ul class="space-y-3">
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          All projects must be built during hackathon hours
        </li>
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          No pre-written full projects allowed — you may bring ideas, wireframes, and plans
        </li>
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          You can use open-source libraries, frameworks, and APIs
        </li>
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          AI tools are allowed and encouraged (unless competing in the No AI category)
        </li>
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          You must be able to explain your code and how AI was used
        </li>
        <li class="flex items-start gap-3 font-light text-gray-800">
          <span class="mt-1 text-yellow-500">&#9679;</span>
          Your project must be your own original work — no plagiarism
        </li>
      </ul>

      <h3 class="mb-3 mt-6 text-xl font-semibold text-gray-800">Code of Conduct</h3>
      <p class="font-light text-gray-800">
        The Bergen Tech Hackathon is committed to providing a welcoming, inclusive, and harassment-free experience for everyone. We expect
        all participants, mentors, judges, and volunteers to treat everyone with respect and kindness, be collaborative and supportive of
        other teams, ask for help when you need it, and report any concerns to an organizer immediately.
      </p>
    </div>

    <!-- How to Win -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold text-gray-800">How to Win</h2>
      <p class="mb-4 font-light text-gray-800">
        You don't need to build the most complex project to win. Here's what past winners and judges say makes a great hackathon project:
      </p>
      <ol class="space-y-4">
        {#each tips as tip, i}
          <li class="flex items-start gap-4">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-sm font-bold text-white"
              >{i + 1}</span
            >
            <div>
              <span class="font-semibold text-gray-800">{tip.title}.</span>
              <span class="font-light text-gray-800"> {tip.description}</span>
            </div>
          </li>
        {/each}
      </ol>
    </div>

    <!-- Speakers -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold text-gray-800">Speakers</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card variant="bordered" padding="md">
          <h3 class="mb-2 text-lg font-semibold text-gray-800">Michael Lysaght</h3>
          <p class="text-base font-light text-gray-600">
            Technology executive with 25+ years leading digital transformation at scale. Currently CTO at Instructure, leading the
            engineering teams behind Canvas, Mastery, and Learn. Previously CTO at Weight Watchers where he orchestrated a major digital
            overhaul. Earlier led engineering at Second Market, later acquired by Nasdaq.
          </p>
        </Card>
        <Card variant="bordered" padding="md">
          <h3 class="mb-2 text-lg font-semibold text-gray-800">Dwight Merriman</h3>
          <p class="text-base font-light text-gray-600">
            Software engineer turned serial entrepreneur who spent 25 years building the New York tech ecosystem. Co-founder of DoubleClick,
            Business Insider, Gilt Groupe, and MongoDB — where he served as CEO and wrote much of the early code. Also a professional
            endurance racing driver with 60+ race starts, 9 wins, and 20 podiums.
          </p>
        </Card>
      </div>
    </div>

    <!-- Closing -->
    <div class="py-4 text-center">
      <p class="font-light text-gray-600">Organized by Bergen Youth Enrichment, a 501(c)(3) nonprofit</p>
      <p class="mt-1 font-light text-gray-600">bthackathon.com &middot; info@bthackathon.com</p>
    </div>
  </div>
</Shell>
