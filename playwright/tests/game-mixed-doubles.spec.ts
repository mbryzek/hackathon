/**
 * Game Mixed Doubles Tests
 * Tests for mixed doubles gender handling on the players page
 * Covers: gender-split lists, unknown gender section, gender editing
 */

import { test, expect, type Page } from "../fixtures";
import * as helpers from "../utils/test-helpers";
import {
  PlayerStatus,
  GameType,
} from "../../src/generated/com-bryzek-privatedinkers-api-v0";
import { Gender } from "../../src/generated/com-bryzek-platform-v0";

/**
 * Wait for the draggable player list to be populated with expected number of players
 * The refactored app uses div elements with cursor-grab class for draggable items
 */
async function waitForPlayerList(
  page: Page,
  expectedCount: number,
): Promise<void> {
  await helpers.waitForCondition(
    async () => {
      // Wait for the "Invite Order" heading to appear
      const heading = page.locator('h2').filter({ hasText: 'Invite Order' });
      if ((await heading.count()) === 0) return false;

      // Look for divs with cursor-grab class (the draggable player items)
      const playerItems = page.locator('div.cursor-grab');
      const count = await playerItems.count();
      return count >= expectedCount;
    },
    {
      description: `${expectedCount} players to appear in invite order list`,
      maxAttempts: 20,
    },
  );
}

/**
 * Get the player names from a draggable list in their current order
 */
async function getPlayerNamesInOrder(
  page: Page,
  listLocator?: string,
): Promise<string[]> {
  const playerRows = listLocator
    ? page.locator(listLocator).locator('div.cursor-grab')
    : page.locator('div.cursor-grab');
  const count = await playerRows.count();
  const names: string[] = [];

  for (let i = 0; i < count; i++) {
    const row = playerRows.nth(i);
    const nameElement = row.locator("span.font-medium");
    const name = await nameElement.textContent();
    if (name) {
      names.push(name.trim());
    }
  }

  return names;
}

/**
 * Drag a player from one position to another within a specific list
 */
async function dragPlayerToPosition(
  page: Page,
  fromIndex: number,
  toIndex: number,
  listLocator?: string,
): Promise<void> {
  const playerRows = listLocator
    ? page.locator(listLocator).locator('div.cursor-grab')
    : page.locator('div.cursor-grab');

  const sourceRow = playerRows.nth(fromIndex);
  const targetRow = playerRows.nth(toIndex);

  const sourceBbox = await sourceRow.boundingBox();
  const targetBbox = await targetRow.boundingBox();

  if (!sourceBbox || !targetBbox) {
    throw new Error("Could not get bounding boxes for drag operation");
  }

  const sourceX = sourceBbox.x + sourceBbox.width / 2;
  const sourceY = sourceBbox.y + sourceBbox.height / 2;
  const targetX = targetBbox.x + targetBbox.width / 2;
  const targetY =
    toIndex < fromIndex
      ? targetBbox.y + 5
      : targetBbox.y + targetBbox.height - 5;

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.waitForTimeout(100);

  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const currentX = sourceX + (targetX - sourceX) * (i / steps);
    const currentY = sourceY + (targetY - sourceY) * (i / steps);
    await page.mouse.move(currentX, currentY);
    await page.waitForTimeout(20);
  }

  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(300);
}

