<script lang="ts">
	import Shell from '$lib/components/Shell.svelte';
	import Button from '$lib/components/Button.svelte';
	import { urls } from '$lib/urls';
</script>

<Shell title="Our Vision & Mission">
	<div class="max-w-3xl mx-auto px-4 py-8 space-y-10 text-lg leading-relaxed">
		<!-- Vision -->
		<div>
			<h2 class="text-2xl font-semibold text-gray-800 mb-3">Our Vision</h2>
			<p class="text-gray-800 font-light text-xl">
				To ignite a spark in every student to discover their potential as a creator, problem-solver,
				and entrepreneur through technology.
			</p>
		</div>

		<!-- Mission -->
		<div>
			<h2 class="text-2xl font-semibold text-gray-800 mb-3">Our Mission</h2>
			<p class="text-gray-800 font-light">
				The Bergen Tech Hackathon empowers high school students to bring their ideas to life through
				12 hours of collaborative coding, mentorship, and hands-on learning.
			</p>
		</div>

		<!-- How We Accomplish This -->
		<div>
			<h3 class="text-xl font-semibold text-gray-800 mb-4">We accomplish this by:</h3>
			<div class="flex flex-col gap-y-6">
				<div class="border-l-4 border-yellow-500 pl-5">
					<h4 class="font-semibold text-gray-800">Creating Memorable Experiences</h4>
					<p class="text-gray-700 font-light mt-1">
						We provide an immersive day where students build real projects, overcome challenges,
						and celebrate achievements together.
					</p>
				</div>

				<div class="border-l-4 border-yellow-500 pl-5">
					<h4 class="font-semibold text-gray-800">Embracing Inclusivity</h4>
					<p class="text-gray-700 font-light mt-1">
						No experience required. We welcome students of all skill levels, offering
						opportunities and recognition that ensures everyone, from first-time coders to
						experienced programmers, can succeed.
					</p>
				</div>

				<div class="border-l-4 border-yellow-500 pl-5">
					<h4 class="font-semibold text-gray-800">Fostering Real-World Skills</h4>
					<p class="text-gray-700 font-light mt-1">
						Students work in teams, solve authentic problems, and develop critical skills in
						teamwork, communication, and innovative thinking that prepare them for any career
						path.
					</p>
				</div>

				<div class="border-l-4 border-yellow-500 pl-5">
					<h4 class="font-semibold text-gray-800">Building Community</h4>
					<p class="text-gray-700 font-light mt-1">
						We strengthen relationships among students, educators, families, industry
						professionals, and sponsors.
					</p>
				</div>

				<div class="border-l-4 border-yellow-500 pl-5">
					<h4 class="font-semibold text-gray-800">Inspiring Future Leaders</h4>
					<p class="text-gray-700 font-light mt-1">
						We inspire students to realize that they are creators, not just consumers, fueling
						their ambition to drive change in the future.
					</p>
				</div>
			</div>
		</div>

		<!-- CTA -->
		<div class="flex flex-wrap items-center gap-3 pt-4">
			<Button href={urls.signup} external label="Sign up for 2026" />
			<Button href={urls.donate} label="Support us" variant="secondary" />
		</div>
	</div>
</Shell>
