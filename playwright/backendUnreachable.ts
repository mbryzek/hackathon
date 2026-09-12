/**
 * WHAT A DEAD BACKEND LOOKS LIKE IN THE REPORT, said out loud instead of left as `fetch failed`.
 *
 * `ci/e2e.sh` runs `dev e2e run`, which stands up ONE platform container for the whole suite, and
 * `global-setup.ts` polls its healthcheck before a single spec runs. So a transport failure on a
 * fixture call is never a spec's own subject and never a mistyped url: it means the backend was
 * answering and has since stopped, and every spec after this one that needs it fails the same way.
 *
 * Without this, a container that goes away part-way through reaches the published report as one
 * bare `TypeError: fetch failed` per remaining spec, with an empty `AggregateError` under it, and
 * the e2e check files that set as dozens of unrelated findings when it is one event (ISS-10768,
 * ported from playbook-app's ISS-10762).
 *
 * THE FAILING SET MAPS THE SUITE'S FILE ORDER, NOT A DEFECT. Everything after the moment the
 * backend stopped fails; a spec that seeds nothing keeps passing whatever happened to the backend.
 *
 * WHY THIS IS AT THE FETCH SEAM rather than at the call sites: every fixture reaches the backend
 * through a generated client (`utils/test-helpers.ts` builds the one it uses), and a client's `fetch` option is the one place all of
 * them pass through. A per-call-site wrapper would be discipline a fixture added later can forget.
 *
 * WHAT THIS IS NOT. It does not make the run green and does not try to: the suite measured nothing
 * after the backend stopped, and the verdict for that belongs to `dev e2e run`, which classifies a
 * container that died mid-suite as an infrastructure fault rather than a red suite (ISS-10612).
 */

import { config } from './config';

/**
 * The dead-backend explanation for a thrown value, or `undefined` when it is something else.
 *
 * Node's fetch reports every transport-level failure (refused, reset, closed mid-response, DNS)
 * as exactly `TypeError: fetch failed`, and reports nothing else as it. An aborted request is a
 * `DOMException` and an HTTP error is a response, so neither is matched here.
 */
export function backendUnreachable(error: unknown): Error | undefined {
  if (!(error instanceof TypeError) || error.message !== 'fetch failed') {
    return undefined;
  }
  return new Error(
    `The e2e backend at ${config.BACKEND_BASE_URL} is not answering (${transportCause(error)}), so nothing was ` +
      `seeded and this spec never reached its subject. It WAS answering when global-setup probed it before ` +
      `the run, so the platform container serving this suite has gone away since — this is not a spec ` +
      `failure and not a wrong url. Every spec after this one that needs the backend fails the same way. ` +
      `What the container did before it stopped is in backend.log in this run's artifact directory, and ` +
      `nowhere else — the container is ephemeral and its log dies with it.`,
    { cause: error }
  );
}

/**
 * The line under `fetch failed` that actually says what happened, and it is two different lines.
 *
 * The FIRST request to a backend that has just gone away is answered by `SocketError: other side
 * closed`: it was in flight when the socket went. Every request after it gets an `AggregateError`
 * wrapping one `connect ECONNREFUSED` per address family, which is nothing on the port at all.
 * That distinction tells a reader which spec was running when the backend died, so the inner error
 * is unwrapped rather than reported as a bare `AggregateError` with an empty message.
 */
function transportCause(error: TypeError): string {
  const cause: unknown = error.cause;
  if (!(cause instanceof Error)) {
    return 'no cause reported';
  }
  const described: Error =
    cause instanceof AggregateError
      ? ((cause.errors as unknown[]).find((inner): inner is Error => inner instanceof Error) ?? cause)
      : cause;
  return described.message.trim() === '' ? described.name : `${described.name}: ${described.message}`;
}

/**
 * Every backend call this harness makes, with a transport failure reported as the dead backend it is.
 *
 * It calls the global `fetch` at call time, so anything installed there first still applies.
 */
export const explainingFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw backendUnreachable(error) ?? error;
  }
};
