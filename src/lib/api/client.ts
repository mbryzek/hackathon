import { config } from '$lib/config';
import {
	createClient as createVoteApiClient,
	type Vote,
	type Event,
	type Project,
	type ProjectVote,
	type EventStatus,
	type VoterType,
} from '$generated/vote-api';
import {
	createClient as createVoteAdminClient,
	type AdminSession,
	type Code,
	type CodeSummary,
	type EventResults,
	type EventForm,
	type ProjectForm,
	type CodeGenerateForm,
	type Tally,
	type ProjectTally,
} from '$generated/vote-admin';

// Re-export types for use in components
export type {
	Vote,
	Event,
	Project,
	ProjectVote,
	EventStatus,
	VoterType,
	AdminSession,
	Code,
	CodeSummary,
	EventResults,
	EventForm,
	ProjectForm,
	CodeGenerateForm,
	Tally,
	ProjectTally,
};

// Alias Event as VoteEvent for backward compatibility
export type VoteEvent = Event;

export interface ValidationError {
	discriminator?: string;
	code?: string;
	message: string;
	field?: string;
}

export interface ApiResponse<T> {
	data?: T;
	errors?: ValidationError[];
	status: number;
}

// Helper to convert generated client responses to ApiResponse format
function toApiResponse<T>(response: { body: unknown; status: number; ok: boolean }): ApiResponse<T> {
	if (response.ok) {
		if (response.status === 204) {
			return { status: response.status };
		}
		return { data: response.body as T, status: response.status };
	}

	if (response.status === 401 || response.status === 422) {
		const errors = response.body as ValidationError[];
		return { errors: Array.isArray(errors) ? errors : [errors], status: response.status };
	}

	if (response.status === 404) {
		return { errors: [{ code: 'not_found', message: 'Not found' }], status: 404 };
	}

	return { errors: [{ code: 'server_error', message: 'Server error' }], status: response.status };
}

// Helper to create authorization header
function getAuthHeaders(sessionId?: string): Record<string, string> {
	if (sessionId) {
		return { session_id: sessionId };
	}
	return {};
}

// Custom fetch wrapper to redirect API calls to configured base URL during development
// The generated client has the production URL hardcoded, so we intercept and rewrite
const PRODUCTION_API_HOST = 'https://api.bthackathon.com';

function createApiClient<T>(createFn: (options: { fetch: typeof fetch }) => T): T {
	const customFetch: typeof fetch = (input, init) => {
		if (typeof input === 'string' && config.apiBaseUrl !== PRODUCTION_API_HOST) {
			// Replace production URL with configured base URL
			const url = input.replace(PRODUCTION_API_HOST, config.apiBaseUrl);
			return fetch(url, init);
		}
		return fetch(input, init);
	};
	return createFn({ fetch: customFetch });
}

// Create API clients
const voteApiClient = createApiClient(createVoteApiClient);
const voteAdminClient = createApiClient(createVoteAdminClient);

// Public API client
export const voteApi = {
	async getOpenEvents(): Promise<ApiResponse<Event[]>> {
		const response = await voteApiClient.events.getAllAndOpen({});
		return toApiResponse<Event[]>(response);
	},

	async verifyCode(eventKey: string, code: string): Promise<ApiResponse<Vote>> {
		const response = await voteApiClient.votes.postCodeAndVerifications({
			event_key: eventKey,
			body: { code },
		});
		return toApiResponse<Vote>(response);
	},

	async submitVote(
		eventKey: string,
		code: string,
		projectIds: string[]
	): Promise<ApiResponse<Vote>> {
		const response = await voteApiClient.votes.post({
			event_key: eventKey,
			body: { code, project_ids: projectIds },
		});
		return toApiResponse<Vote>(response);
	},
};

