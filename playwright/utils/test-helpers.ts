/**
 * Test Helper Utilities
 * Common functions used across multiple test files
 */

import fs from "fs";
import path from "path";
import type { Page } from "@playwright/test";
import { config } from "../config";
import type {
  TenantSession,
  TestGame,
  TestGameForm,
  GuestConnection,
  WaitForElementOptions,
  ContextOrPage,
} from "../types";
import { TestGameStatus } from "../types";
import { ApiClient } from "../generated/com-bryzek-playwright-v0";

// Re-export TestGameStatus for convenience
export { TestGameStatus };
import type { Player } from "../../src/generated/com-bryzek-privatedinkers-api-v0";

/**
 * Generated API client instance for playwright endpoints
 */
const apiClient = new ApiClient(config.BACKEND_BASE_URL);

/**
 * UUID cache for batch fetching - reduces API calls
 */
const uuidCache: string[] = [];
const UUID_BATCH_SIZE = 10;

/**
 * Generate a random UUID via the backend API
 * Uses batched fetching to reduce API calls
 */
export async function generateUUID(): Promise<string> {
  if (uuidCache.length === 0) {
    const uuids = await apiClient.createPlaywrightsUuids({
      tenantId: config.COMMUNITY_ID,
      number_: UUID_BATCH_SIZE,
    });
    uuidCache.push(...uuids);
  }
  return uuidCache.pop()!;
}

/**
 * Generate a random email using UUID from backend API
 */
export async function generateRandomEmailAsync(): Promise<string> {
  const uuid = await generateUUID();
  return `playwright-${uuid}@${config.TestEmailDomain}`;
}

/**
 * API Helper: Clean up test users
 * Deletes test users from the database via the cleanup API endpoint
 * @param emails - Single email or array of emails to delete
 * @param sync - If true, server will synchronously delete the user
 */
export async function cleanupTestUsers(
  emails: string | string[],
  sync: boolean = false,
): Promise<void> {
  // Convert single email to array for consistent handling
  const emailArray = Array.isArray(emails) ? emails : [emails];

  try {
    await apiClient.deletePlaywrightUsers({
      tenantId: config.COMMUNITY_ID,
      body: { emails: emailArray },
      sync,
    });
  } catch (error) {
    console.log(`ℹ️  Cleanup response Failed: ${error}`);
  }
}

/**
 * API Helper: Create user and session directly via API
 * Performance optimization to avoid UI-based login flow
 * Creates a new random test user each time with no parameters needed
 */
export async function createUserSession(): Promise<TenantSession> {
  return apiClient.createPlaywrightUsersAndSession(config.COMMUNITY_ID);
}

/**
 * API Helper: Create test player invitation
 * Creates a player invitation in "invited" status for testing player flows
 * Returns a Player object with id that can be used to test acceptance/decline
 */
export async function createTestPlayer(): Promise<Player> {
  return apiClient.createPlaywrightPlayers(config.COMMUNITY_ID);
}

/**
 * API Helper: Get password reset token for a user
 */
export async function getPasswordResetToken(email: string): Promise<string> {
  const result = await apiClient.getPlaywrightPasswordAndResetAndTokenByEmail({
    tenantId: config.COMMUNITY_ID,
    email,
  });
  return result.token;
}

/**
 * Set session cookie in browser context
 */
export async function setSessionCookie(
  context: ContextOrPage,
  sessionId: string,
): Promise<void> {
  const cookieContext = "context" in context ? context.context() : context;

  await cookieContext.addCookies([
    {
      name: "session_id",
      value: sessionId,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(
  page: Page,
  name: string,
): Promise<string | undefined> {
  if (!config.SCREENSHOTS.enabled) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(config.SCREENSHOTS.path, filename);

  // Ensure directory exists
  if (!fs.existsSync(config.SCREENSHOTS.path)) {
    fs.mkdirSync(config.SCREENSHOTS.path, { recursive: true });
  }

  await page.screenshot({
    path: filepath,
    fullPage: config.SCREENSHOTS.fullPage,
  });

  console.log(`        Screenshot: ${filepath}`);
  return filepath;
}

/**
 * Wait for element with custom timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: WaitForElementOptions = {},
): Promise<boolean> {
  const timeout = options.timeout || config.TIMEOUTS.default;

  try {
    await page.waitForSelector(selector, { timeout, ...options });
    return true;
  } catch (error) {
    console.error(`❌ Element not found: ${selector}`);
    await takeScreenshot(page, "element-not-found");
    throw error;
  }
}

/**
 * Safe click on a button with the given label text
 * Provides clear error messages when button is not found
 */
export async function safeClick(
  page: Page,
  buttonLabel: string,
): Promise<boolean> {
  const retries = 3;
  const timeout = config.TIMEOUTS.action;
  const selector = `button:has-text("${buttonLabel}")`;

  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout, state: "visible" });
      await page.click(selector, { timeout });
      return true;
    } catch (error) {
      if (i === retries - 1) {
        console.error(
          `❌ Button with text '${buttonLabel}' not found after ${retries} attempts`,
        );
        await takeScreenshot(page, "click-failed");
        throw new Error(`Button with text '${buttonLabel}' not found`);
      }
      await page.waitForTimeout(250);
    }
  }
  return false;
}

