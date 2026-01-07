/**
 * Player Invitation Decline Tests
 * Tests the /players/:id/decline URL which declines an invitation and redirects
 * Verifies: redirect behavior
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Player Invitation Decline", () => {
  test("TEST 1: Decline invitation via /decline URL", async ({
    page,
    apiHelpers,
  }) => {
    const playerData = await apiHelpers.createTestPlayer();
    const playerId = playerData.id;

    await helpers.loadUrl(page, `/players/${playerId}/decline`);
    await helpers.waitForCondition(
      () => page.url().endsWith(`/players/${playerId}`),
      {
        description: "redirect to /players/{id}",
      },
    );
  });
});
