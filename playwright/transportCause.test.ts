// dry-copy: sveltekit/playwright-transport-cause-test — every copy of this region must match; `dev repo copies` checks it (ISS-15745)
import { describe, expect, it } from 'vitest';
import { isRefusal, transportCause } from './transportCause';

/**
 * What a failed fetch is made to say, against the exact shapes node throws.
 *
 * Built by hand rather than off a socket, and deliberately: the shape that broke this is one node
 * only produces for a `localhost` url on a machine with both address families, and whether the
 * aggregate itself carries a `code` varies by node version. A test that can only reproduce the
 * shape its own runner happens to produce is a test that passes on the runner where the defect
 * does not live (ISS-10840). The socket-level coverage is in `probe.test.ts`.
 */

/** A `TypeError: fetch failed` with the given cause, which is what node throws. */
function fetchFailed(cause: unknown): TypeError {
  return new TypeError('fetch failed', { cause });
}

function systemError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

/** The two-family refusal, as node reports it: an aggregate whose own message is empty. */
function refusedOnBothFamilies(port: number, options: { codeOnAggregate: boolean }): AggregateError {
  const aggregate = new AggregateError([
    systemError('ECONNREFUSED', `connect ECONNREFUSED ::1:${port}`),
    systemError('ECONNREFUSED', `connect ECONNREFUSED 127.0.0.1:${port}`)
  ]);
  return options.codeOnAggregate ? Object.assign(aggregate, { code: 'ECONNREFUSED' }) : aggregate;
}

describe('transportCause', () => {
  it('names every address an aggregate refused, not just the first', () => {
    const cause = transportCause(fetchFailed(refusedOnBothFamilies(6697, { codeOnAggregate: true })));

    expect(cause.detail).toBe('connect ECONNREFUSED ::1:6697; connect ECONNREFUSED 127.0.0.1:6697');
    expect(cause.code).toBe('ECONNREFUSED');
    expect(isRefusal(cause)).toBe(true);
  });

  it('reads the code off the addresses when the aggregate itself carries none', () => {
    // The node versions that set no `code` on the aggregate are why `cause.code` cannot be the
    // thing this is read from: the commonest failure there is answers `undefined`.
    const cause = transportCause(fetchFailed(refusedOnBothFamilies(6697, { codeOnAggregate: false })));

    expect(cause.code).toBe('ECONNREFUSED');
    expect(isRefusal(cause)).toBe(true);
    expect(cause.detail).toContain('::1:6697');
  });

  it('is not a refusal when the families disagreed, because something did answer for one', () => {
    const cause = transportCause(
      fetchFailed(
        new AggregateError([
          systemError('ECONNREFUSED', 'connect ECONNREFUSED ::1:6697'),
          systemError('ETIMEDOUT', 'connect ETIMEDOUT 127.0.0.1:6697')
        ])
      )
    );

    expect(cause.codes).toEqual(['ECONNREFUSED', 'ETIMEDOUT']);
    expect(cause.code).toBeUndefined();
    expect(isRefusal(cause)).toBe(false);
    expect(cause.detail).toBe('connect ECONNREFUSED ::1:6697; connect ETIMEDOUT 127.0.0.1:6697');
  });

  it('reports one address once, however many times node reported it', () => {
    const cause = transportCause(
      fetchFailed(
        new AggregateError([
          systemError('ECONNREFUSED', 'connect ECONNREFUSED ::1:6697'),
          systemError('ECONNREFUSED', 'connect ECONNREFUSED ::1:6697')
        ])
      )
    );

    expect(cause.detail).toBe('connect ECONNREFUSED ::1:6697');
    expect(cause.codes).toEqual(['ECONNREFUSED']);
  });

  it('keeps the name of an error whose name is the informative half', () => {
    const socketError = Object.assign(new Error('other side closed'), { code: 'UND_ERR_SOCKET', name: 'SocketError' });

    expect(transportCause(fetchFailed(socketError)).detail).toBe('SocketError: other side closed');
  });

  it('names a DNS failure, which carries no aggregate at all', () => {
    const cause = transportCause(fetchFailed(systemError('ENOTFOUND', 'getaddrinfo ENOTFOUND platform.invalid')));

    expect(cause.code).toBe('ENOTFOUND');
    expect(isRefusal(cause)).toBe(false);
  });

  it('says an empty aggregate is one rather than reporting nothing', () => {
    // Reporting `AggregateError` is poor; reporting an empty string is worse, and that is what a
    // reader of the published report used to get.
    expect(transportCause(fetchFailed(new AggregateError([]))).detail).toBe('AggregateError');
  });

  it('flattens an aggregate inside an aggregate', () => {
    const nested = new AggregateError([new AggregateError([systemError('ECONNREFUSED', 'connect ECONNREFUSED ::1:6697')])]);

    expect(transportCause(fetchFailed(nested)).detail).toBe('connect ECONNREFUSED ::1:6697');
  });

  it('says so rather than inventing a cause when node reported none', () => {
    expect(transportCause(new TypeError('fetch failed')).detail).toBe('no cause reported');
    expect(transportCause(fetchFailed('a string')).detail).toBe('no cause reported');
    expect(transportCause('not an error').codes).toEqual([]);
  });
});
// dry-copy-end
