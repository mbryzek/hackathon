import { describe, it, expect } from 'vitest';
import { dataOr, safeErrorStatus } from './client';
import type { ApiResponse } from './client';

describe('dataOr', () => {
  it('hands back the data of a successful response', () => {
    const response: ApiResponse<number[]> = { status: 200, data: [1, 2] };
    expect(dataOr(response, [])).toEqual([1, 2]);
  });

  it('hands back the fallback for a failed one', () => {
    const response: ApiResponse<number[]> = { status: 404, errors: [{ message: 'Not found' }] };
    expect(dataOr(response, [])).toEqual([]);
  });
});

describe('safeErrorStatus', () => {
  it('passes a real HTTP failure status through, so a page fails with what the API said', () => {
    expect(safeErrorStatus(403)).toBe(403);
    expect(safeErrorStatus(422)).toBe(422);
    expect(safeErrorStatus(500)).toBe(500);
  });

  it('reports the server never answering as 503', () => {
    // `handleApiCall` spells a network failure status 0, which `fail` cannot take.
    expect(safeErrorStatus(0)).toBe(503);
  });

  it('refuses anything else the Response constructor would throw on', () => {
    expect(safeErrorStatus(200)).toBe(503);
    expect(safeErrorStatus(399)).toBe(503);
    expect(safeErrorStatus(600)).toBe(503);
    expect(safeErrorStatus(404.5)).toBe(503);
  });
});
