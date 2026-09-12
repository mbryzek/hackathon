import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { backendUnreachable, explainingFetch } from './backendUnreachable';
import { config } from './config';

/**
 * What a spec is told when the e2e backend goes away mid-suite.
 *
 * The two transport shapes are produced against real sockets rather than hand-built, because the
 * whole claim is about what node's fetch actually throws: a connection closed under an in-flight
 * request, and a connection refused because nothing is listening. Node reports both as the same
 * `TypeError: fetch failed` and puts the difference on `cause`.
 */

const servers: http.Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => close(server)));
});

function close(server: http.Server): Promise<void> {
  server.closeAllConnections();
  return new Promise((resolve) => server.close(() => resolve()));
}

async function listen(handler: http.RequestListener): Promise<string> {
  const server = http.createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
}

/** A url nothing is listening on: bind a port, then hand it back closed. */
async function closedUrl(): Promise<string> {
  const server = http.createServer(() => {});
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  await close(server);
  return url;
}

/** The error `fetch` threw, whatever it was. */
async function thrownBy(url: string): Promise<unknown> {
  try {
    await fetch(url);
  } catch (error) {
    return error;
  }
  throw new Error(`expected ${url} to fail`);
}

describe('backendUnreachable', () => {
  it('explains a connection refused, which is every request after the backend is gone', async () => {
    const explained = backendUnreachable(await thrownBy(await closedUrl()));

    expect(explained).toBeDefined();
    // The url a reader has to go and look at, not the one the spec happened to be calling.
    expect(explained?.message).toContain(config.BACKEND_BASE_URL);
    expect(explained?.message).toContain('ECONNREFUSED');
    // The one artifact that holds what the container did before it stopped.
    expect(explained?.message).toContain('backend.log');
  });

  it('explains a connection dropped under an in-flight request, which is the FIRST such spec', async () => {
    const url = await listen((_req, res) => {
      res.socket?.destroy();
    });

    const explained = backendUnreachable(await thrownBy(url));

    expect(explained).toBeDefined();
    // Not a bare `AggregateError` with an empty message: the cause is named, and it is the shape
    // that says this spec was the one running when the backend went.
    expect(explained?.message).toMatch(/SocketError|ECONNRESET|other side closed/);
  });

  it('keeps the original error as the cause, so the stack is not lost', async () => {
    const original = await thrownBy(await closedUrl());
    expect(backendUnreachable(original)?.cause).toBe(original);
  });

  it('says so rather than naming a cause when node reported none', () => {
    expect(backendUnreachable(new TypeError('fetch failed'))?.message).toContain('no cause reported');
  });

  it('leaves anything that is not a transport failure alone', () => {
    // Swallowing one of these would hide a real finding behind a dead-backend sentence.
    expect(backendUnreachable(new Error('HTTP 404'))).toBeUndefined();
    expect(backendUnreachable(new TypeError('Failed to parse URL'))).toBeUndefined();
    expect(backendUnreachable('fetch failed')).toBeUndefined();
    expect(backendUnreachable(undefined)).toBeUndefined();
  });
});

describe('explainingFetch', () => {
  it('answers exactly as fetch does when the server is there', async () => {
    const url = await listen((_req, res) => {
      res.statusCode = 422;
      res.end('{}');
    });

    const response = await explainingFetch(url);

    expect(response.status).toBe(422);
    expect(await response.text()).toBe('{}');
  });

  it('throws the explanation instead of a bare "fetch failed" when it is not', async () => {
    await expect(explainingFetch(await closedUrl())).rejects.toThrow(/is not answering/);
  });
});
