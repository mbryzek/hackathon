/**
 * Playwright Custom Fixtures
 * Reusable test fixtures for Private Dinkers tests
 */

import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { TenantSession } from "./types";
import * as helpers from "./utils/test-helpers";

/**
 * Extended test fixtures
 */
type TestFixtures = {
  /**
   * Page with an authenticated user session
   * Automatically creates a test user and sets session cookie
   */
  authenticatedPage: Page;

  /**
   * Test session data created via API
   * Automatically cleaned up after test
   */
  testSession: TenantSession;

  /**
   * Authenticated context with both page and session data
   * Use this when you need both the authenticated page AND the session info
   * Example: Creating a game for the authenticated user
   */
  authenticatedContext: { page: Page; session: TenantSession };

  /**
   * Test game with authenticated page
   * Creates an authenticated user, creates a game for that user, and provides both
   * the page and game data. Automatically cleans up after test.
   * Use this when you need both an authenticated page and a game.
   */
  testGame: {
    page: Page;
    game: Awaited<ReturnType<typeof helpers.createGame>>["game"];
    players: Awaited<ReturnType<typeof helpers.createGame>>["players"];
    session: TenantSession;
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
   * Authenticated page fixture
   * Provides a page with user session already set up
   */
  authenticatedPage: async ({ page, context }, use) => {
    // Create user session via API
    const sessionData = await helpers.createUserSession();

    // Set session cookie
    await helpers.setSessionCookie(context, sessionData.session.id);

    // Use the authenticated page
    await use(page);

    // Use sync=true to ensure cleanup completes before next test
    await helpers.cleanupTestUsers(sessionData.user.email.address, true);
  },

  /**
   * Test session fixture
   * Creates a test user and session, cleans up after test
   */
  testSession: async ({}, use) => {
    const sessionData = await helpers.createUserSession();

    await use(sessionData);

    // Use sync=true to ensure cleanup completes before next test
    await helpers.cleanupTestUsers(sessionData.user.email.address, true);
  },

  /**
   * Authenticated context fixture
   * Provides both authenticated page and user session data
   * Perfect for tests that need to create data for the authenticated user
   */
  authenticatedContext: async ({ page, context }, use) => {
    // Create user session via API
    const sessionData = await helpers.createUserSession();

    // Set session cookie
    await helpers.setSessionCookie(context, sessionData.session.id);

    // Provide both page and session data
    await use({ page, session: sessionData });

    // Use sync=true to ensure cleanup completes before next test
    await helpers.cleanupTestUsers(sessionData.user.email.address, true);
  },

  /**
   * Test game fixture with authenticated page
   * Creates authenticated user, creates game for that user, and provides both page and game data
   */
  testGame: async ({ page, context }, use) => {
    // Create user session via API
    const sessionData = await helpers.createUserSession();

    // Set session cookie
    await helpers.setSessionCookie(context, sessionData.session.id);

    // Create game for this user via API
    const gameData = await helpers.createGame({
      created_by_user_id: sessionData.user.id,
    });

    // Provide page, game data, and session to test
    await use({
      page,
      game: gameData.game,
      players: gameData.players,
      session: sessionData,
    });

    // Use sync=true to ensure cleanup completes before next test
    await helpers.cleanupTestUsers(sessionData.user.email.address, true);
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
