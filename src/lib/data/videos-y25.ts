import type { VideoInfo } from '$lib/components/VideoGallery.svelte';

const baseUrl = 'https://github.com/mbryzek/hackathon-static/blob/main/2025/demos/';

const videos: { title: string; filename: string }[] = [
	{ title: 'Team 5: Net Reaper', filename: 'team5.mov' },
	{ title: 'Team 2: Community Connect', filename: 'team2.mov' },
	{ title: 'Team 21: RPGain', filename: 'team21.mp4' },
	{ title: 'Team 22: NGO & Co.', filename: 'team22.mov' },
];

export const videosY25: VideoInfo[] = videos.map((v) => ({
	title: v.title,
	url: `${baseUrl}${v.filename}?raw=true`,
}));
