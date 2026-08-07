/**
 * The admin API, callable only from server code.
 *
 * Every operation here authenticates with the admin session id, which is held in an
 * httpOnly cookie. Living under `$lib/server` is what keeps that true: SvelteKit refuses
 * to bundle a `$lib/server` module into browser code, so a page that wants admin data has
 * to ask a `load`/action for it rather than fetching it from the browser with the raw
 * session id in hand. See `$lib/server/adminSession` for how the id is read.
 */

import { config } from '$lib/config';
import {
  handleApiCall,
  handleVoidApiCall,
  type ApiResponse,
  type AdminSession,
  type Code,
  type CodeExportForm,
  type CodeSummary,
  type Event,
  type EventResults,
  type File,
  type Project,
  type EventStatus,
  type VoterType
} from '$lib/api/client';
import { ApiClient as VoteAdminClient } from '../../generated/com-bryzek-vote-admin';

const voteAdminClient = new VoteAdminClient(config.apiBaseUrl);

// Helper to create authorization header
function getAuthHeaders(sessionId?: string): Record<string, string> {
  if (sessionId) {
    return { session_id: sessionId };
  }
  return {};
}

export const adminApi = {
  // Session
  async login(email: string, password: string): Promise<ApiResponse<AdminSession>> {
    return handleApiCall(
      () =>
        voteAdminClient.createAdminSessionSessionsAndLogins({
          body: { email, password }
        }),
      201
    );
  },

  async getSession(sessionId: string): Promise<ApiResponse<AdminSession>> {
    return handleApiCall(() =>
      voteAdminClient.getAdminSessionSession({
        headers: getAuthHeaders(sessionId)
      })
    );
  },

  async logout(sessionId: string): Promise<ApiResponse<void>> {
    return handleVoidApiCall(() =>
      voteAdminClient.deleteAdminSessionSession({
        headers: getAuthHeaders(sessionId)
      })
    );
  },

  // Events
  async getEvents(sessionId: string, params?: { status?: EventStatus[]; limit?: number; offset?: number }): Promise<ApiResponse<Event[]>> {
    return handleApiCall(() =>
      voteAdminClient.getEvents({
        headers: getAuthHeaders(sessionId),
        status: params?.status,
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0
      })
    );
  },

  async getEvent(sessionId: string, id: string): Promise<ApiResponse<Event>> {
    return handleApiCall(() =>
      voteAdminClient.getEventById(id, {
        headers: getAuthHeaders(sessionId)
      })
    );
  },

  async createEvent(sessionId: string, form: { key: string; name: string; status?: EventStatus }): Promise<ApiResponse<Event>> {
    return handleApiCall(
      () =>
        voteAdminClient.createEvent({
          headers: getAuthHeaders(sessionId),
          body: form
        }),
      201
    );
  },

  async updateEvent(sessionId: string, id: string, form: { key: string; name: string; status?: EventStatus }): Promise<ApiResponse<Event>> {
    return handleApiCall(() =>
      voteAdminClient.updateEventById({
        headers: getAuthHeaders(sessionId),
        id,
        body: form
      })
    );
  },

  async deleteEvent(sessionId: string, id: string): Promise<ApiResponse<void>> {
    return handleVoidApiCall(() =>
      voteAdminClient.deleteEventById(id, {
        headers: getAuthHeaders(sessionId)
      })
    );
  },

  // Projects
  async getProjects(sessionId: string, eventId: string, params?: { limit?: number; offset?: number }): Promise<ApiResponse<Project[]>> {
    return handleApiCall(() =>
      voteAdminClient.getProjects({
        headers: getAuthHeaders(sessionId),
        eventId,
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0
      })
    );
  },

  async createProject(sessionId: string, eventId: string, form: { name: string; description?: string }): Promise<ApiResponse<Project>> {
    return handleApiCall(
      () =>
        voteAdminClient.createProject({
          headers: getAuthHeaders(sessionId),
          eventId,
          body: form
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
        body: form
      })
    );
  },

  async deleteProject(sessionId: string, eventId: string, id: string): Promise<ApiResponse<void>> {
    return handleVoidApiCall(() =>
      voteAdminClient.deleteProjectById({
        headers: getAuthHeaders(sessionId),
        eventId,
        id
      })
    );
  },

  async reorderProjects(sessionId: string, eventId: string, projectIds: string[]): Promise<ApiResponse<void>> {
    return handleVoidApiCall(() =>
      voteAdminClient.createProjectReorder({
        headers: getAuthHeaders(sessionId),
        eventId,
        body: { project_ids: projectIds }
      })
    );
  },

  async createProjectCsv(sessionId: string, eventId: string, data: string, deleteAllProjects: boolean): Promise<ApiResponse<void>> {
    return handleVoidApiCall(() =>
      voteAdminClient.createProjectCsv({
        headers: getAuthHeaders(sessionId),
        eventId,
        body: { data, delete_all_projects: deleteAllProjects }
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
        offset: params?.offset ?? 0
      })
    );
  },

  async getCodeSummary(sessionId: string, eventId: string): Promise<ApiResponse<CodeSummary>> {
    return handleApiCall(() =>
      voteAdminClient.getCodeSummary(eventId, {
        headers: getAuthHeaders(sessionId)
      })
    );
  },

  async generateCodes(sessionId: string, eventId: string, form: { voter_type: VoterType; count: number }): Promise<ApiResponse<void>> {
    return handleVoidApiCall(() =>
      voteAdminClient.createCodeGenerate({
        headers: getAuthHeaders(sessionId),
        eventId,
        body: form
      })
    );
  },

  async deleteCode(sessionId: string, eventId: string, id: string): Promise<ApiResponse<void>> {
    return handleVoidApiCall(() =>
      voteAdminClient.deleteCodeById({
        headers: getAuthHeaders(sessionId),
        eventId,
        id
      })
    );
  },

  /**
   * Builds an export of this event's codes and returns the stored file. The file's `url` is
   * signed and expiring, so the browser can follow it directly with no session header.
   */
  async exportCodes(sessionId: string, eventId: string, form: CodeExportForm): Promise<ApiResponse<File>> {
    return handleApiCall(
      () =>
        voteAdminClient.createCodeExports({
          headers: getAuthHeaders(sessionId),
          eventId,
          body: form
        }),
      201
    );
  },

  // Results
  async getResults(sessionId: string, eventId: string): Promise<ApiResponse<EventResults>> {
    return handleApiCall(() =>
      voteAdminClient.getEventResults(eventId, {
        headers: getAuthHeaders(sessionId)
      })
    );
  }
};
