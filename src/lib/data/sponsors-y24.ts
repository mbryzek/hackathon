const baseUrl = 'https://github.com/mbryzek/hackathon-static/blob/main/2024/sponsors/';

const filenames = [
	'mek-review.png',
	'carbon-sustain.png',
	'catalano-coffee.jpg',
	'francesca.jpg',
	'sunrise.png',
	'west-clinton.jpg',
	'pan.jpg',
	'bryzek.jpg',
];

export const sponsorsY24 = filenames.map((filename) => `${baseUrl}${filename}?raw=true`);
