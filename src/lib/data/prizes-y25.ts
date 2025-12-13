export interface Prize {
	title: string;
	amount: string;
	description: string;
}

export const overallPrizes: Prize[] = [
	{
		title: '1st Place',
		amount: '$1,000 Cash',
		description:
			'Highest # of points in judging criteria. Any ties are broken by the judges.',
	},
	{
		title: '2nd Place',
		amount: '$500 Cash',
		description:
			'2nd highest # of points based on judging criteria. Any ties are broken by the judges.',
	},
	{
		title: '3rd Place',
		amount: '$250 Cash',
		description:
			'3rd highest # of points based on judging criteria. Any ties are broken by the judges.',
	},
];

export const additionalPrizes: Prize[] = [
	{
		title: 'Best Mobile Application',
		amount: '$500 Cash',
		description:
			'Awarded to the team with the highest # of points that has built a native mobile application (android or iOs).',
	},
	{
		title: 'Cybersecurity',
		amount: '$500 Cash',
		description:
			'An application built to directly improve cyber security in some way. This criterion will be independently evaluated by the judges.',
	},
	{
		title: 'Freshman Prize',
		amount: '$250 Cash',
		description:
			'Awarded to the team with the highest # of points with all members in their first year of high school.',
	},
	{
		title: 'New Coder Prize',
		amount: '$250 Cash',
		description:
			'Awarded to the team with the highest # of points with all members as New Coders. A new coder is somebody to have less than 1 year experience with any type of coding.',
	},
	{
		title: 'Best use of Artificial Intelligence',
		amount: '$250 Cash',
		description:
			'Awarded to the team that presents the most interesting / novel use of a large language model. This criterion will be independently evaluated by the judges.',
	},
	{
		title: 'Best Device (Robotics / Arduino / etc.)',
		amount: '$250 Cash',
		description:
			'The idea here is to encourage students to build robotic, arduino, etc devices / products',
	},
	{
		title: 'Best Visual Design',
		amount: '$250 Cash',
		description:
			'Awarded to the team that presents the most engaging Visual Design. This criterion will be independently evaluated by the judges.',
	},
	{
		title: "Student's Choice Award",
		amount: '$250 Cash',
		description:
			"Students will each submit a single vote for which team they think should win - The team with the most votes will earn the Student Choice award. For this award, ties will split the prize.",
	},
	{
		title: "Parent's Choice Award",
		amount: '$250 Cash',
		description:
			"Attending parents will each submit a single vote for which team they think should win - The team with the most votes will earn the Student Choice award. For this award, ties will split the prize.",
	},
];
