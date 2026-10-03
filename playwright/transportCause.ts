// dry-copy: sveltekit/playwright-transport-cause — every copy of this region must match; `dev repo copies` checks it (ISS-15745)
/**
 * WHAT ACTUALLY FAILED UNDER A `TypeError: fetch failed`, which is the one string node gives
 * every transport failure it has.
 *
 * Refused, reset, closed mid-response, DNS and a connect timeout are all reported as that same
 * message, and the difference is on `cause`. A reader of a CI log who is handed the message and
 * not the cause learns nothing at all and has to reproduce the run — which is the whole of why
 * this exists as its own module rather than as a line inside either of its two callers.
 *
 * AN `AggregateError` IS THE SHAPE THAT MATTERS AND THE ONE EASIEST TO MISS. Node resolves
 * `localhost` to BOTH families and tries each, so a connection to a `localhost` url that fails
 * does not throw the system error — it throws an `AggregateError` wrapping one system error per
 * address, whose own `message` is empty and whose own `code` is absent on some node versions.
 * Reading `cause.code` therefore answers `undefined` for the commonest dead-backend failure
 * there is, and reading `cause.message` answers `''`. Every address is unwrapped here instead,
 * and reported, because WHICH families refused is exactly the difference between a backend that
 * is gone and one that is only unreachable over IPv6 (ISS-10840).
 *
 * A `127.0.0.1` url throws the system error directly, with no aggregate around it. That is why a
 * harness whose tests all bind `127.0.0.1` can pass while the aggregate path is broken, and why
 * the tests beside this file probe `localhost` too.
 */

/** What a failed fetch says about itself once the `cause` chain has been walked. */
export interface TransportCause {
  /** Every system error code node reported, deduped, in the order it reported them. */
  readonly codes: readonly string[];
  /**
   * The single code, when every address agreed on one. Absent when they disagreed — a refusal on
   * one family and a timeout on the other is not a refusal, and must not be classified as one.
   */
  readonly code?: string;
  /** One line naming what failed and where, for a log: `connect ECONNREFUSED ::1:6697; ...`. */
  readonly detail: string;
}

/** What is said when node reported no cause at all, rather than an empty string. */
const NO_CAUSE = 'no cause reported';

/** An `AggregateError` of `AggregateError`s is not a shape node produces; this is a cycle guard. */
const MAX_DEPTH = 4;

/**
 * The transport cause of a thrown value.
 *
 * Always answers, so a caller never has to decide what an absent cause renders as: a value that
 * carries no cause answers with no codes and `detail` saying so.
 */
export function transportCause(error: unknown): TransportCause {
  const cause = error instanceof Error ? error.cause : undefined;
  const reported = cause instanceof Error ? leaves(cause, 0) : [];
  if (reported.length === 0) return { codes: [], detail: NO_CAUSE };

  const codes = unique(reported.map(codeOf).filter((code): code is string => code !== undefined));
  const detail = unique(reported.map(describe)).join('; ');
  return { codes, detail, ...(codes.length === 1 && codes[0] ? { code: codes[0] } : {}) };
}

/** True when every address node tried refused the connection, which means nothing is listening. */
export function isRefusal(cause: TransportCause): boolean {
  return cause.code === 'ECONNREFUSED';
}

/**
 * The errors that actually describe a failure, with every aggregate flattened away.
 *
 * An aggregate carrying no errors is kept as itself rather than dropped: `AggregateError` with an
 * empty message is a poor thing to report, but reporting nothing at all is worse.
 */
function leaves(error: Error, depth: number): Error[] {
  if (error instanceof AggregateError && depth < MAX_DEPTH) {
    const inner = toArray(error.errors).filter((value): value is Error => value instanceof Error);
    if (inner.length > 0) return inner.flatMap((child) => leaves(child, depth + 1));
  }
  return [error];
}

function toArray(errors: unknown): unknown[] {
  return Array.isArray(errors) ? errors : [];
}

function codeOf(error: Error): string | undefined {
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && code !== '' ? code : undefined;
}

/**
 * One error as a log line.
 *
 * A system error's own message already carries its code and the address it was trying
 * (`connect ECONNREFUSED ::1:6697`), so prefixing the useless name `Error` to it only adds noise;
 * a named error (`SocketError: other side closed`) keeps its name, which is the informative half.
 */
function describe(error: Error): string {
  const message = error.message.trim();
  if (message === '') return error.name;
  return error.name === 'Error' ? message : `${error.name}: ${message}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
// dry-copy-end
