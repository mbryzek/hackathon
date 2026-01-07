/**
 * Playwright Custom Fixtures
 * Reusable test fixtures for voting tests
 */

import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import * as helpers from "./utils/test-helpers";

/**
 * Extended test fixtures
 */
type TestFixtures = {
  /**
   * Creates an event with 1 student code and 2 projects
   * Preferred fixture for most tests (less data on server)
   */
  studentFixture: {
    page: Page;
    event: Awaited<ReturnType<typeof helpers.createTestEvent>>;
  };

  /**
   * Creates an event with 1 parent code and 4 projects
   * Use when testing parent voting (multiple selections)
   */
  parentFixture: {
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
   * Student fixture - minimal data for student voting tests
   * Creates event with 1 student code and 2 projects
   */
  studentFixture: async ({ page }, use) => {
    const event = await helpers.createTestEvent({
      project_names: ["Team 1", "Team 2"],
      number_students: 1,
      number_parents: 0,
    });

    await use({
      page,
      event,
    });
  },

  /**
   * Parent fixture - data for parent voting tests
   * Creates event with 1 parent code and 4 projects
   */
  parentFixture: async ({ page }, use) => {
    const event = await helpers.createTestEvent({
      project_names: ["Team 1", "Team 2", "Team 3", "Team 4"],
      number_students: 0,
      number_parents: 1,
    });

    await use({
      page,
      event,
    });
  },

  /**
   * API helpers fixture
   * Provides access to all helper functions for test data creation and cleanup
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
