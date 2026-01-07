/**
 * Password Reset Flow Tests
 * Comprehensive test that covers:
 * 1. Click on forgot password
 * 2. Enter email address
 * 3. Go to URL for password reset by token
 * 4. Set new password
 * 5. Logout
 * 6. Verify login works with new password
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";
import { config } from "../config";

test.describe("Password Reset Flow", () => {
  const newPassword: string = "NewTestPassword123!";

  test("complete password reset flow", async ({ page, testSession: session }) => {
    await helpers.loadUrl(page, "/login");

    await helpers.takeScreenshot(page, "password-reset-01-login-page");

    // Click forgot password button and wait for navigation
    await helpers.clickAndWaitForUrl(page, "Forgot your password?", "/password/reset");
    await helpers.takeScreenshot(page, "password-reset-01-reset-page");

    // Fill in email
    await helpers.fillField(
      page,
      'input[name="email"], input[type="email"]',
      session.user.email.address,
    );

    // Submit form
    await helpers.safeClick(page, "Send Reset Instructions");

    // Wait for success heading to appear (indicating form was processed)
    await page.waitForSelector('h2:has-text("Check your email")', {
      state: "visible",
      timeout: 5000,
    });

    // Verify success message is displayed (partial match since email is included in text)
    await expect(
      page.locator('text=/password reset instructions shortly/i'),
    ).toBeVisible();

    await helpers.takeScreenshot(page, "password-reset-02-success");

    // TEST 3: Get Reset Token and Navigate to Reset URL
    const userEmail = session.user.email.address;
    const resetToken = await helpers.getPasswordResetToken(userEmail);
    const resetUrl = `${config.FRONTEND_BASE_URL}/login/password/reset/${resetToken}`;

    await page.goto(resetUrl);
    await page.waitForLoadState("load");

    // Verify we're on the reset password page with token
    await expect(page.locator('input[name="password"]').first()).toBeVisible();

    await helpers.takeScreenshot(page, "password-reset-03-token-page");

    // TEST 4: Set New Password
    const newPasswordInput = page.locator('input[name="password"]').first();
    const confirmPasswordInput = page
      .locator(
        'input[name="confirm_password"], input[name="password_confirmation"]',
      )
      .first();

    await newPasswordInput.fill(newPassword);
    await confirmPasswordInput.fill(newPassword);

    await helpers.takeScreenshot(page, "password-reset-04-new-password");

    // Submit form - should redirect after password reset
    const resetPageUrl = page.url();
    await helpers.safeClick(page, "Reset Password");

    // Wait for URL to change or form to process
    await helpers.waitForCondition(
      async () => {
        const currentUrl = page.url();
        // URL changed, or errors appeared on page
        return (
          currentUrl !== resetPageUrl ||
          (await helpers.checkForErrors(page)).length > 0
        );
      },
      { description: "password reset form submission to complete" },
    );

    // Check for any errors after password reset
    const resetErrors = await helpers.checkForErrors(page);
    if (resetErrors.length > 0) {
      console.log("❌ Password reset errors:", resetErrors);
      await helpers.takeScreenshot(page, "password-reset-04-errors");
    }

    // Check page content for any messages
    const pageText = await page.textContent("body");
    await helpers.takeScreenshot(page, "password-reset-04-after-submit");

    // TEST 5: Logout (if logged in on dashboard)
    const afterResetUrl = page.url();
    if (afterResetUrl.includes("/dashboard")) {
      // Navigate to logout confirmation
      await helpers.loadUrl(page, "/logout");

      // Click logout button
      await helpers.clickAndWaitForUrl(page, "Yes, Sign Out", "/login");

      await helpers.takeScreenshot(page, "password-reset-05-after-logout");
    }

    // TEST 6: Login with new password
    await helpers.loadUrl(page, "/login");

    // Fill in email and new password
    await helpers.fillField(
      page,
      'input[name="email"]',
      session.user.email.address,
    );
    await helpers.fillField(page, 'input[name="password"]', newPassword);

    await helpers.takeScreenshot(page, "password-reset-06-login-form");

    // Submit form
    await helpers.safeClick(page, "Welcome");

    // Wait for login to complete (URL changes or errors appear)
    await helpers.waitForCondition(
      async () => {
        const currentUrl = page.url();
        // Login succeeded (not on /login anymore), or errors appeared
        return (
          !currentUrl.includes("/login") ||
          (await helpers.checkForErrors(page)).length > 0
        );
      },
      { description: "login form submission to complete" },
    );

    // Check for login errors
    const loginErrors = await helpers.checkForErrors(page);
    if (loginErrors.length > 0) {
      await helpers.takeScreenshot(page, "password-reset-06-login-errors");
    }

    // Check login page content
    const loginPageText = await page.textContent("body");
    const loginUrl = page.url();

    const isLoggedIn =
      loginUrl.includes("/dashboard") || !loginUrl.includes("/login");

    expect(isLoggedIn).toBeTruthy();

    await helpers.takeScreenshot(page, "password-reset-06-logged-in");
  });
});
