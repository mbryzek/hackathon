/**
 * Student Voting Tests
 * Tests for student voting functionality including code verification and vote submission
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Student Voting", () => {
  test("should verify student code and vote for Team 1, then change vote to Team 2", async ({
    testEvent,
  }) => {
    const { page, event } = testEvent;
    const studentCode = event.student_codes[0];
    const eventKey = event.event.key;

    // Navigate to voting page with student code
    await helpers.loadUrl(page, `/vote/${eventKey}?code=${studentCode}`);

    // Wait for code verification to complete and voting interface to appear
    await page.waitForSelector('text="Voting as:"', { timeout: 10000 });

    // Verify we're voting as a student
    await expect(page.locator("text=Student")).toBeVisible();

    // Verify instruction shows "Select 1 project" (students can only vote for 1)
    await expect(page.locator("text=Select 1 project")).toBeVisible();

    // Find and click on Team 1 project
    const team1Button = page.locator("button", { hasText: "Team 1" });
    await expect(team1Button).toBeVisible();
    await team1Button.click();

    // Verify Team 1 is selected (should show 1 of 1 selected)
    await expect(page.locator("text=1 of 1 selected")).toBeVisible();

    // Submit the vote
    await helpers.safeClick(page, "Submit Vote");

    // Should navigate to thanks page
    await page.waitForURL((url) => url.pathname.includes("/thanks"), {
      timeout: 10000,
    });

    // Verify we're on the thanks page
    await expect(page.locator("text=Thank")).toBeVisible();

    // Now change the vote - click "Change Vote" button
    await helpers.safeClick(page, "Change Vote");

    // Should return to voting page
    await page.waitForSelector('text="Voting as:"', { timeout: 10000 });

    // Team 1 should be pre-selected since we voted for it
    // Now select Team 2 instead (this should deselect Team 1 since students can only vote for 1)
    const team2Button = page.locator("button", { hasText: "Team 2" });
    await expect(team2Button).toBeVisible();
    await team2Button.click();

    // Submit the changed vote
    await helpers.safeClick(page, "Submit Vote");

    // Should navigate to thanks page again
    await page.waitForURL((url) => url.pathname.includes("/thanks"), {
      timeout: 10000,
    });

    // Verify we're on the thanks page
    await expect(page.locator("text=Thank")).toBeVisible();
  });
});
