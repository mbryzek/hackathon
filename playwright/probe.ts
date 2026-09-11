/**
 * One GET against a server global setup depends on, classified by what came back.
 *
 * A refused connection and a slow answer are different findings and are kept apart: `refused`
 * means nothing is listening and arrives without waiting on the timer, while `timeout` means a
 * server accepted the connection and is still working on its first request.
 */

export type ProbeResult =
  { kind: 'up'; response: Response } | { kind: 'refused' } | { kind: 'timeout'; timeoutMs: number } | { kind: 'error'; message: string };

export async function probe(url: string, timeoutMs: number): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // fetch() resolves for any HTTP status and only throws on a network failure, so a response of
    // any kind means the server is up.
    const response = await fetch(url, { signal: controller.signal, method: 'GET' });
    return { kind: 'up', response };
  } catch (error) {
    if (controller.signal.aborted) return { kind: 'timeout', timeoutMs };
    if (networkErrorCode(error) === 'ECONNREFUSED') return { kind: 'refused' };
    return { kind: 'error', message: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * The system error code behind a failed fetch. Node's fetch reports every network failure as a
 * bare `TypeError: fetch failed` and puts the code (ECONNREFUSED, ENOTFOUND, ...) on `cause`.
 */
function networkErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const cause = error.cause;
  if (typeof cause !== 'object' || cause === null || !('code' in cause)) return undefined;
  return typeof cause.code === 'string' ? cause.code : undefined;
}
