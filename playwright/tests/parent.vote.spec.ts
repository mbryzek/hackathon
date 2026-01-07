/**
 * Parent Voting Tests
 * Tests for parent voting functionality including code verification and vote submission
 * Parents can vote for up to 3 projects (unlike students who can only vote for 1)
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Parent Voting", () => {
  test("should verify parent code and vote for Team 1, then change vote to Teams 1, 2, and 3", async ({
    parentFixture,
  }) => {
    const { page, event } = parentFixture;
    const parentCode = event.parent_codes[0];
    const eventKey = event.event.key;

    // Navigate to voting page with parent code
    await helpers.loadUrl(page, `/vote/${eventKey}?code=${parentCode}`);

    // Wait for code verification to complete and voting interface to appear
    await page.waitForSelector('text="Voting as:"', { timeout: 10000 });

    // Verify we're voting as a parent
    await expect(page.locator("text=Parent")).toBeVisible();

    // Verify instruction shows "Select up to 3 projects" (parents can vote for up to 3)
    await expect(page.locator("text=Select up to 3 projects")).toBeVisible();

    // Find and click on Team 1 project
    const team1Button = page.locator("button", { hasText: "Team 1" });
    await expect(team1Button).toBeVisible();
    await team1Button.click();

    // Verify Team 1 is selected (should show 1 of 3 selected)
    await expect(page.locator("text=1 of 3 selected")).toBeVisible();

    // Submit the vote
    await helpers.safeClick(page, "Submit Vote");

    // Should navigate to thanks page
    await page.waitForURL((url) => url.pathname.includes("/thanks"), {
      timeout: 10000,
    });

    // Verify we're on the thanks page
    await expect(page.locator("text=Thank")).toBeVisible();

    // Now change the vote - click "Change My Vote" button
    await helpers.safeClick(page, "Change My Vote");

    // Team 1 should be pre-selected since we voted for it
    // Verify Team 1 is still selected
    await expect(page.locator("text=1 of 3 selected")).toBeVisible();

    // Now also select Team 2 (parents can vote for multiple projects)
    const team2Button = page.locator("button", { hasText: "Team 2" });
    await expect(team2Button).toBeVisible();
    await team2Button.click();

    // Verify 2 projects are now selected
    await expect(page.locator("text=2 of 3 selected")).toBeVisible();

    // Now also select Team 3
    const team3Button = page.locator("button", { hasText: "Team 3" });
    await expect(team3Button).toBeVisible();
    await team3Button.click();

    // Verify all 3 projects are now selected
    await expect(page.locator("text=3 of 3 selected")).toBeVisible();

    // Submit the changed vote with all 3 teams selected
    await helpers.safeClick(page, "Submit Vote");

    // Should navigate to thanks page again
    await page.waitForURL((url) => url.pathname.includes("/thanks"), {
      timeout: 10000,
    });

    // Verify we're on the thanks page
    await expect(page.locator("text=Thank")).toBeVisible();
  });
});
