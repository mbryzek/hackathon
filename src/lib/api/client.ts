import { config } from '$lib/config';
import {
  ApiClient as VoteApiClient,
  type Vote,
  type Event,
  type Project,
  type ProjectVote,
  EventStatus,
  VoterType
} from '../../generated/com-bryzek-vote-api';
import {
  type AdminSession,
  type Code,
  type CodeSummary,
  type EventResults,
  type EventForm,
  type ProjectForm,
  type CodeGenerateForm,
  type CodeExportForm,
  type Tally,
  type ProjectTally
} from '../../generated/com-bryzek-vote-admin';
import { type File, FileType } from '../../generated/com-bryzek-platform-storage';
import { ValidationErrorsResponse } from '../../generated/generated-error-validation-errors-response';
import { UnauthorizedErrorResponse } from '../../generated/generated-error-unauthorized-error-response';
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
  CodeExportForm,
  File,
  Tally,
  ProjectTally
};

export { EventStatus, FileType, VoterType };

// Alias Event as VoteEvent for backward compatibility
export type VoteEvent = Event;

// `?: T | undefined` rather than `?: T`: under `exactOptionalPropertyTypes` those
// mean different things, and every producer of this shape — the generated
// client's error bodies, the test doubles — maps a field that is genuinely
// `T | undefined` straight onto it rather than omitting the key.
export interface ValidationError {
  discriminator?: string | undefined;
  code?: string | undefined;
  message: string;
  field?: string | undefined;
}

export interface ApiResponse<T> {
  data?: T;
  errors?: ValidationError[];
  status: number;
}

/**
 * The admin half of the API lives in `$lib/server/adminApi` and is deliberately not
 * reachable from here: every admin call needs the session id out of the httpOnly cookie,
 * and SvelteKit refuses to bundle a `$lib/server` module into browser code. Only the
 * public vote endpoints below — which take no credentials — run in the browser.
 */
const voteApiClient = new VoteApiClient(config.apiBaseUrl);

/** The `ApiResponse` shape for a thrown generated-client error, whatever kind it is. */
async function toErrorResponse(error: unknown): Promise<{ errors: ValidationError[]; status: number }> {
  if (error instanceof ValidationErrorsResponse) {
    const validationErrors = await error.validationErrors();
    return {
      errors: validationErrors.map((e) => ({
        discriminator: e.discriminator,
        message: e.message,
        field: e.field
      })),
      status: error.response.status
    };
  }

  if (error instanceof UnauthorizedErrorResponse) {
    return { errors: [{ code: 'unauthorized', message: 'Unauthorized' }], status: 401 };
  }

  if (error instanceof VoidResponse) {
    return { errors: [{ code: 'not_found', message: 'Not found' }], status: 404 };
  }

  return { errors: [{ code: 'server_error', message: 'Server error' }], status: 500 };
}

// Helper to handle API errors and convert to ApiResponse format
export async function handleApiCall<T>(apiCall: () => Promise<T>, successStatus: number = 200): Promise<ApiResponse<T>> {
  try {
    return { data: await apiCall(), status: successStatus };
  } catch (error) {
    return toErrorResponse(error);
  }
}

// Helper for void responses
export async function handleVoidApiCall(apiCall: () => Promise<void>, successStatus: number = 204): Promise<ApiResponse<void>> {
  try {
    await apiCall();
    return { status: successStatus };
  } catch (error) {
    return toErrorResponse(error);
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
        body: { code }
      })
    );
  },

  async submitVote(eventKey: string, code: string, projectIds: string[]): Promise<ApiResponse<Vote>> {
    return handleApiCall(() =>
      voteApiClient.createVote({
        eventKey,
        body: { code, project_ids: projectIds }
      })
    );
  }
};
