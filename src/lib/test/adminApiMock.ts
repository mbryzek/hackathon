/**
 * One mock of `$lib/server/adminApi`, for every test that needs one.
 *
 * The default answers every operation successfully with a fixture, so a test declares only the
 * calls it is about. It is typed as the real `adminApi`, which is the whole point: rename an
 * operation or change what it returns and this stops compiling, where four hand-written
 * `vi.mock` factories would have gone on passing while the mocks drifted from the API.
 *
 * `vi.mock` factories are hoisted above every import, so reach this through a dynamic import
 * inside an async factory:
 *
 *     vi.mock('$lib/server/adminApi', async () => {
 *       const { mockAdminApi } = await import('$lib/test/adminApiMock');
 *       return mockAdminApi({ getCodes: (...args) => getCodes(...args) });
 *     });
 */

import type { AdminSession, ApiResponse } from '$lib/api/client';
import type { adminApi } from '$lib/server/adminApi';
import { aCode, aCodeSummary, aFile, anEvent, anEventResults, aProject } from './fixtures';

export type AdminApi = typeof adminApi;

/** A successful answer carrying `data`. */
export const ok = <T>(data: T): Promise<ApiResponse<T>> => Promise.resolve({ data, status: 200 });

/** A failed answer, in the shape `$lib/api/client` turns every client error into. */
export const apiError = (status: number, message: string): Promise<ApiResponse<never>> =>
  Promise.resolve({ errors: [{ message }], status });

/**
 * A success whose body no caller reads. `handleApiCall` types `data` as `T` even for a
 * body-less 2xx, so a test deciding on the status alone still has to name something, and
 * `undefined` is what such a response actually carries at runtime.
 */
export const okStatus = <T>(_status: number): Promise<ApiResponse<T>> => Promise.resolve({ data: undefined as T, status: 200 });

/** What the API answers a call that succeeds and returns nothing. */
const noContent = (): Promise<ApiResponse<void>> => okStatus<void>(204);

/**
 * The session body is a deep `AdminSession` (a user, a person, a tenant) and no test reads it —
 * every caller here decides on the status alone.
 */
const session = (status: number): Promise<ApiResponse<AdminSession>> => okStatus<AdminSession>(status);

function defaultAdminApi(): AdminApi {
  return {
    login: () => session(201),
    getSession: () => session(200),
    logout: noContent,

    getEvents: () => ok([anEvent()]),
    getEvent: () => ok(anEvent()),
    createEvent: () => ok(anEvent()),
    updateEvent: () => ok(anEvent()),
    deleteEvent: noContent,

    getProjects: () => ok([aProject()]),
    createProject: () => ok(aProject()),
    updateProject: () => ok(aProject()),
    deleteProject: noContent,
    reorderProjects: noContent,
    createProjectCsv: noContent,

    getCodes: () => ok([aCode()]),
    getCodeSummary: () => ok(aCodeSummary()),
    generateCodes: noContent,
    deleteCode: noContent,
    exportCodes: () => ok(aFile()),

    getResults: () => ok(anEventResults([0], [0]))
  };
}

/** The module shape `vi.mock('$lib/server/adminApi', ...)` must return. */
export function mockAdminApi(overrides: Partial<AdminApi> = {}): { adminApi: AdminApi } {
  return { adminApi: { ...defaultAdminApi(), ...overrides } };
}