/**
 * Wait for a condition to be met by polling repeatedly
 * @param conditionFn - Function that returns true when condition is met
 * @param options - Configuration options
 * @example
 *   // Wait for URL to change
 *   await waitForCondition(
 *     () => page.url().includes("/dashboard"),
 *     { description: "navigation to dashboard" }
 *   );
 *
 *   // Wait for element to disappear
 *   await waitForCondition(
 *     async () => await page.locator('.loading').count() === 0,
 *     { description: "loading indicator to disappear" }
 *   );
 */
export async function waitForCondition(
  conditionFn: () => boolean | Promise<boolean>,
  options: {
    intervalMs?: number;
    maxAttempts?: number;
    description?: string;
  } = {},
): Promise<void> {
  const intervalMs = options.intervalMs || 250;
  const maxAttempts = options.maxAttempts || 10;
  const description = options.description || "condition to be met";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await conditionFn();
    if (result) {
      return; // Condition met!
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(
    `Timeout waiting for ${description} after ${maxAttempts} attempts (${maxAttempts * intervalMs}ms)`,
  );
}

/**
 * Click a button or link with the given label and wait for URL to match pattern
 * Supports both <button> elements and <a> elements (links styled as buttons)
 * Provides clear error messages when element is not found
 * @param page - Playwright page object
 * @param buttonLabel - Text label of the button/link to click
 * @param urlPattern - URL pattern to match
 * @example
 *   await clickAndWaitForUrl(page, "Submit", "/dashboard");
 *   await clickAndWaitForUrl(page, "Logout", "/login");
 */
export async function clickAndWaitForUrl(
  page: Page,
  buttonLabel: string,
  urlPattern: string,
): Promise<void> {
  const timeout = config.TIMEOUTS.navigation;
  // Support both buttons and anchor tags (links styled as buttons)
  const buttonSelector = `button:has-text("${buttonLabel}")`;
  const linkSelector = `a:has-text("${buttonLabel}")`;

  // Wait for either a button or link to be visible
  let selector: string;
  try {
    // Try button first
    const buttonVisible = await page
      .waitForSelector(buttonSelector, { timeout: 1000, state: "visible" })
      .then(() => true)
      .catch(() => false);

    if (buttonVisible) {
      selector = buttonSelector;
    } else {
      // Try link
      await page.waitForSelector(linkSelector, {
        timeout: timeout - 1000,
        state: "visible",
      });
      selector = linkSelector;
    }
  } catch (error) {
    await takeScreenshot(page, "button-not-found");
    throw new Error(`Button or link with text '${buttonLabel}' not found`);
  }

  // Click the element
  await page.click(selector);

  // Wait for URL to match pattern
  await page.waitForURL(
    (url) => {
      const urlString = url.toString();
      return urlString.includes(urlPattern);
    },
    { timeout },
  );
}

/**
 * Fill form field with validation
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string,
): Promise<void> {
  await page.waitForSelector(selector, { state: "visible" });
  await page.fill(selector, value);

  // Verify value was set
  const actualValue = await page.inputValue(selector);
  if (actualValue !== value) {
    throw new Error(
      `Failed to fill field ${selector}. Expected: ${value}, Got: ${actualValue}`,
    );
  }
}

/**
 * Check for error messages on page
 */
export async function checkForErrors(page: Page): Promise<string[]> {
  const errorSelectors = [
    ".error-message",
    '[class*="error"]',
    '[class*="Error"]',
  ];

  for (const selector of errorSelectors) {
    const errors = await page.locator(selector).all();
    if (errors.length > 0) {
      const errorTexts = await Promise.all(
        errors.map(async (el) => await el.textContent()),
      );
      return errorTexts.filter((text): text is string => text !== null);
    }
  }

  return [];
}

/**
 * API Helper: Create test game directly via API
 * Performance optimization to avoid UI-based game creation flow
 * Creates a new game with sensible defaults, optionally with players
 *
 * @example
 *   // Create upcoming game without players
 *   const { game, players } = await createGame();
 *
 *   // Create past game for review testing
 *   const { game, players } = await createGame({ status: TestGameStatus.Past });
 *
 *   // Create game with one invited player
 *   const { game, players } = await createGame({
 *     players: [{ status: PlayerStatus.Invited }]
 *   });
 *
 *   // Create game with players in various states
 *   const { game, players } = await createGame({
 *     players: [
 *       { status: PlayerStatus.Invited },
 *       { status: PlayerStatus.Accepted },
 *       { status: PlayerStatus.Declined }
 *     ]
 *   });
 *
 *   // Create mixed game with couple (male and female players)
 *   const { game, players } = await createGame({
 *     game_type: GameType.Mixed,
 *     players: [
 *       { status: PlayerStatus.Accepted, gender: Gender.Male },
 *       { status: PlayerStatus.Accepted, gender: Gender.Female }
 *     ]
 *   });
 *
 *   // Create past game with organizer as accepted player (for review testing)
 *   const { game, players } = await createGame({
 *     status: TestGameStatus.Past,
 *     add_user_to_game: true
 *   });
 */
export async function createGame(
  options: Partial<TestGameForm> = {},
): Promise<TestGame> {
  const {
    status = TestGameStatus.Upcoming,
    players = [],
    created_by_user_id,
    add_user_to_game = false,
    game_type,
  } = options;

  return apiClient.createPlaywrightGames({
    tenantId: config.COMMUNITY_ID,
    body: {
      status,
      players,
      created_by_user_id,
      add_user_to_game,
      ...(game_type ? { game_type } : {}),
    },
  });
}

/**
 * Result of creating a guest connection
 */
export interface CreateGuestConnectionResult {
  guestConnection: GuestConnection;
  email: string;
}

/**
 * API Helper: Create guest connection directly via API
 * Creates a guest connection for the specified user
 * Throws an error if the created guest connection does not have an email
 *
 * @example
 *   const { guestConnection, email } = await createGuestConnection(userId);
 *   console.log(email);
 */
export async function createGuestConnection(
  userId: string,
): Promise<CreateGuestConnectionResult> {
  const guestConnection =
    await apiClient.createPlaywrightConnectionsAndGuest({
      tenantId: config.COMMUNITY_ID,
      body: { user_id: userId },
    });

  if (!guestConnection.guest.email) {
    throw new Error("Guest connection was created without an email address");
  }

  return {
    guestConnection,
    email: guestConnection.guest.email,
  };
}

/**
 * Assert element is visible
 */
export async function assertVisible(
  page: Page,
  selector: string,
  message?: string,
): Promise<void> {
  const isVisible = await page.locator(selector).isVisible();
  if (!isVisible) {
    await takeScreenshot(page, "assert-visible-failed");
    throw new Error(message || `Element not visible: ${selector}`);
  }
}

/**
 * Assert text content
 * Searches across all matching elements to find the expected text
 */
export async function assertText(
  page: Page,
  selector: string,
  expectedText: string,
): Promise<void> {
  const elements = await page.locator(selector).all();

  // Search through all matching elements
  for (const element of elements) {
    const actualText = await element.textContent();
    if (actualText && actualText.includes(expectedText)) {
      return; // Found it! Test passes
    }
  }

  // If we get here, we didn't find the text in any element
  await takeScreenshot(page, "assert-text-failed");
  throw new Error(
    `Did not find expected text "${expectedText}" in any ${selector} element (checked ${elements.length} elements)`,
  );
}

/**
 * Check if text content is visible in any matching element
 * Returns true if the expected text is found in a visible element
 */
export async function isVisibleText(
  page: Page,
  selector: string,
  expectedText: string,
): Promise<boolean> {
  const elements = await page.locator(selector).all();

  for (const element of elements) {
    const actualText = await element.textContent();

    if (actualText && actualText.includes(expectedText)) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Assert text content AND visibility
 * Searches across all matching elements to find the expected text in a visible element
 */
export async function assertVisibleText(
  page: Page,
  selector: string,
  expectedText: string,
): Promise<void> {
  const found = await isVisibleText(page, selector, expectedText);

  if (!found) {
    await takeScreenshot(page, "assert-visible-text-failed");
    throw new Error(
      `Did not find expected text "${expectedText}" in any visible ${selector} element`,
    );
  }
}

/**
 * Navigate to a URL and wait for page to load with enhanced timing controls
 *
 * @example
 * // Basic usage (waits for network idle and loading indicators)
 * await loadUrl(page, "/games/schedule");
 */
export async function loadUrl(page: Page, path: string): Promise<void> {
  // If path starts with http, use as-is, otherwise prepend FRONTEND_BASE_URL
  const url = path.startsWith("http")
    ? path
    : `${config.FRONTEND_BASE_URL}${path}`;

  const response = await page.goto(url);

  // Verify successful page load
  if (!response) {
    throw new Error(`Failed to load ${url}: No response received`);
  }

  const status = response.status();
  if (status !== 200) {
    throw new Error(
      `Failed to load ${url}: Expected HTTP 200 but got ${status}`,
    );
  }

  await page.waitForLoadState("load");

  try {
    // Wait for "Loading..." text to disappear (common pattern in auth-protected pages)
    const loadingText = page.locator('text="Loading..."');
    if ((await loadingText.count()) > 0) {
      await loadingText.waitFor({ state: "hidden", timeout: 3000 });
    }
  } catch (e) {
    // Ignore timeout errors - loading text may not be present
  }
}
