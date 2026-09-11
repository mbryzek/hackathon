import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { probe, waitUntilUp } from './probe';

/**
 * What global setup is told about a server, tested against real sockets.
 *
 * The distinction these hold is the one the suite's readiness check is built on: a server that
 * accepted the connection is running however long its first answer takes, and only a refusal
 * means nothing is there. Each server here answers on a loopback port of its own.
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
    // A budget far past vitest's own test timeout: a refusal that waited on it fails this test.
    expect(await probe(url, 60_000)).toEqual({ kind: 'refused' });
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it('names the system error code, which is the one thing "fetch failed" never says', async () => {
    const { url } = await listen((_req, res) => {
      res.socket?.destroy();
    });
    const result = await probe(url, 5_000);
    if (result.kind !== 'error') throw new Error(`expected error, got ${result.kind}`);
    // Every network failure node reports is the same `TypeError: fetch failed`, so the message on
    // its own tells a reader of a CI log nothing at all.
    expect(result.message).toBe('fetch failed');
    expect(result.code).toBeTruthy();
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

    expect((await waitUntilUp(url, 10_000, { retryRefused: false })).kind).toBe('up');
    expect(attempts).toBe(3);
  });

  it('waits a refusal out when playwright is the one that started the server', async () => {
    const { url, port } = await closedUrl();
    const arriving = new Promise<void>((resolve) => {
      setTimeout(() => {
        void listen((_req, res) => res.end('ok'), port).then(() => resolve());
      }, 600);
    });

    expect((await waitUntilUp(url, 10_000, { retryRefused: true })).kind).toBe('up');
    await arriving;
  });

  it('reports a refusal at once when the server is the developer’s to start', async () => {
    const { url } = await closedUrl();

    const started = Date.now();
    expect(await waitUntilUp(url, 60_000, { retryRefused: false })).toEqual({ kind: 'refused' });
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it('gives up inside the budget when nothing ever answers', async () => {
    const { url } = await closedUrl();

    const started = Date.now();
    expect((await waitUntilUp(url, 1_000, { retryRefused: true })).kind).toBe('refused');
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThan(500);
    expect(elapsed).toBeLessThan(5_000);
  });
});
