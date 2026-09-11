/**
 * What global setup is told about a server it depends on.
 *
 * `probe` is one GET, classified by what came back. `waitUntilUp` is the readiness check built
 * on it: a single GET is a SAMPLE, not a verdict, so one failed request against a server that is
 * up cannot be allowed to decide that nothing is there.
 *
 * A refused connection and a slow answer are different findings and are kept apart: `refused`
 * means nothing is listening and arrives without waiting on the timer, while `timeout` means a
 * server accepted the connection and is still working on its first request.
 */

export type ProbeResult =
  | { kind: 'up'; response: Response }
  | { kind: 'refused' }
  | { kind: 'timeout'; timeoutMs: number }
  | { kind: 'error'; message: string; code?: string };

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
    const code = networkErrorCode(error);
    if (code === 'ECONNREFUSED') return { kind: 'refused' };
    // The code is carried separately because `message` is the least informative string node has:
    // EVERY network failure is `TypeError: fetch failed`, so a log line without the code names no
    // cause at all and the next reader of it has to reproduce the run to learn anything.
    return { kind: 'error', message: error instanceof Error ? error.message : String(error), ...(code ? { code: code } : {}) };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** How long to leave a server alone between two attempts. */
const RETRY_INTERVAL_MS = 250;

/**
 * Poll until the server answers, or until the budget is gone.
 *
 * ONE FAILED REQUEST IS NOT A DOWN SERVER. A cold vite dev server on a loaded box drops or resets
 * its first connections while it compiles the root layout on demand, and a suite that reads that
 * single failure as "not running" runs zero specs against a frontend that was serving seconds
 * later. So every verdict but `up` is retried inside the budget and only the last one is reported.
 *
 * `retryRefused` IS THE ONE THING THE CALLER DECIDES, and it is about who owns the server. When
 * playwright started it, a refusal means NOT YET -- it was answering playwright's own readiness
 * wait moments ago -- so waiting is right. When a developer started it themselves, a refusal means
 * they have not, and failing on the spot with the command to run beats a silent 30-second wait.
 */
export async function waitUntilUp(url: string, timeoutMs: number, options: { retryRefused: boolean }): Promise<ProbeResult> {
  const deadline = Date.now() + timeoutMs;
  let result = await probe(url, timeoutMs);
  while (result.kind !== 'up') {
    if (result.kind === 'refused' && !options.retryRefused) return result;
    if (deadline - Date.now() <= RETRY_INTERVAL_MS) return result;
    await delay(RETRY_INTERVAL_MS);
    result = await probe(url, deadline - Date.now());
  }
  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
