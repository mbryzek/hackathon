export const urls = {
	index: '/',
	signup: 'https://signup.bthackathon.com',
	y24Index: '/Y24/',
	y24Photos: '/Y24/photos',
	y24Sponsors: '/Y24/sponsors',
	y25Index: '/Y25/',
	y25Demos: '/Y25/demos',
	y25Photos: '/Y25/photos',
	y25Sponsors: '/Y25/sponsors',
	y25Prizes: '/Y25/prizes',
	y25Rubric: '/Y25/rubric',
	donate: '/donate',
	contact: '/contact',

	// Voting routes
	vote: '/vote',
	voteEvent: (eventKey: string) => `/vote/${eventKey}`,
	voteThanks: (eventKey: string) => `/vote/${eventKey}/thanks`,

	// Admin routes
	voteAdminLogin: '/vote/admin/login',
	voteAdmin: '/vote/admin',
	voteAdminEventsNew: '/vote/admin/events/new',
	voteAdminEvent: (id: string) => `/vote/admin/events/${id}`,
	voteAdminEventProjects: (id: string) => `/vote/admin/events/${id}/projects`,
	voteAdminEventCodes: (id: string) => `/vote/admin/events/${id}/codes`,
	voteAdminEventResults: (id: string) => `/vote/admin/events/${id}/results`,
} as const;