test.describe("Mixed Doubles Gender Handling", () => {
  test("Non-mixed game shows single player list", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // Create a non-mixed game with 3 waitlisted players
    const gameResult = await helpers.createGame({
      created_by_user_id: session.user.id,
      players: [
        { status: PlayerStatus.Waitlisted },
        { status: PlayerStatus.Waitlisted },
        { status: PlayerStatus.Waitlisted },
      ],
    });

    const game = gameResult.game;

    // Navigate to the players page
    await apiHelpers.loadUrl(page, `/games/${game.id}/players`);

    // Wait for the player list to load
    await waitForPlayerList(page, 3);

    // Verify single draggable list exists in the "Invite Order" section
    // The new structure uses div elements with cursor-grab class
    const playerItems = page.locator('div.cursor-grab');
    expect(await playerItems.count()).toBe(3);

    // Verify no gender-specific headers (Female Players, Male Players)
    const femaleHeader = page.locator("text=Female Players");
    const maleHeader = page.locator("text=Male Players");
    expect(await femaleHeader.count()).toBe(0);
    expect(await maleHeader.count()).toBe(0);

    // Verify no unknown gender section
    const unknownSection = page.locator("text=/Players with Unknown Gender/");
    expect(await unknownSection.count()).toBe(0);

    await apiHelpers.takeScreenshot(page, "non-mixed-game-single-list");
  });

  test("Mixed game with known genders shows separate female/male lists", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // TODO: This test requires backend support to create mixed games with couples
    // The refactoring changed mixed games to use CouplePlayer (pairs) instead of
    // IndividualPlayer with gender. The test helper API needs to be updated to
    // support creating couples for mixed games.
    test.skip();

    // Create a mixed doubles game with 2 female and 2 male waitlisted players
    const gameResult = await helpers.createGame({
      created_by_user_id: session.user.id,
      game_type: GameType.Mixed,
      players: [
        { status: PlayerStatus.Waitlisted, gender: Gender.Female },
        { status: PlayerStatus.Waitlisted, gender: Gender.Female },
        { status: PlayerStatus.Waitlisted, gender: Gender.Male },
        { status: PlayerStatus.Waitlisted, gender: Gender.Male },
      ],
    });

    const game = gameResult.game;

    // Navigate to the players page
    await apiHelpers.loadUrl(page, `/games/${game.id}/players`);

    // Wait for the page to load
    await helpers.waitForCondition(
      async () => {
        const femaleHeader = page.locator("text=Female Players");
        const maleHeader = page.locator("text=Male Players");
        return (
          (await femaleHeader.count()) > 0 && (await maleHeader.count()) > 0
        );
      },
      {
        description: "Female and Male headers to appear",
        maxAttempts: 20,
      },
    );

    // Verify Female Players header exists
    const femaleHeader = page.locator("text=Female Players");
    expect(await femaleHeader.count()).toBe(1);

    // Verify Male Players header exists
    const maleHeader = page.locator("text=Male Players");
    expect(await maleHeader.count()).toBe(1);

    // Verify no single unified list (no generic order numbers outside the lists)
    const allPlayerRows = page.locator('[class*="cursor-move"]');
    const femaleList = page
      .locator("h3:has-text('Female Players')")
      .locator("..")
      .locator("..") // Go up to parent container
      .locator('[class*="cursor-move"]');
    const maleList = page
      .locator("h3:has-text('Male Players')")
      .locator("..")
      .locator("..") // Go up to parent container
      .locator('[class*="cursor-move"]');

    // Should have 2 female players
    expect(await femaleList.count()).toBe(2);

    // Should have 2 male players
    expect(await maleList.count()).toBe(2);

    // Total should be 4 players
    expect(await allPlayerRows.count()).toBe(4);

    await apiHelpers.takeScreenshot(page, "mixed-game-separate-lists");
  });

  test("Unknown gender players shown in separate section", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // TODO: This test requires backend support to create mixed games with couples
    // The refactoring changed mixed games to use CouplePlayer (pairs) instead of
    // IndividualPlayer with gender. The test helper API needs to be updated to
    // support creating couples for mixed games.
    test.skip();

    // Create a mixed game with 1 female, 1 male, and 1 unknown gender player
    const gameResult = await helpers.createGame({
      created_by_user_id: session.user.id,
      game_type: GameType.Mixed,
      players: [
        { status: PlayerStatus.Waitlisted, gender: Gender.Female },
        { status: PlayerStatus.Waitlisted, gender: Gender.Male },
        { status: PlayerStatus.Waitlisted }, // No gender = unknown
      ],
    });

    const game = gameResult.game;

    // Navigate to the players page
    await apiHelpers.loadUrl(page, `/games/${game.id}/players`);

    // Wait for the unknown gender section to appear
    await helpers.waitForCondition(
      async () => {
        const unknownSection = page.locator(
          "text=/Players with Unknown Gender/",
        );
        return (await unknownSection.count()) > 0;
      },
      {
        description: "Unknown gender section to appear",
        maxAttempts: 20,
      },
    );

    // Verify the unknown gender section exists
    const unknownSection = page.locator("text=/Players with Unknown Gender/");
    expect(await unknownSection.count()).toBe(1);

    // Verify there's 1 player in unknown section (the 3rd player without gender)
    const unknownPlayers = page
      .locator(".bg-yellow-50")
      .locator('[class*="bg-white"]');
    expect(await unknownPlayers.count()).toBe(1);

    // Verify female and male lists exist with correct counts
    const femalePlayers = page
      .locator("h3:has-text('Female Players')")
      .locator("..")
      .locator("..")
      .locator('[class*="cursor-move"]');
    const malePlayers = page
      .locator("h3:has-text('Male Players')")
      .locator("..")
      .locator("..")
      .locator('[class*="cursor-move"]');

    expect(await femalePlayers.count()).toBe(1);
    expect(await malePlayers.count()).toBe(1);

    await apiHelpers.takeScreenshot(page, "mixed-game-unknown-gender-section");
  });

  test("Setting gender moves player to appropriate list", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // TODO: This test requires:
    // 1. Backend support to create mixed games
    // 2. Backend support to create guest players with unknown gender
    // For now, we'll skip it and note that it needs backend API enhancement
    test.skip();
  });

  test("Drag and drop works within female list", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // TODO: This test requires backend support to create mixed games with female players
    // For now, we'll skip it and note that it needs backend API enhancement
    test.skip();
  });

  test("Drag and drop works within male list", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // TODO: This test requires backend support to create mixed games with male players
    // For now, we'll skip it and note that it needs backend API enhancement
    test.skip();
  });

  test("Form submission sends females first, then males", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // TODO: This test requires backend support to create mixed games
    // For now, we'll skip it and note that it needs backend API enhancement
    test.skip();
  });

  test("Gender badges are read-only in invited players summary", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // TODO: This test requires backend support to create mixed games with invited players
    // For now, we'll skip it and note that it needs backend API enhancement
    test.skip();
  });

  test("Gender badges are read-only in waitlist section", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // TODO: This test requires backend support to create mixed games with waitlisted players
    // For now, we'll skip it and note that it needs backend API enhancement
    test.skip();
  });

  test("Gender can only be edited in unknown gender section", async ({
    authenticatedContext: { page, session },
    apiHelpers,
  }) => {
    // TODO: This test requires backend support to create mixed games with unknown gender players
    // For now, we'll skip it and note that it needs backend API enhancement
    test.skip();
  });
});
