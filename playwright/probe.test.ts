// dry-copy: sveltekit/playwright-probe-test — every copy of this region must match; `dev repo copies` checks it (ISS-15745)
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { pollSummary, probe, verdict, waitUntilUp, type ProbeResult } from './probe';

/**
 * What global setup is told about a server, tested against real sockets.
 *
 * The distinction these hold is the one the suite's readiness check is built on: a server that
 * accepted the connection is running however long its first answer takes, and only a refusal
 * means nothing is there. Each server here answers on a loopback port of its own.
 *
 * BOTH SPELLINGS OF LOOPBACK ARE EXERCISED, and that is the point rather than thoroughness.
 * `127.0.0.1` names one address, so node throws the system error; `localhost` names both families,
 * so node throws an `AggregateError` over them instead. A harness whose tests only ever say
 * `127.0.0.1` can therefore pass with the aggregate path completely broken — which is what let a
 * refused CI backend reach a human as `fetch failed` with no cause at all (ISS-10840). The suite
 * itself probes `localhost`.
 */

const servers: http.Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => close(server)));
});

function close(server: http.Server): Promise<void> {
  server.closeAllConnections();
  return new Promise((resolve) => server.close(() => resolve()));
}

async function listen(handler: http.RequestListener, port = 0): Promise<{ server: http.Server; url: string; port: number }> {
  const server = http.createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', () => resolve()));
  const bound = (server.address() as AddressInfo).port;
  return { server, url: `http://127.0.0.1:${bound}/`, port: bound };
}

/** A url nothing is listening on: bind a port, then hand it back closed. */
async function closedUrl(): Promise<{ url: string; port: number }> {
  const { server, url, port } = await listen(() => {});
  await close(server);
  return { url, port };
}

describe('probe', () => {
  it('is up when the first answer arrives inside the budget, however slowly', async () => {
    const { url } = await listen((_req, res) => {
      setTimeout(() => res.end('ok'), 300);
    });
    expect((await probe(url, 5_000)).kind).toBe('up');
  });

  it('is up for any HTTP status, since an error page is still a running server', async () => {
    const { url } = await listen((_req, res) => {
      res.statusCode = 500;
      res.end();
    });
    expect((await probe(url, 5_000)).kind).toBe('up');
  });

  it('hands back the response, which is what an app-identity check reads', async () => {
    const { url } = await listen((_req, res) => {
      res.end('<title>Hello</title>');
    });
    const result = await probe(url, 5_000);
    if (result.kind !== 'up') throw new Error(`expected up, got ${result.kind}`);
    expect(await result.response.text()).toContain('<title>Hello</title>');
  });

  it('times out when the server accepts the connection and never answers', async () => {
    const { url } = await listen(() => {});
    expect(await probe(url, 200)).toEqual({ kind: 'timeout', timeoutMs: 200 });
  });

  it('is refused without waiting on the timer when nothing is listening', async () => {
    const { url } = await closedUrl();

    const started = Date.now();
    const result = await probe(url, 60_000);
    // A budget far past vitest's own test timeout: a refusal that waited on it fails this test.
    expect(Date.now() - started).toBeLessThan(2_000);
    if (result.kind !== 'refused') throw new Error(`expected refused, got ${result.kind}`);
    expect(result.cause.code).toBe('ECONNREFUSED');
  });

  it('is refused on a localhost url too, where node reports an aggregate over both families', async () => {
    const { port } = await closedUrl();

    // The shape the suite actually meets. Read off `cause.code` alone this is `undefined` on some
    // node versions, and a check built on that classifies a dead backend as an unexplained error.
    const result = await probe(`http://localhost:${port}/`, 60_000);

    if (result.kind !== 'refused') throw new Error(`expected refused, got ${result.kind}`);
    expect(result.cause.code).toBe('ECONNREFUSED');
    // The address is in the line a reader gets, not just the code.
    expect(result.cause.detail).toContain(String(port));
  });

  it('names what node said, which is the one thing "fetch failed" never does', async () => {
    const { url } = await listen((_req, res) => {
      res.socket?.destroy();
    });
    const result = await probe(url, 5_000);
    if (result.kind !== 'error') throw new Error(`expected error, got ${result.kind}`);
    // Every network failure node reports is the same `TypeError: fetch failed`, so the message on
    // its own tells a reader of a CI log nothing at all.
    expect(result.message).toBe('fetch failed');
    expect(result.cause.code).toBeTruthy();
    expect(result.cause.detail).not.toBe('no cause reported');
  });
});

