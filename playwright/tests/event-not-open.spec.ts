/**
 * Event Not Open Tests
 * Verifies that voting pages show "not available" for events that are not open,
 * on both the main voting page and the thanks page.
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Event Not Open", () => {
  const missingEventKey = "does-not-exist-event-key";

  test("voting page shows not-available for missing event", async ({
    studentFixture,
  }) => {
    const { page } = studentFixture;

    await helpers.loadUrl(page, `/vote/${missingEventKey}`);

    await expect(
      page.locator('[data-testid="vote-not-available"]'),
    ).toBeVisible();
    await expect(page.locator('input#code')).toHaveCount(0);
  });

  test("thanks page shows not-available for missing event", async ({
    studentFixture,
  }) => {
    const { page } = studentFixture;

    await helpers.loadUrl(
      page,
      `/vote/${missingEventKey}/thanks?code=SU3999`,
    );

    await expect(
      page.locator('[data-testid="vote-not-available"]'),
    ).toBeVisible();
    await expect(page.locator('text="Thank You!"')).toHaveCount(0);
  });
});
