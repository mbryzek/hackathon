/**
 * Player Invitation Initial State Tests
 * Tests the initial invitation view and interactions
 * Verifies: initial invitation display, accept/decline actions, calendar button behavior
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Player Invitation Initial State", () => {
  test("Initial invitation page displays game details", async ({
    page,
    apiHelpers,
  }) => {
    const playerData = await apiHelpers.createTestPlayer();
    const playerId = playerData.id;

    await helpers.loadUrl(page, `/players/${playerId}`);

    await expect(page.locator('h1:has-text("Game Invitation")')).toBeVisible();
    await expect(page.locator('button:has-text("I\'m In!")')).toBeVisible();
    await expect(
      page.locator('button:has-text("Can\'t Make It")'),
    ).toBeVisible();

    const pageContent = await page.content();
    expect(pageContent.includes("When")).toBeTruthy();
    expect(pageContent.includes("Where")).toBeTruthy();
    expect(pageContent.includes("Players")).toBeTruthy();

    const calendarButton = page.locator('text="Add to Calendar"');
    await expect(calendarButton).not.toBeVisible();

    await helpers.takeScreenshot(page, "player-invitation-initial-state");
  });

  test("Accept invitation from initial page", async ({ page, apiHelpers }) => {
    const playerData = await apiHelpers.createTestPlayer();
    const playerId = playerData.id;

    await helpers.loadUrl(page, `/players/${playerId}`);

    await helpers.clickAndWaitForUrl(page, "I\'m In!", `/players/${playerId}`);

    await helpers.takeScreenshot(page, "player-invitation-initial-accepted");
  });

  test("Decline invitation from initial page", async ({ page, apiHelpers }) => {
    const playerData = await apiHelpers.createTestPlayer();
    const playerId = playerData.id;

    await helpers.loadUrl(page, `/players/${playerId}`);

    await helpers.clickAndWaitForUrl(page, "Can't Make It", `/players/${playerId}`);

    await helpers.takeScreenshot(page, "player-invitation-initial-declined");
  });
});
