/**
 * Registration and Login Flow Tests
 * Comprehensive test that covers: Registration → Logout → Login → Dashboard
 * Tests the complete user onboarding and authentication cycle
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";
import { config } from "../config";

test.describe("Registration and Login Flow", () => {
  let testUser: {
    email: string;
    password: string;
  };

  test.beforeAll(async () => {
    testUser = {
      email: await helpers.generateRandomEmailAsync(),
      password: "TestPassword123!",
    };

    await helpers.cleanupTestUsers(testUser.email, true);
  });

  test("Complete Flow: Registration → Logout → Login → Dashboard", async ({
    page,
  }) => {
    // TEST 1: Navigate to Registration Page
    await helpers.loadUrl(page, "/register");

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // TEST 2: Fill Registration Form - Step 1 (Credentials)
    await helpers.fillField(page, 'input[name="email"]', testUser.email);
    await helpers.fillField(page, 'input[name="password"]', testUser.password);
    await helpers.fillField(
      page,
      'input[name="confirm_password"]',
      testUser.password,
    );

    await helpers.takeScreenshot(page, "flow-02-credentials-filled");

    // TEST 3: Submit Step 1 and Check for Step 2
    await page.click('button[type="submit"]');

    await helpers.waitForCondition(
      async () => {
        const url = page.url();
        return url.includes("/register/profile");
      },
      { description: "navigation to /register/profile" },
    );

    await helpers.takeScreenshot(page, "flow-03-profile-step");

    // TEST 4: Fill Registration Form - Step 2 (Profile)
    await helpers.clickAndWaitForUrl(page, "Complete Profile", "/register/partners");

    await helpers.takeScreenshot(page, "flow-04-profile-submitted");

    await helpers.clickAndWaitForUrl(page, "Continue to Dashboard", "/");

    await helpers.takeScreenshot(page, "flow-05-partners-step");

    await helpers.clickAndWaitForUrl(page, "Logout", "/logout");

    await helpers.takeScreenshot(page, "flow-07-logout-confirmation");

    await helpers.clickAndWaitForUrl(page, "Yes, Sign Out", "/login");

    // TEST 8: Verify Cannot Access Dashboard When Logged Out
    await helpers.loadUrl(page, "/dashboard");

    await helpers.waitForCondition(async () => page.url().includes("login"), {
      description: "redirect to login page",
    });

    await helpers.takeScreenshot(page, "flow-09-dashboard-protected");

    // TEST 9: Login with Registered User
    await helpers.loadUrl(page, "/login");

    await helpers.fillField(page, 'input[name="email"]', testUser.email);
    await helpers.fillField(page, 'input[name="password"]', testUser.password);

    await helpers.takeScreenshot(page, "flow-10-login-form-filled");

    await helpers.clickAndWaitForUrl(page, "Welcome", "/dashboard");

    await helpers.takeScreenshot(page, "flow-11-login-success");

    // TEST 10: Verify Dashboard Access After Login
    await helpers.loadUrl(page, "/dashboard");
    await helpers.assertVisibleText(page, "h1", "Welcome back");
    await helpers.takeScreenshot(page, "flow-12-dashboard-accessible");
  });
});
