/**
 * Game List and Filters Tests
 * Tests for game list display, filtering, and dashboard features
 * Covers: game filters, responsive design, form validation, quick actions
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Game List and Filters", () => {
  test("Filters Show Correct Games", async ({
    authenticatedContext,
    apiHelpers,
  }) => {
    const { page, session } = authenticatedContext;

    // Create both upcoming and past games
    const upcoming = await helpers.createGame({
      status: helpers.TestGameStatus.Upcoming,
      created_by_user_id: session.user.id,
    });
    const past = await helpers.createGame({
      status: helpers.TestGameStatus.Past,
      created_by_user_id: session.user.id,
    });

    await apiHelpers.loadUrl(page, "/dashboard");

    // "Upcoming" filter is default - click upcoming game and verify URL
    await page.locator(`[data-game-id="${upcoming.game.id}"]`).click();
    await page.waitForURL(`**/games/${upcoming.game.id}`);
    expect(page.url()).toContain(`/games/${upcoming.game.id}`);
    await apiHelpers.takeScreenshot(page, "game-filters-upcoming-detail");

    // Go back to dashboard and switch to "Past" filter
    await apiHelpers.loadUrl(page, "/dashboard");
    await page.locator('a:has-text("Past")').click();

    // Click past game and verify URL
    await page.locator(`[data-game-id="${past.game.id}"]`).click();
    await page.waitForURL(`**/games/${past.game.id}`);
    expect(page.url()).toContain(`/games/${past.game.id}`);
    await apiHelpers.takeScreenshot(page, "game-filters-past-detail");
  });

  test("Responsive Design - Mobile View", async ({
    authenticatedPage: page,
    apiHelpers,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await apiHelpers.loadUrl(page, "/dashboard");

    await expect(page.locator("body")).toBeVisible();

    // Verify Schedule Game button is visible
    const scheduleElement = page.locator(':has-text("Schedule Game")').first();
    await expect(scheduleElement).toBeVisible();

    await apiHelpers.takeScreenshot(page, "milestone3-mobile-view");

    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("Header Nav Items", async ({ authenticatedPage: page, apiHelpers }) => {
    // Start on partners page to test navigation back to dashboard
    await apiHelpers.loadUrl(page, "/partners");

    // Test each nav item navigates to correct page
    // Note: "Games" was renamed to "Dashboard" in the marketing site merge
    await page.locator('nav a:has-text("Dashboard")').click();
    await page.waitForURL((url) => url.pathname === "/" || url.pathname.includes("/dashboard"));

    await page.locator('nav a:has-text("Partners")').click();
    await page.waitForURL((url) => url.pathname.includes("/partners"));

    await page.locator('nav a:has-text("Profile")').click();
    await page.waitForURL((url) => url.pathname.includes("/profile"));

    await page.locator('nav a:has-text("Logout")').click();
    await page.waitForURL((url) => url.pathname.includes("/logout") || url.pathname.includes("/login"));

    await apiHelpers.takeScreenshot(page, "header-nav-items");
  });
});
