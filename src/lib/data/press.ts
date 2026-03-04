export interface PressRelease {
	title: string;
	/** Display date, e.g. "March 2026" */
	date: string;
	/** ISO month for semantic markup, e.g. "2026-03" */
	dateIso: string;
	summary: string;
	pdfUrl: string;
}

export const pressReleases: PressRelease[] = [
	{
		title: 'Student-Organized Hackathon Returns to Bergen Tech',
		date: 'March 2026',
		dateIso: '2026-03',
		summary:
			'On Saturday, April 18, 2026, Bergen County Technical High School will host the third annual Bergen Tech Hackathon, a full-day coding competition organized by high school students. Running from 9:00 AM to 9:00 PM at the Teterboro campus, the event invites students of all skill levels—from first-time coders to experienced programmers—to form teams, build original software projects, and compete for over $5,000 in cash prizes. Entry is free for all participants.',
		pdfUrl: '/press/2026-03-press-release.pdf',
	},
];
