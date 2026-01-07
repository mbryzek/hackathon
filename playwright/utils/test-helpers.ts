/**
 * Test Helper Utilities
 * Common functions used across multiple test files
 */

import fs from "fs";
import path from "path";
import type { Page } from "@playwright/test";
import { config } from "../config";
import type { WaitForElementOptions, ContextOrPage } from "../types";
import {
  ApiClient,
  TestEvent,
  TestEventForm,
} from "../generated/com-bryzek-playwright-vote-v0";

/**
 * Generated API client instance for playwright endpoints
 */
const apiClient = new ApiClient(config.BACKEND_BASE_URL);

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
 * Safe click on a button or link with the given label text
 * Supports both <button> elements and <a> elements (links styled as buttons)
 * Provides clear error messages when element is not found
 */
export async function safeClick(
  page: Page,
  buttonLabel: string,
): Promise<boolean> {
  const retries = 3;
  const timeout = config.TIMEOUTS.action;
  const buttonSelector = `button:has-text("${buttonLabel}")`;
  const linkSelector = `a:has-text("${buttonLabel}")`;

  for (let i = 0; i < retries; i++) {
    try {
      // Try button first
      const buttonVisible = await page
        .waitForSelector(buttonSelector, { timeout: 500, state: "visible" })
        .then(() => true)
        .catch(() => false);

      if (buttonVisible) {
        await page.click(buttonSelector, { timeout });
        return true;
      }

      // Try link
      const linkVisible = await page
        .waitForSelector(linkSelector, { timeout: 500, state: "visible" })
        .then(() => true)
        .catch(() => false);

      if (linkVisible) {
        await page.click(linkSelector, { timeout });
        return true;
      }

      // Neither found, retry if attempts remaining
      if (i === retries - 1) {
        console.error(
          `❌ Button or link with text '${buttonLabel}' not found after ${retries} attempts`,
        );
        await takeScreenshot(page, "click-failed");
        throw new Error(`Button or link with text '${buttonLabel}' not found`);
      }
      await page.waitForTimeout(250);
    } catch (error) {
      if (i === retries - 1) {
        console.error(
          `❌ Button or link with text '${buttonLabel}' not found after ${retries} attempts`,
        );
        await takeScreenshot(page, "click-failed");
        throw new Error(`Button or link with text '${buttonLabel}' not found`);
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
 * API Helper: Create test event directly via API
 */
export async function createTestEvent(
  options: Partial<TestEventForm> = {},
): Promise<TestEvent> {
  const { number_projects = 4, number_students = 0, number_parents = 0 } = options;

  return apiClient.createPlaywrightVoteEvents({
    tenantId: config.TENANT_ID,
    body: {
      number_projects,
      number_parents,
      number_students,
    },
  });
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
