/**
 * Authentication & Foundation Tests
 * Tests for login functionality, basic layout, and authentication infrastructure
 * Covers: login UI, form validation, authentication flow, responsive design
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";
import { config } from "../config";

test.describe("Authentication & Foundation", () => {
  test("Form elements are visible", async ({ page }) => {
    await helpers.loadUrl(page, "/login");

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Welcome")')).toBeVisible();
    await expect(page.locator('a:has-text("Forgot your password?")')).toBeVisible();

    await helpers.takeScreenshot(page, "milestone1-login-page");
  });

  test("Login Form Validation", async ({ page }) => {
    await helpers.loadUrl(page, "/login");

    await page.click('button[type="submit"]');

    await helpers.waitForCondition(
      async () => {
        const emailInput = page.locator('input[name="email"]');
        const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
          return (
            !el.checkValidity() ||
            el.classList.contains("border-red-500") ||
            el.classList.contains("border-pd-error-red")
          );
        });
        return isInvalid;
      },
      { description: "validation to appear on email field" },
    );

    await helpers.takeScreenshot(page, "milestone1-login-validation");
  });

  test("Validated email and password", async ({ page }) => {
    const randomEmail = await helpers.generateRandomEmailAsync();
    await helpers.loadUrl(page, "/login");

    await helpers.fillField(page, 'input[name="email"]', randomEmail);
    await helpers.fillField(page, 'input[name="password"]', randomEmail);
    await page.click('button[type="submit"]');

    await helpers.waitForCondition(
      async () => (await helpers.checkForErrors(page)).length > 0,
      { description: "error message to appear" },
    );

    const errors = await helpers.checkForErrors(page);
    expect(errors.length).toBeGreaterThan(0);

    await helpers.takeScreenshot(page, "milestone1-login-invalid");
  });

  test("Responsive Design - Mobile View", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.loadUrl(page, "/login");

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Welcome")')).toBeVisible();
    await expect(page.locator('a:has-text("Forgot your password?")')).toBeVisible();

    await helpers.takeScreenshot(page, "milestone1-mobile-view");

    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("Navigation Links from Login Page", async ({ page }) => {
    await helpers.loadUrl(page, "/login");

    // Sign Up link - use the one in the header (btn-primary class)
    const signUpLink = page.locator('a.btn-primary:has-text("Sign Up")');
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();
    await page.waitForURL((url) => url.pathname.includes("/register"));

    await helpers.loadUrl(page, "/login");

    // Forgot password is a link
    const forgotPasswordLink = page.locator('a:has-text("Forgot your password?")');
    await expect(forgotPasswordLink).toBeVisible();
    await forgotPasswordLink.click();
    await page.waitForURL((url) => url.pathname.includes("/password/reset"));
  });
});
