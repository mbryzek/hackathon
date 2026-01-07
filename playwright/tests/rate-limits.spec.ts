/**
 * Rate Limit Tests
 * Tests for rate limiting on authentication endpoints
 * Verifies that login and password reset endpoints have proper rate limits
 *
 * IMPORTANT: These tests use direct fetch() calls WITHOUT the 'X-Bypass-Rate-Limit'
 * header that bypasses rate limiting. This allows us to test actual rate limit
 * enforcement. Other Playwright tests include this header via playwright.config.ts
 * to avoid being rate limited during normal test execution.
 */

import { test, expect } from "../fixtures";
import { config } from "../config";

/**
 * Rate limit configuration from backend:
 * - Login: 10 requests per minute (shared with signup)
 * - Password Reset: 3 requests per minute
 */
const RATE_LIMITS = {
  login: {
    limitPerMinute: 10,
    path: `/community/${config.COMMUNITY_ID}/session/logins`,
  },
  passwordReset: {
    limitPerMinute: 3,
    path: `/community/${config.COMMUNITY_ID}/session/password/changes`,
  },
};

/**
 * Make a login request directly to the API
 * Returns the response status code
 */
async function makeLoginRequest(email: string, password: string): Promise<number> {
  const url = `${config.BACKEND_BASE_URL}${RATE_LIMITS.login.path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return response.status;
}

/**
 * Make a password reset request directly to the API
 * Returns the response status code
 */
async function makePasswordResetRequest(email: string): Promise<number> {
  const url = `${config.BACKEND_BASE_URL}${RATE_LIMITS.passwordReset.path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  return response.status;
}

test.describe("Rate Limits", () => {
  /**
   * Note: These tests verify that rate limiting is properly enforced.
   * They make rapid requests to trigger the rate limiter and check for 429 responses.
   *
   * The rate limiter uses a sliding window, so if tests run too close together,
   * previous test requests may affect the current test's rate limit quota.
   *
   * Tests are run serially to avoid interference between tests sharing the same
   * rate limit quota.
   */
  test.describe.configure({ mode: "serial" });

  test("Login endpoint enforces rate limit", async ({ apiHelpers }) => {
    const testEmail = await apiHelpers.generateRandomEmailAsync();
    const password = "test-password-123";

    const responses: number[] = [];

    // Make 15 rapid requests to ensure we exceed the limit
    // Rate limit is 10 per minute, so we should see 429s after ~10 requests
    for (let i = 0; i < 15; i++) {
      const status = await makeLoginRequest(testEmail, password);
      responses.push(status);
    }

    // We should see at least one 429 response indicating rate limiting is enforced
    const rateLimited = responses.filter((s) => s === 429);
    expect(
      rateLimited.length,
      "Login endpoint should return HTTP 429 when rate limited",
    ).toBeGreaterThan(0);

    // Non-rate-limited responses should be auth failures (401), not server errors
    const nonRateLimited = responses.filter((s) => s !== 429);
    const serverErrors = nonRateLimited.filter((s) => s >= 500);
    expect(
      serverErrors.length,
      "Non-rate-limited requests should not return server errors",
    ).toBe(0);
  });

  test("Password reset endpoint enforces rate limit", async ({ apiHelpers }) => {
    const testEmail = await apiHelpers.generateRandomEmailAsync();

    const responses: number[] = [];

    // Make 6 rapid requests to ensure we exceed the limit
    // Rate limit is 3 per minute, so we should see 429s after ~3 requests
    for (let i = 0; i < 6; i++) {
      const status = await makePasswordResetRequest(testEmail);
      responses.push(status);
    }

    // We should see at least one 429 response indicating rate limiting is enforced
    const rateLimited = responses.filter((s) => s === 429);
    expect(
      rateLimited.length,
      "Password reset endpoint should return HTTP 429 when rate limited",
    ).toBeGreaterThan(0);

    // Non-rate-limited responses should not be server errors
    const nonRateLimited = responses.filter((s) => s !== 429);
    const serverErrors = nonRateLimited.filter((s) => s >= 500);
    expect(
      serverErrors.length,
      "Non-rate-limited requests should not return server errors",
    ).toBe(0);
  });

  test("Signup endpoint is also rate limited", async ({ apiHelpers }) => {
    // Make signup requests - these are covered by the same rate limit as login
    const signupUrl = `${config.BACKEND_BASE_URL}/community/${config.COMMUNITY_ID}/session/signups`;
    const responses: number[] = [];

    // Make 15 requests to ensure we exceed the limit (10 per minute)
    // Each signup uses a unique email (signup requires unique emails, unlike login)
    for (let i = 0; i < 15; i++) {
      const email = await apiHelpers.generateRandomEmailAsync();
      const response = await fetch(signupUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: "TestPassword123!",
        }),
      });
      responses.push(response.status);
    }

    // We should see at least one 429 response indicating rate limiting is enforced
    const rateLimited = responses.filter((s) => s === 429);
    expect(
      rateLimited.length,
      "Signup endpoint should return HTTP 429 when rate limited",
    ).toBeGreaterThan(0);
  });
});
