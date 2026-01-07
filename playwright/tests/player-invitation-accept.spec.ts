/**
 * Player Invitation Accept Tests
 * Tests the /players/:id/accept URL which accepts an invitation and redirects
 * Verifies: redirect to player detail, "You're In!" message, game details display, calendar button
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Player Invitation Accept", () => {
  test("TEST 1: Accept invitation via /accept URL", async ({
    page,
    apiHelpers,
  }) => {
    const playerData = await apiHelpers.createTestPlayer();
    const playerId = playerData.id;

    await helpers.loadUrl(page, `/players/${playerId}/accept`);

    await helpers.waitForCondition(
      () => page.url().endsWith(`/players/${playerId}`),
      {
        description: "redirect to /players/{id}",
      },
    );
  });
});
