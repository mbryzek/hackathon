const baseUrl = 'https://github.com/mbryzek/hackathon-static/blob/main/2025/sponsors/';

const filenames = [
	'mek-review.png',
	'costco.jpg',
	'catalano-coffee.jpg',
	'francesca.jpg',
	'sunrise.png',
	'west-clinton.jpg',
	'bryzek.jpg',
];

export const sponsorsY25 = filenames.map((filename) => `${baseUrl}${filename}?raw=true`);
