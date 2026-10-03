// dry-copy: sveltekit/playwright-probe — every copy of this region must match; `dev repo copies` checks it (ISS-15745)
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
 *
 * EVERY VERDICT CARRIES WHAT NODE ACTUALLY SAID (`transportCause.ts`). `fetch failed` is the same
 * string for a refusal, a reset and a DNS failure, so a readiness check that reports the message
 * reports nothing; and `cause.code`, which is the obvious place to read the difference off, is
 * absent for the commonest failure of all, because a `localhost` connection that fails throws an
 * `AggregateError` over both address families rather than the system error (ISS-10840).
 */

import { isRefusal, transportCause, type TransportCause } from './transportCause';

export type ProbeResult =
  | { kind: 'up'; response: Response }
  | { kind: 'refused'; cause: TransportCause }
  | { kind: 'timeout'; timeoutMs: number }
  | { kind: 'error'; message: string; cause: TransportCause };

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
    const cause = transportCause(error);
    // A refusal is every address refusing. One family refusing while the other times out is a
    // different finding and is reported as itself, because "nothing is listening" would be false.
    if (isRefusal(cause)) return { kind: 'refused', cause };
    return { kind: 'error', message: error instanceof Error ? error.message : String(error), cause };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** How long to leave a server alone between two attempts. */
const RETRY_INTERVAL_MS = 250;

/**
 * The whole window a readiness check spent, not just how it ended.
 *
 * REPORTING ONLY THE LAST ATTEMPT LEAVES THE READER UNABLE TO TELL A POLL FROM A SINGLE SHOT.
 * `Last of 30 seconds of attempts: fetch failed` is true of a check that made 118 requests and of
 * one that made one and slept, and those are different defects — the first is a dead server, the
 * second is a broken readiness check, and one CI log has already had to be read against the source
 * to tell them apart (ISS-10620, then ISS-10840). `attempts` and `elapsedMs` settle it in the log.
 *
 * `first` is kept beside `result` because what the server did can CHANGE inside the window: a
 * backend that answers, stops and then refuses is a different event from one that was never there,
 * and only the pair says which happened.
 */
export interface Readiness {
  /** The last probe of the window, which is the verdict. */
  readonly result: ProbeResult;
  /** The first probe of the window. */
  readonly first: ProbeResult;
  /** How many requests were made. */
  readonly attempts: number;
  readonly elapsedMs: number;
}

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
export async function waitUntilUp(url: string, timeoutMs: number, options: { retryRefused: boolean }): Promise<Readiness> {
  const started = Date.now();
  const deadline = started + timeoutMs;
  const first = await probe(url, timeoutMs);
  let result = first;
  let attempts = 1;
  while (result.kind !== 'up') {
    if (result.kind === 'refused' && !options.retryRefused) break;
    if (deadline - Date.now() <= RETRY_INTERVAL_MS) break;
    await delay(RETRY_INTERVAL_MS);
    result = await probe(url, deadline - Date.now());
    attempts += 1;
  }
  return { result, first, attempts, elapsedMs: Date.now() - started };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * What one probe found, in the terms the next reader of a CI log needs.
 *
 * Here rather than in each global setup because every caller has to say the same four things, and
 * a caller that renders `message` alone prints `fetch failed` for every transport failure there is.
 */
export function verdict(result: ProbeResult): string {
  switch (result.kind) {
    case 'up':
      return 'answered';
    case 'refused':
      return `connection refused on every address, so nothing is listening — ${result.cause.detail}`;
    case 'timeout':
      return `no answer within ${seconds(result.timeoutMs)}, though the connection was accepted — a server is there and is still working on its first request`;
    case 'error':
      return `${result.message} — ${result.cause.detail}`;
  }
}

/**
 * The shape of the window, which is what says the check POLLED.
 *
 * A single line reporting the last attempt is equally true of 118 requests and of one request and
 * a sleep, and those are different defects. The count and the elapsed time separate them without
 * anybody reading this file.
 */
export function pollSummary({ attempts, elapsedMs, first, result }: Readiness): string {
  if (attempts === 1) return `1 attempt, over ${seconds(elapsedMs)}.`;
  if (first.kind === result.kind) return `${attempts} attempts over ${seconds(elapsedMs)}, every one of them the same.`;
  // The failure CHANGED inside the window, which is a different event from a server that was never
  // there: the pair is what says so.
  return `${attempts} attempts over ${seconds(elapsedMs)}. The first of them: ${verdict(first)}.`;
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}
// dry-copy-end
