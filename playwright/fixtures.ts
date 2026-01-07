/**
 * Playwright Custom Fixtures
 * Reusable test fixtures for Private Dinkers tests
 */

import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import * as helpers from "./utils/test-helpers";

/**
 * Extended test fixtures
 */
type TestFixtures = {
  /**
   * Creates an event with 1 student and 1 parent code
   */
  testEvent: {
    page: Page;
    event: Awaited<ReturnType<typeof helpers.createTestEvent>>;
  };

  /**
   * API client helpers for direct backend interactions
   * Includes all helper functions: createUserSession, createGame, cleanupTestUsers, etc.
   */
  apiHelpers: typeof helpers;
};

/**
 * Extend Playwright test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Test game fixture with authenticated page
   * Creates authenticated user, creates game for that user, and provides both page and game data
   */
  testEvent: async ({ page, context }, use) => {
    const event = await helpers.createTestEvent({
      number_students: 1,
      number_parents: 1,
    });

    // Provide page, game data, and session to test
    await use({
      page,
      event,
    });
  },

  /**
   * API helpers fixture
   * Provides access to all helper functions for test data creation and cleanup
   *
   * Available methods:
   * - createUserSession(): Create unique user with session
   * - createGame(options): Create test game with optional players
   * - cleanupTestUsers(emails): Delete test users
   * - setSessionCookie(context, sessionId): Set authentication cookie
   * - login(page, email, password): UI-based login
   * - And many more utility functions
   */
  apiHelpers: async ({}, use) => {
    await use(helpers);
  },
});

/**
 * Export expect and Page type from Playwright for convenience
 */
export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
