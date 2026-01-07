/**
 * Mobile Phone Registration Consent
 * Tests for mobile phone field and SMS opt-in validation during registration
 * Uses API session creation for better performance
 *
 * Each test creates its own unique user to ensure complete test isolation
 * and prevent race conditions during parallel execution.
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";
import { config } from "../config";

test.describe("Mobile Phone Registration Consent", () => {
  test("Can register with only email and password", async ({ page }) => {
    await helpers.loadUrl(page, "/register");

    // Create unique email for this test to ensure isolation
    const uniqueEmail = await helpers.generateRandomEmailAsync();
    const testPassword = "TestPassword123!";

    // Fill required registration fields (including name fields)
    await helpers.fillField(page, 'input[name="name"]', "Test User");
    await helpers.fillField(page, 'input[name="nickname"]', "Tester");
    await helpers.fillField(page, 'input[name="email"]', uniqueEmail);
    await helpers.fillField(page, 'input[name="password"]', testPassword);
    await helpers.fillField(
      page,
      'input[name="confirm_password"]',
      testPassword,
    );

    // Click submit and wait for navigation
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for URL to change from /register (with longer timeout for full suite runs)
    await page.waitForURL((url) => url.pathname.includes("/register/profile"), {
      timeout: 3000,
    });

    // Check for errors on current page
    const errors = await helpers.checkForErrors(page);
    expect(errors.length).toBe(0);
  });

  test("If mobile phone is specified, optin is required", async ({
    context,
    page,
  }) => {
    // Clear cookies first
    await context.clearCookies();

    await helpers.loadUrl(page, "/register");

    // Create unique email for this test to ensure isolation
    const testEmail = await helpers.generateRandomEmailAsync();
    const testPassword = "TestPassword123!";

    // Fill required registration fields (including name fields)
    await helpers.fillField(page, 'input[name="name"]', "Test User");
    await helpers.fillField(page, 'input[name="nickname"]', "Tester");
    await helpers.fillField(page, 'input[name="email"]', testEmail);
    await helpers.fillField(page, 'input[name="password"]', testPassword);
    await helpers.fillField(
      page,
      'input[name="confirm_password"]',
      testPassword,
    );
    await helpers.fillField(
      page,
      'input[name="mobile_phone"]',
      "+1 555-111-2222",
    );

    // Don't check SMS consent
    const smsCheckbox = page.locator('input[name="sms_consent"]');
    if ((await smsCheckbox.count()) > 0) {
      const isChecked = await smsCheckbox.isChecked();
      expect(isChecked).toBeFalsy();
    }

    // Click submit and wait for navigation
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for form submission to complete (errors should appear)
    await helpers.waitForCondition(
      async () => (await helpers.checkForErrors(page)).length > 0,
      { description: "validation errors to appear" },
    );

    // 1. Verify that the page shows an error: You must provide consent for this phone number
    const errors = await helpers.checkForErrors(page);
    expect(errors.length).toBeGreaterThan(0);
    const hasConsentError = errors.some(
      (error) =>
        error.includes("consent") ||
        error.includes("SMS") ||
        error.includes("phone number"),
    );
    expect(hasConsentError).toBeTruthy();

    // 2. Check SMS consent checkbox
    await smsCheckbox.check();
    const isNowChecked = await smsCheckbox.isChecked();
    expect(isNowChecked).toBeTruthy();

    // 3. Submit form again
    await submitButton.click();

    // 4. Verify navigation to profile page
    await page.waitForURL((url) => url.pathname.includes("/register/profile"), {
      timeout: 3000,
    });

    // 5. Verify that mobile number is shown on profile page
    const pageContent = await page.content();
    const hasMobileNumber =
      pageContent.includes("555-111-2222") ||
      pageContent.includes("555") ||
      pageContent.includes("mobile") ||
      pageContent.includes("phone");
    expect(hasMobileNumber).toBeTruthy();
  });
});
