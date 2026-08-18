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
import { handleApiCall, isApiSuccess } from '$generated/generated-util';
import type { ApiResponse } from '$generated/generated-util';

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

/**
 * The response envelope, the status→message table and the decoding of whatever a generated
 * client throws all live in `$generated/generated-util`, emitted by the apibuilder
 * TypeScript generator into every repo that consumes these APIs. They are re-exported here
 * because this module is the API surface the rest of the app imports.
 *
 * `ApiResponse<T>` is a discriminated union — a response carries `data` or `errors`, never
 * both — so read it through `isApiSuccess`/`isApiError` (or `dataOr` below) rather than by
 * testing for a property.
 */
export { handleApiCall, isApiError, isApiSuccess, statusMessage } from '$generated/generated-util';
export type { ApiCallOptions, ApiError, ApiResponse, ApiResponseError, ApiResponseSuccess } from '$generated/generated-util';

/** The data from a successful call, or `fallback` when the call failed. */
export function dataOr<T, F>(response: ApiResponse<T>, fallback: F): T | F {
  return isApiSuccess(response) ? response.data : fallback;
}

/**
 * The admin half of the API lives in `$lib/server/adminApi` and is deliberately not
 * reachable from here: every admin call needs the session id out of the httpOnly cookie,
 * and SvelteKit refuses to bundle a `$lib/server` module into browser code. Only the
 * public vote endpoints below — which take no credentials — run in the browser.
 */
const voteApiClient = new VoteApiClient({ baseUrl: config.apiBaseUrl });

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
