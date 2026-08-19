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

/**
 * The admin client for one caller. The session id rides on CONSTRUCTION rather than on each
 * operation call: `headers` given here are merged into every request the client makes, so an
 * operation below cannot be written that forgets to authenticate. `login` is the one caller
 * with no session to carry — it is the call that mints one.
 */
function adminClient(sessionId?: string): VoteAdminClient {
  const headers = sessionId ? { session_id: sessionId } : {};
  return new VoteAdminClient({ baseUrl: config.apiBaseUrl, headers });
}

/** Every optional key of `T`, with `undefined` removed from what it may hold. */
type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

/**
 * `value` without the keys whose value is `undefined`.
 *
 * The generated client spells an optional field `k?: T`, which under
 * `exactOptionalPropertyTypes` refuses an explicit `undefined` — and every
 * optional field crossing this boundary arrives as `T | undefined`, because it
 * came from a query string or a form post that may not have carried it.
 * Omitting the key is what "absent" means on the wire, so do it here once
 * rather than spreading a conditional at each of the calls below.
 */
function defined<T extends object>(value: T): Defined<T> {
  return Object.fromEntries(Object.entries(value).filter(([, held]) => held !== undefined)) as Defined<T>;
}

export const adminApi = {
  // Session
  async login(email: string, password: string): Promise<ApiResponse<AdminSession>> {
    return handleApiCall(() =>
      adminClient().createAdminSessionSessionsAndLogins({
        body: { email, password }
      })
    );
  },

  async getSession(sessionId: string): Promise<ApiResponse<AdminSession>> {
    return handleApiCall(() => adminClient(sessionId).getAdminSessionSession());
  },

  async logout(sessionId: string): Promise<ApiResponse<void>> {
    return handleApiCall(() => adminClient(sessionId).deleteAdminSessionSession());
  },

  // Events
  async getEvents(
    sessionId: string,
    params?: { status?: EventStatus[] | undefined; limit?: number | undefined; offset?: number | undefined }
  ): Promise<ApiResponse<Event[]>> {
    return handleApiCall(() =>
      adminClient(sessionId).getEvents({
        ...defined({ status: params?.status }),
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0
      })
    );
  },

  async getEvent(sessionId: string, id: string): Promise<ApiResponse<Event>> {
    return handleApiCall(() => adminClient(sessionId).getEventById(id));
  },

  async createEvent(sessionId: string, form: { key: string; name: string; status?: EventStatus }): Promise<ApiResponse<Event>> {
    return handleApiCall(() =>
      adminClient(sessionId).createEvent({
        body: form
      })
    );
  },

  async updateEvent(sessionId: string, id: string, form: { key: string; name: string; status?: EventStatus }): Promise<ApiResponse<Event>> {
    return handleApiCall(() =>
      adminClient(sessionId).updateEventById({
        id,
        body: form
      })
    );
  },

  async deleteEvent(sessionId: string, id: string): Promise<ApiResponse<void>> {
    return handleApiCall(() => adminClient(sessionId).deleteEventById(id));
  },

  // Projects
  async getProjects(sessionId: string, eventId: string, params?: { limit?: number; offset?: number }): Promise<ApiResponse<Project[]>> {
    return handleApiCall(() =>
      adminClient(sessionId).getProjects({
        eventId,
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0
      })
    );
  },

  async createProject(
    sessionId: string,
    eventId: string,
    form: { name: string; description?: string | undefined }
  ): Promise<ApiResponse<Project>> {
    return handleApiCall(() =>
      adminClient(sessionId).createProject({
        eventId,
        body: { name: form.name, ...defined({ description: form.description }) }
      })
    );
  },

  async updateProject(
    sessionId: string,
    eventId: string,
    id: string,
    form: { name: string; description?: string | undefined }
  ): Promise<ApiResponse<Project>> {
    return handleApiCall(() =>
      adminClient(sessionId).updateProjectById({
        eventId,
        id,
        body: { name: form.name, ...defined({ description: form.description }) }
      })
    );
  },

  async deleteProject(sessionId: string, eventId: string, id: string): Promise<ApiResponse<void>> {
    return handleApiCall(() =>
      adminClient(sessionId).deleteProjectById({
        eventId,
        id
      })
    );
  },

  async reorderProjects(sessionId: string, eventId: string, projectIds: string[]): Promise<ApiResponse<void>> {
    return handleApiCall(() =>
      adminClient(sessionId).createProjectReorder({
        eventId,
        body: { project_ids: projectIds }
      })
    );
  },

  async createProjectCsv(sessionId: string, eventId: string, data: string, deleteAllProjects: boolean): Promise<ApiResponse<void>> {
    return handleApiCall(() =>
      adminClient(sessionId).createProjectCsv({
        eventId,
        body: { data, delete_all_projects: deleteAllProjects }
      })
    );
  },

  // Codes
  async getCodes(
    sessionId: string,
    eventId: string,
    params?: {
      voter_type?: VoterType | undefined;
      has_voted?: boolean | undefined;
      q?: string | undefined;
      limit?: number | undefined;
      offset?: number | undefined;
    }
  ): Promise<ApiResponse<Code[]>> {
    return handleApiCall(() =>
      adminClient(sessionId).getCodes({
        eventId,
        ...defined({ voterType: params?.voter_type, hasVoted: params?.has_voted, q: params?.q }),
        limit: params?.limit ?? 100,
        offset: params?.offset ?? 0
      })
    );
  },

  async getCodeSummary(sessionId: string, eventId: string): Promise<ApiResponse<CodeSummary>> {
    return handleApiCall(() => adminClient(sessionId).getCodeSummary(eventId));
  },

  async generateCodes(sessionId: string, eventId: string, form: { voter_type: VoterType; count: number }): Promise<ApiResponse<void>> {
    return handleApiCall(() =>
      adminClient(sessionId).createCodeGenerate({
        eventId,
        body: form
      })
    );
  },

  async deleteCode(sessionId: string, eventId: string, id: string): Promise<ApiResponse<void>> {
    return handleApiCall(() =>
      adminClient(sessionId).deleteCodeById({
        eventId,
        id
      })
    );
  },

  /**
   * Builds an export of this event's codes and returns the stored file. The file's `url` is
   * signed and expiring, so the browser can follow it directly with no session header.
   */
  async exportCodes(
    sessionId: string,
    eventId: string,
    // Spelled off `CodeExportForm` field by field rather than taken whole: an
    // optional field there is `k?: T`, which under `exactOptionalPropertyTypes`
    // refuses the explicit `undefined` a missing form value produces. Indexed
    // access keeps each field tracking the generated spec regardless.
    form: {
      format: CodeExportForm['format'];
      voter_type?: CodeExportForm['voter_type'];
      has_voted?: CodeExportForm['has_voted'];
      q?: CodeExportForm['q'];
    }
  ): Promise<ApiResponse<File>> {
    return handleApiCall(() =>
      adminClient(sessionId).createCodeExports({
        eventId,
        body: {
          format: form.format,
          ...defined({ voter_type: form.voter_type, has_voted: form.has_voted, q: form.q })
        }
      })
    );
  },

  // Results
  async getResults(sessionId: string, eventId: string): Promise<ApiResponse<EventResults>> {
    return handleApiCall(() => adminClient(sessionId).getEventResults(eventId));
  }
};
