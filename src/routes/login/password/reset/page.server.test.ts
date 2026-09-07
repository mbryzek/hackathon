import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Only `platformApi.requestPasswordReset` is reached by this action; the rest of the platform
 * API is stubbed so a call to any of it would be a visible failure rather than a real request.
 */
const requestPasswordReset = vi.fn();
vi.mock('$lib/server/platformApi', () => ({
  platformApi: {
    requestPasswordReset: (email: string) => requestPasswordReset(email),
    verifyEmail: () => Promise.reject(new Error('not part of this page')),
    getActivation: () => Promise.reject(new Error('not part of this page')),
    setActivationPassword: () => Promise.reject(new Error('not part of this page')),
    changePassword: () => Promise.reject(new Error('not part of this page'))
  }
}));

const { actions } = await import('./+page.server');

function submit(email: string | undefined) {
  const formData = new FormData();
  if (email !== undefined) formData.set('email', email);
  return actions.default({ request: { formData: async () => formData } } as never);
}

/** `fail` and a plain return both land here; this reads either. */
function result(value: unknown): { status?: number; error: string | null; email: string; sent: boolean } {
  const record = value as { status?: number; data?: unknown };
  return { status: record.status, ...(record.data ?? record) } as never;
}

beforeEach(() => {
  requestPasswordReset.mockReset();
  requestPasswordReset.mockResolvedValue({ data: undefined, status: 204 });
});

describe('the forgot-password request', () => {
  it('asks the platform to mail the address the person typed', async () => {
    const outcome = result(await submit('  admin@example.com  '));

    // Trimmed: a pasted address routinely carries a trailing space, and the platform matches
    // the address exactly.
    expect(requestPasswordReset).toHaveBeenCalledWith('admin@example.com');
    expect(outcome).toEqual({ status: undefined, error: null, email: 'admin@example.com', sent: true });
  });

  it('acknowledges an address with no account exactly as it acknowledges one with an account', async () => {
    // The platform answers 204 for both, deliberately, so that nobody can use this page to
    // learn which addresses hold hackathon accounts. Whatever this page does with a 204 is
    // therefore the whole of what a caller can observe.
    const known = result(await submit('admin@example.com'));
    const unknown = result(await submit('nobody@example.com'));

    expect({ ...known, email: '' }).toEqual({ ...unknown, email: '' });
  });

  it('refuses an empty address without calling the platform', async () => {
    expect(result(await submit('   '))).toEqual({ status: 400, error: 'Enter your email address.', email: '', sent: false });
    expect(result(await submit(undefined))).toEqual({ status: 400, error: 'Enter your email address.', email: '', sent: false });
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("shows the platform's own refusal and keeps the address in the field", async () => {
    // The only 422 this endpoint raises is a blank address, which discloses nothing about
    // anybody; the rate limit and an unreachable API are the other two a person can see.
    requestPasswordReset.mockResolvedValue({ errors: [{ message: 'Email cannot be blank' }], status: 422 });

    expect(result(await submit('not-an-address'))).toEqual({
      status: 422,
      error: 'Email cannot be blank',
      email: 'not-an-address',
      sent: false
    });
  });

  it('reports an unreachable API as 503 rather than passing status 0 to fail()', async () => {
    // `fail(0, ...)` is not an HTTP failure and crashes the no-JS form post path.
    requestPasswordReset.mockResolvedValue({ errors: [{ message: 'Network error' }], status: 0 });

    expect(result(await submit('admin@example.com')).status).toBe(503);
  });

  it('never claims the mail was sent when the call failed', async () => {
    requestPasswordReset.mockResolvedValue({ errors: [{ message: 'Too many requests. Please try again shortly.' }], status: 429 });

    expect(result(await submit('admin@example.com')).sent).toBe(false);
  });
});
