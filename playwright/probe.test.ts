import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { probe } from './probe';

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

async function listen(handler: http.RequestListener): Promise<{ server: http.Server; url: string }> {
  const server = http.createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  return { server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/` };
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
    const { server, url } = await listen(() => {});
    await close(server);

    const started = Date.now();
    // A budget far past vitest's own test timeout: a refusal that waited on it fails this test.
    expect(await probe(url, 60_000)).toEqual({ kind: 'refused' });
    expect(Date.now() - started).toBeLessThan(2_000);
  });
});