// Admin API client
export const adminApi = {
	// Session
	async login(email: string, password: string): Promise<ApiResponse<AdminSession>> {
		const response = await voteAdminClient.adminSessions.postSessionsAndLogins({
			body: { email, password },
		});
		return toApiResponse<AdminSession>(response);
	},

	async getSession(sessionId: string): Promise<ApiResponse<AdminSession>> {
		const response = await voteAdminClient.adminSessions.getSession({
			headers: getAuthHeaders(sessionId),
		});
		return toApiResponse<AdminSession>(response);
	},

	async logout(sessionId: string): Promise<ApiResponse<void>> {
		const response = await voteAdminClient.adminSessions.deleteSession({
			headers: getAuthHeaders(sessionId),
		});
		return toApiResponse<void>(response);
	},

	// Events
	async getEvents(
		sessionId: string,
		params?: { status?: EventStatus[]; limit?: number; offset?: number }
	): Promise<ApiResponse<Event[]>> {
		const response = await voteAdminClient.events.get({
			headers: getAuthHeaders(sessionId),
			status: params?.status,
			limit: params?.limit,
			offset: params?.offset,
		});
		return toApiResponse<Event[]>(response);
	},

	async getEvent(sessionId: string, id: string): Promise<ApiResponse<Event>> {
		const response = await voteAdminClient.events.getById({
			headers: getAuthHeaders(sessionId),
			id,
		});
		return toApiResponse<Event>(response);
	},

	async createEvent(
		sessionId: string,
		form: { key: string; name: string; status?: EventStatus }
	): Promise<ApiResponse<Event>> {
		const response = await voteAdminClient.events.post({
			headers: getAuthHeaders(sessionId),
			body: form,
		});
		return toApiResponse<Event>(response);
	},

	async updateEvent(
		sessionId: string,
		id: string,
		form: { key: string; name: string; status?: EventStatus }
	): Promise<ApiResponse<Event>> {
		const response = await voteAdminClient.events.putById({
			headers: getAuthHeaders(sessionId),
			id,
			body: form,
		});
		return toApiResponse<Event>(response);
	},

	async deleteEvent(sessionId: string, id: string): Promise<ApiResponse<void>> {
		const response = await voteAdminClient.events.deleteById({
			headers: getAuthHeaders(sessionId),
			id,
		});
		return toApiResponse<void>(response);
	},

	// Projects
	async getProjects(
		sessionId: string,
		eventId: string,
		params?: { limit?: number; offset?: number }
	): Promise<ApiResponse<Project[]>> {
		const response = await voteAdminClient.projects.get({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
			limit: params?.limit,
			offset: params?.offset,
		});
		return toApiResponse<Project[]>(response);
	},

	async createProject(
		sessionId: string,
		eventId: string,
		form: { name: string; description?: string }
	): Promise<ApiResponse<Project>> {
		const response = await voteAdminClient.projects.post({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
			body: form,
		});
		return toApiResponse<Project>(response);
	},

	async updateProject(
		sessionId: string,
		eventId: string,
		id: string,
		form: { name: string; description?: string }
	): Promise<ApiResponse<Project>> {
		const response = await voteAdminClient.projects.putById({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
			id,
			body: form,
		});
		return toApiResponse<Project>(response);
	},

	async deleteProject(sessionId: string, eventId: string, id: string): Promise<ApiResponse<void>> {
		const response = await voteAdminClient.projects.deleteById({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
			id,
		});
		return toApiResponse<void>(response);
	},

	async reorderProjects(
		sessionId: string,
		eventId: string,
		projectIds: string[]
	): Promise<ApiResponse<void>> {
		const response = await voteAdminClient.projects.postReorder({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
			body: { project_ids: projectIds },
		});
		return toApiResponse<void>(response);
	},

	// Codes
	async getCodes(
		sessionId: string,
		eventId: string,
		params?: { voter_type?: VoterType; has_voted?: boolean; q?: string; limit?: number; offset?: number }
	): Promise<ApiResponse<Code[]>> {
		const response = await voteAdminClient.codes.get({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
			voter_type: params?.voter_type,
			has_voted: params?.has_voted,
			q: params?.q,
			limit: params?.limit,
			offset: params?.offset,
		});
		return toApiResponse<Code[]>(response);
	},

	async getCodeSummary(sessionId: string, eventId: string): Promise<ApiResponse<CodeSummary>> {
		const response = await voteAdminClient.codes.getSummary({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
		});
		return toApiResponse<CodeSummary>(response);
	},

	async generateCodes(
		sessionId: string,
		eventId: string,
		form: { voter_type: VoterType; count: number }
	): Promise<ApiResponse<Code[]>> {
		const response = await voteAdminClient.codes.postGenerate({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
			body: form,
		});
		return toApiResponse<Code[]>(response);
	},

	async deleteCode(sessionId: string, eventId: string, id: string): Promise<ApiResponse<void>> {
		const response = await voteAdminClient.codes.deleteById({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
			id,
		});
		return toApiResponse<void>(response);
	},

	// Results
	async getResults(sessionId: string, eventId: string): Promise<ApiResponse<EventResults>> {
		const response = await voteAdminClient.eventResults.get({
			headers: getAuthHeaders(sessionId),
			event_id: eventId,
		});
		return toApiResponse<EventResults>(response);
	},
};