describe('waitUntilUp', () => {
  it('is up once the server answers, though it dropped the connections before that', async () => {
    let attempts = 0;
    const { url } = await listen((_req, res) => {
      attempts += 1;
      if (attempts < 3) {
        res.socket?.destroy();
        return;
      }
      res.end('ok');
    });

    const readiness = await waitUntilUp(url, 10_000, { retryRefused: false });

    expect(readiness.result.kind).toBe('up');
    expect(attempts).toBe(3);
    expect(readiness.attempts).toBe(3);
  });

  it('waits a refusal out when playwright is the one that started the server', async () => {
    const { url, port } = await closedUrl();
    const arriving = new Promise<void>((resolve) => {
      setTimeout(() => {
        void listen((_req, res) => res.end('ok'), port).then(() => resolve());
      }, 600);
    });

    expect((await waitUntilUp(url, 10_000, { retryRefused: true })).result.kind).toBe('up');
    await arriving;
  });

  it('reports a refusal at once when the server is the developer’s to start', async () => {
    const { url } = await closedUrl();

    const started = Date.now();
    const readiness = await waitUntilUp(url, 60_000, { retryRefused: false });
    expect(readiness.result.kind).toBe('refused');
    expect(readiness.attempts).toBe(1);
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it('gives up inside the budget when nothing ever answers', async () => {
    const { url } = await closedUrl();

    const started = Date.now();
    expect((await waitUntilUp(url, 1_000, { retryRefused: true })).result.kind).toBe('refused');
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThan(500);
    expect(elapsed).toBeLessThan(5_000);
  });

  it('counts the requests it made, which is what says it polled rather than slept', async () => {
    const { url } = await closedUrl();

    const readiness = await waitUntilUp(url, 1_500, { retryRefused: true });

    // The reported number is the evidence that separates a dead server from a readiness check that
    // reports on one shot and calls it a window (ISS-10620, then ISS-10840).
    expect(readiness.attempts).toBeGreaterThan(1);
    expect(readiness.elapsedMs).toBeGreaterThan(500);
  });

  it('keeps the first failure beside the last, because what the server does can change', async () => {
    // Drops every connection it accepts, then stops listening part-way through the window.
    const { server, url } = await listen((_req, res) => {
      res.socket?.destroy();
    });

    const polling = waitUntilUp(url, 2_500, { retryRefused: true });
    await new Promise((resolve) => setTimeout(resolve, 700));
    await close(server);
    const readiness = await polling;

    // A server that was answering and then went is a different event from one that was never
    // there, and only the pair of failures says which happened.
    expect(readiness.first.kind).toBe('error');
    expect(readiness.result.kind).toBe('refused');
  });
});

describe('verdict', () => {
  const refusedCause = { codes: ['ECONNREFUSED'], code: 'ECONNREFUSED', detail: 'connect ECONNREFUSED ::1:6697' };

  it('names the cause under a refusal, not just the fact of one', () => {
    expect(verdict({ kind: 'refused', cause: refusedCause })).toContain('connect ECONNREFUSED ::1:6697');
  });

  it('carries the cause beside the message, which on its own is always "fetch failed"', () => {
    const line = verdict({ kind: 'error', message: 'fetch failed', cause: { codes: [], detail: 'SocketError: other side closed' } });
    expect(line).toBe('fetch failed — SocketError: other side closed');
  });

  it('says a timeout found a server, since the connection was accepted', () => {
    expect(verdict({ kind: 'timeout', timeoutMs: 30_000 })).toContain('30.0s');
  });
});

describe('pollSummary', () => {
  const refused: ProbeResult = { kind: 'refused', cause: { codes: ['ECONNREFUSED'], code: 'ECONNREFUSED', detail: 'refused' } };
  const dropped: ProbeResult = { kind: 'error', message: 'fetch failed', cause: { codes: [], detail: 'other side closed' } };

  it('says a single shot was one', () => {
    expect(pollSummary({ result: refused, first: refused, attempts: 1, elapsedMs: 4 })).toBe('1 attempt, over 0.0s.');
  });

  it('counts a window whose every attempt agreed', () => {
    expect(pollSummary({ result: refused, first: refused, attempts: 118, elapsedMs: 30_000 })).toBe(
      '118 attempts over 30.0s, every one of them the same.'
    );
  });

  it('names the first failure when the server changed what it did inside the window', () => {
    expect(pollSummary({ result: refused, first: dropped, attempts: 9, elapsedMs: 2_500 })).toContain(
      'The first of them: fetch failed — other side closed.'
    );
  });
});
// dry-copy-end
