import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { FileType, VoterType } from '$lib/api/client';
import { adminApi } from '$lib/server/adminApi';
import { firstError, requireSessionId } from '$lib/server/adminSession';
import { integer, oneOf, optionalBoolean, optionalText, trimmed } from '$lib/server/fields';
import { CODES_PAGE_SIZE, MAX_CODES_TO_GENERATE } from '$lib/utils/constants';

const VOTER_TYPES = Object.values(VoterType);
const FILE_TYPES = Object.values(FileType);

/**
 * The filters live in the query string, not in component state, because the rows are now fetched
 * here — with the session id the server holds — rather than from the browser. A search is
 * therefore a navigation: shareable, back-button-able, and sequenced by the router, which
 * abandons a superseded navigation instead of painting its late response. That is what the
 * hand-rolled request-id bookkeeping in the old client-side version was for (ISS-487).
 */
function filtersFrom(params: URLSearchParams) {
  return {
    q: trimmed(params.get('q')),
    voterType: oneOf(params.get('voter_type'), VOTER_TYPES),
    hasVoted: optionalBoolean(params.get('has_voted')),
    offset: Math.max(0, integer(params.get('offset'), 0))
  };
}

export const load: PageServerLoad = async (event) => {
  const sessionId = requireSessionId(event);
  const filters = filtersFrom(event.url.searchParams);

  const [eventResponse, summaryResponse, codesResponse] = await Promise.all([
    adminApi.getEvent(sessionId, event.params.id),
    adminApi.getCodeSummary(sessionId, event.params.id),
    adminApi.getCodes(sessionId, event.params.id, {
      q: filters.q || undefined,
      voter_type: filters.voterType,
      has_voted: filters.hasVoted,
      limit: CODES_PAGE_SIZE + 1,
      offset: filters.offset
    })
  ]);

  const batch = codesResponse.data ?? [];

  return {
    ...filters,
    event: eventResponse.data ?? null,
    summary: summaryResponse.data ?? null,
    codes: batch.slice(0, CODES_PAGE_SIZE),
    hasMore: batch.length > CODES_PAGE_SIZE,
    error: firstError(event, [eventResponse, summaryResponse, codesResponse], 'Event not found')
  };
};

export const actions = {
  generate: async (event) => {
    const form = await event.request.formData();
    const voterType = oneOf(form.get('voter_type'), VOTER_TYPES) ?? VoterType.Student;
    const count = integer(form.get('count'), 0);

    if (count < 1 || count > MAX_CODES_TO_GENERATE) {
      return fail(400, { error: `Enter a number of codes between 1 and ${MAX_CODES_TO_GENERATE}.` });
    }

    const response = await adminApi.generateCodes(requireSessionId(event), event.params.id, {
      voter_type: voterType,
      count
    });
    const error = firstError(event, [response], 'Event not found');

    return error === null ? undefined : fail(response.status, { error });
  },

  delete: async (event) => {
    const form = await event.request.formData();
    const response = await adminApi.deleteCode(requireSessionId(event), event.params.id, trimmed(form.get('id')));
    const error = firstError(event, [response], 'Code not found');

    return error === null ? undefined : fail(response.status, { error });
  },

  /**
   * Builds an export of the codes the current filters select, and sends the browser to it. The
   * stored file's url is signed and expiring, so the browser follows it with no credentials
   * attached and the filename comes from the file rather than being guessed here.
   */
  export: async (event) => {
    const form = await event.request.formData();
    const format = oneOf(form.get('format'), FILE_TYPES);

    if (!format) {
      return fail(400, { error: 'Unknown export format' });
    }

    const response = await adminApi.exportCodes(requireSessionId(event), event.params.id, {
      format,
      voter_type: oneOf(form.get('voter_type'), VOTER_TYPES),
      has_voted: optionalBoolean(form.get('has_voted')),
      q: optionalText(form.get('q'))
    });
    const error = firstError(event, [response], 'Event not found');

    if (error !== null) {
      return fail(response.status, { error });
    }
    if (!response.data) {
      return fail(500, { error: 'Failed to build the export' });
    }

    throw redirect(303, response.data.url);
  }
} satisfies Actions;
