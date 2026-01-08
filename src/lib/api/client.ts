import { config } from '$lib/config';
import {
	ApiClient as VoteApiClient,
	type Vote,
	type Event,
	type Project,
	type ProjectVote,
	EventStatus,
	VoterType,
} from '../../generated/com-bryzek-vote-api-v0';
import {
	ApiClient as VoteAdminClient,
	type AdminSession,
	type Code,
	type CodeSummary,
	type EventResults,
	type EventForm,
	type ProjectForm,
	type CodeGenerateForm,
	type Tally,
	type ProjectTally,
} from '../../generated/com-bryzek-vote-admin-v0';
import { ValidationErrorsResponse } from '../../generated/generated-error-validation-errors-response';
import { UnauthorizedErrorsResponse } from '../../generated/generated-error-unauthorized-errors-response';
import { VoidResponse } from '../../generated/generated-error-void-response';

// Re-export types for use in components
export type {
	Vote,
	Event,
	Project,
	ProjectVote,
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

export { EventStatus, VoterType };

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

// Create API clients
const voteApiClient = new VoteApiClient(config.apiBaseUrl);
const voteAdminClient = new VoteAdminClient(config.apiBaseUrl);

// Helper to create authorization header
function getAuthHeaders(sessionId?: string): Record<string, string> {
	if (sessionId) {
		return { session_id: sessionId };
	}
	return {};
}

// Helper to handle API errors and convert to ApiResponse format
async function handleApiCall<T>(
	apiCall: () => Promise<T>,
	successStatus: number = 200
): Promise<ApiResponse<T>> {
	try {
		const data = await apiCall();
		return { data, status: successStatus };
	} catch (error) {
		if (error instanceof ValidationErrorsResponse) {
			const validationErrors = await error.validationErrors();
			return {
				errors: validationErrors.map((e) => ({
					discriminator: e.discriminator,
					message: e.message,
					field: e.field,
				})),
				status: error.response.status,
			};
		}

		if (error instanceof UnauthorizedErrorsResponse) {
			return {
				errors: [{ code: 'unauthorized', message: 'Unauthorized' }],
				status: 401,
			};
		}

		if (error instanceof VoidResponse) {
			return {
				errors: [{ code: 'not_found', message: 'Not found' }],
				status: 404,
			};
		}

		return {
			errors: [{ code: 'server_error', message: 'Server error' }],
			status: 500,
		};
	}
}

// Helper for void responses
async function handleVoidApiCall(
	apiCall: () => Promise<void>,
	successStatus: number = 204
): Promise<ApiResponse<void>> {
	try {
		await apiCall();
		return { status: successStatus };
	} catch (error) {
		if (error instanceof ValidationErrorsResponse) {
			const validationErrors = await error.validationErrors();
			return {
				errors: validationErrors.map((e) => ({
					discriminator: e.discriminator,
					message: e.message,
					field: e.field,
				})),
				status: error.response.status,
			};
		}

		if (error instanceof UnauthorizedErrorsResponse) {
			return {
				errors: [{ code: 'unauthorized', message: 'Unauthorized' }],
				status: 401,
			};
		}

		if (error instanceof VoidResponse) {
			return {
				errors: [{ code: 'not_found', message: 'Not found' }],
				status: 404,
			};
		}

		return {
			errors: [{ code: 'server_error', message: 'Server error' }],
			status: 500,
		};
	}
}

// Public API client
export const voteApi = {
	async getOpenEvents(): Promise<ApiResponse<Event[]>> {
		return handleApiCall(() => voteApiClient.getAllEventsOpen({}));
	},

	async verifyCode(eventKey: string, code: string): Promise<ApiResponse<Vote>> {
		return handleApiCall(() =>
			voteApiClient.createVoteCodeAndVerifications({
				eventKey,
				body: { code },
			})
		);
	},

	async submitVote(eventKey: string, code: string, projectIds: string[]): Promise<ApiResponse<Vote>> {
		return handleApiCall(() =>
			voteApiClient.createVote({
				eventKey,
				body: { code, project_ids: projectIds },
			})
		);
	},
};

// Admin API client
export const adminApi = {
	// Session
	async login(email: string, password: string): Promise<ApiResponse<AdminSession>> {
		return handleApiCall(
			() =>
				voteAdminClient.createAdminSessionSessionsAndLogins({
					body: { email, password },
				}),
			201
		);
	},

	async getSession(sessionId: string): Promise<ApiResponse<AdminSession>> {
		return handleApiCall(() =>
			voteAdminClient.getAdminSessionSession({
				headers: getAuthHeaders(sessionId),
			})
		);
	},

	async logout(sessionId: string): Promise<ApiResponse<void>> {
		return handleVoidApiCall(() =>
			voteAdminClient.deleteAdminSessionSession({
				headers: getAuthHeaders(sessionId),
			})
		);
	},

	// Events
	async getEvents(
		sessionId: string,
		params?: { status?: EventStatus[]; limit?: number; offset?: number }
	): Promise<ApiResponse<Event[]>> {
		return handleApiCall(() =>
			voteAdminClient.getEvents({
				headers: getAuthHeaders(sessionId),
				status: params?.status,
				limit: params?.limit ?? 100,
				offset: params?.offset ?? 0,
			})
		);
	},

	async getEvent(sessionId: string, id: string): Promise<ApiResponse<Event>> {
		return handleApiCall(() =>
			voteAdminClient.getEventById(id, {
				headers: getAuthHeaders(sessionId),
			})
		);
	},

	async createEvent(
		sessionId: string,
		form: { key: string; name: string; status?: EventStatus }
	): Promise<ApiResponse<Event>> {
		return handleApiCall(
			() =>
				voteAdminClient.createEvent({
					headers: getAuthHeaders(sessionId),
					body: form,
				}),
			201
		);
	},

	async updateEvent(
		sessionId: string,
		id: string,
		form: { key: string; name: string; status?: EventStatus }
	): Promise<ApiResponse<Event>> {
		return handleApiCall(() =>
			voteAdminClient.updateEventById({
				headers: getAuthHeaders(sessionId),
				id,
				body: form,
			})
		);
	},

	async deleteEvent(sessionId: string, id: string): Promise<ApiResponse<void>> {
		return handleVoidApiCall(() =>
			voteAdminClient.deleteEventById(id, {
				headers: getAuthHeaders(sessionId),
			})
		);
	},

	// Projects
	async getProjects(
		sessionId: string,
		eventId: string,
		params?: { limit?: number; offset?: number }
	): Promise<ApiResponse<Project[]>> {
		return handleApiCall(() =>
			voteAdminClient.getProjects({
				headers: getAuthHeaders(sessionId),
				eventId,
				limit: params?.limit ?? 100,
				offset: params?.offset ?? 0,
			})
		);
	},

	async createProject(
		sessionId: string,
		eventId: string,
		form: { name: string; description?: string }
	): Promise<ApiResponse<Project>> {
		return handleApiCall(
			() =>
				voteAdminClient.createProject({
					headers: getAuthHeaders(sessionId),
					eventId,
					body: form,
				}),
			201
		);
	},

	async updateProject(
		sessionId: string,
		eventId: string,
		id: string,
		form: { name: string; description?: string }
	): Promise<ApiResponse<Project>> {
		return handleApiCall(() =>
			voteAdminClient.updateProjectById({
				headers: getAuthHeaders(sessionId),
				eventId,
				id,
				body: form,
			})
		);
	},

	async deleteProject(sessionId: string, eventId: string, id: string): Promise<ApiResponse<void>> {
		return handleVoidApiCall(() =>
			voteAdminClient.deleteProjectById({
				headers: getAuthHeaders(sessionId),
				eventId,
				id,
			})
		);
	},

	async reorderProjects(sessionId: string, eventId: string, projectIds: string[]): Promise<ApiResponse<void>> {
		return handleVoidApiCall(() =>
			voteAdminClient.createProjectReorder({
				headers: getAuthHeaders(sessionId),
				eventId,
				body: { project_ids: projectIds },
			})
		);
	},

	async createProjectCsv(sessionId: string, eventId: string, data: string): Promise<ApiResponse<void>> {
		return handleVoidApiCall(() =>
			voteAdminClient.createProjectCsv({
				headers: getAuthHeaders(sessionId),
				eventId,
				body: { data },
			})
		);
	},

	// Codes
	async getCodes(
		sessionId: string,
		eventId: string,
		params?: { voter_type?: VoterType; has_voted?: boolean; q?: string; limit?: number; offset?: number }
	): Promise<ApiResponse<Code[]>> {
		return handleApiCall(() =>
			voteAdminClient.getCodes({
				headers: getAuthHeaders(sessionId),
				eventId,
				voterType: params?.voter_type,
				hasVoted: params?.has_voted,
				q: params?.q,
				limit: params?.limit ?? 100,
				offset: params?.offset ?? 0,
			})
		);
	},

	async getCodeSummary(sessionId: string, eventId: string): Promise<ApiResponse<CodeSummary>> {
		return handleApiCall(() =>
			voteAdminClient.getCodeSummary(eventId, {
				headers: getAuthHeaders(sessionId),
			})
		);
	},

	async generateCodes(
		sessionId: string,
		eventId: string,
		form: { voter_type: VoterType; count: number }
	): Promise<ApiResponse<Code[]>> {
		return handleVoidApiCall(() =>
			voteAdminClient.createCodeGenerate({
				headers: getAuthHeaders(sessionId),
				eventId,
				body: form,
			})
		) as Promise<ApiResponse<Code[]>>;
	},

	async deleteCode(sessionId: string, eventId: string, id: string): Promise<ApiResponse<void>> {
		return handleVoidApiCall(() =>
			voteAdminClient.deleteCodeById({
				headers: getAuthHeaders(sessionId),
				eventId,
				id,
			})
		);
	},

	// Results
	async getResults(sessionId: string, eventId: string): Promise<ApiResponse<EventResults>> {
		return handleApiCall(() =>
			voteAdminClient.getEventResults(eventId, {
				headers: getAuthHeaders(sessionId),
			})
		);
	},
};
