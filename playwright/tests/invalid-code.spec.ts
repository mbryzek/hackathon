/**
 * Invalid Code Tests
 * Tests that invalid voting codes are properly rejected
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Invalid Code Handling", () => {
  test("should reject an invalid voting code", async ({ studentFixture }) => {
    const { page, event } = studentFixture;
    const eventKey = event.event.key;
    const invalidCode = "INVALID123";

    // Navigate to voting page with invalid code
    await helpers.loadUrl(page, `/vote/${eventKey}?code=${invalidCode}`);

    // Should show an error message about invalid code
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 10000 });

    // Should NOT show the voting interface
    await expect(page.locator('text="Voting as:"')).not.toBeVisible();
  });
});
