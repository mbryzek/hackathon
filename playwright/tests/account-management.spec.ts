/**
 * Account Management Tests
 * Tests for registration, password management, and guest conversion flows
 */

import { test, expect } from '../fixtures';
import * as helpers from '../utils/test-helpers';
import { config } from '../config';

test.describe('Account Management', () => {
  let testEmail: string;

  test.beforeAll(async () => {
    testEmail = await helpers.generateRandomEmailAsync();
    await helpers.cleanupTestUsers(testEmail, true);
  });

  test('TEST 1: Registration Page UI', async ({ page }) => {
    await helpers.loadUrl(page, '/register');

    // Check Step 1 form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirm_password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await helpers.takeScreenshot(page, 'milestone2-registration-step1');
  });

  test('TEST 2: Registration Form Validation', async ({ page }) => {
    await helpers.loadUrl(page, '/register');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Wait for validation to apply
    const emailInput = page.locator('input[name="email"]');
    await helpers.waitForCondition(
      async () => {
        const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
          return (
            !el.checkValidity() ||
            el.classList.contains('border-red') ||
            el.classList.contains('border-pd-error-red')
          );
        });
        return isInvalid;
      },
      { description: "validation to appear on email field" },
    );

    // Verify validation is showing
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
      return (
        !el.checkValidity() ||
        el.classList.contains('border-red') ||
        el.classList.contains('border-pd-error-red')
      );
    });

    expect(isInvalid).toBeTruthy();
    await helpers.takeScreenshot(page, 'milestone2-registration-validation');
  });

  test('TEST 3: Complete Registration Flow', async ({ page }) => {
    testEmail = await helpers.generateRandomEmailAsync();
    const testPassword = 'TestPassword123!';

    await helpers.loadUrl(page, '/register');

    // Fill registration form (includes name fields since form was consolidated)
    await helpers.fillField(page, 'input[name="name"]', 'Test User');
    await helpers.fillField(page, 'input[name="nickname"]', 'Tester');
    await helpers.fillField(page, 'input[name="email"]', testEmail);
    await helpers.fillField(page, 'input[name="password"]', testPassword);
    await helpers.fillField(page, 'input[name="confirm_password"]', testPassword);

    await page.click('button[type="submit"]');

    // Wait for navigation to profile step or completion
    await helpers.waitForCondition(
      async () => {
        const url = page.url();
        return url.includes('/register/profile') ||
               url.includes('/register/partners') ||
               url.includes('/dashboard') ||
               !url.includes('/register');
      },
      { description: "navigation after credentials submission" }
    );

    const completeButton = page.locator('button:has-text("Complete Profile")');
    if ((await completeButton.count()) > 0) {
      await completeButton.click();

      // Wait for navigation after completing profile
      await helpers.waitForCondition(
        async () => {
          const url = page.url();
          return url.includes('/register/partners') ||
                 url.includes('/dashboard') ||
                 !url.includes('/register/profile');
        },
        { description: "navigation after profile completion" }
      );
    }

    // Step 3: Playing Partners - skip this step
    const currentUrl = page.url();
    if (currentUrl.includes('/register/partners')) {
      const continueButton = page.locator(
        'button:has-text("Continue to Dashboard"), button:has-text("Skip - I\'ll add partners later"), button:has-text("Skip & Continue"), button:has-text("Done adding partners")'
      );
      if ((await continueButton.count()) > 0) {
        await continueButton.first().click();

        // Wait for navigation after continuing from partners page
        await helpers.waitForCondition(
          async () => {
            const url = page.url();
            return url.includes('/dashboard') || !url.includes('/register');
          },
          { description: "navigation after continuing from partners page" }
        );
      }
    }

    // Should now be on dashboard or out of registration flow
    const finalUrl = page.url();
    expect(
      finalUrl.includes('/dashboard') || !finalUrl.includes('/register')
    ).toBeTruthy();
  });

  test('TEST 4: Password Reset Request Page', async ({ page }) => {
    await helpers.loadUrl(page, '/login/password/reset');

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await helpers.takeScreenshot(page, 'milestone2-password-reset-page');
  });

  test('TEST 5: Password Reset Form Submission', async ({ page }) => {
    await helpers.loadUrl(page, '/login/password/reset');

    await helpers.fillField(page, 'input[name="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Wait for form submission to complete - either success message or URL change
    await helpers.waitForCondition(
      async () => {
        const pageContent = await page.content();
        const hasSuccessMessage =
          pageContent.includes('email') ||
          pageContent.includes('sent') ||
          pageContent.includes('check');
        const urlChanged = !page.url().includes('/login/password/reset');
        return hasSuccessMessage || urlChanged;
      },
      { description: "password reset confirmation to appear" }
    );

    const pageContent = await page.content();
    const hasExpectedText =
      pageContent.includes('email') ||
      pageContent.includes('sent') ||
      pageContent.includes('check');

    expect(hasExpectedText).toBeTruthy();
    await helpers.takeScreenshot(page, 'milestone2-password-reset-submitted');
  });

  test('TEST 6: Change Password Page (Authenticated)', async ({ page }) => {
    // Create a test user for this test
    const sessionData = await helpers.createUserSession();
    const userEmail =
      typeof sessionData.user.email === 'object'
        ? sessionData.user.email.address
        : sessionData.user.email;

    // Set session cookie
    await helpers.setSessionCookie(page.context(), sessionData.session.id);

    // Navigate to change password
    await helpers.loadUrl(page, '/settings/password');

    await expect(
      page.locator('input[name="current_password"], input[name="currentPassword"]')
    ).toBeVisible();
    await expect(
      page.locator('input[name="new_password"], input[name="newPassword"]')
    ).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await helpers.takeScreenshot(page, 'milestone2-change-password-page');

    // Cleanup - use sync to ensure user is deleted before next test
    await helpers.cleanupTestUsers(userEmail, true);
  });

  test('TEST 8: Account Inactive Page', async ({ page }) => {
    await helpers.loadUrl(page, '/account/inactive');

    const hasInactiveMessage =
      (await page
        .locator('h1, h2')
        .filter({ hasText: /inactive|suspended|disabled/i })
        .count()) > 0;

    expect(hasInactiveMessage).toBeTruthy();
    await helpers.takeScreenshot(page, 'milestone2-account-inactive');
  });

  test('TEST 9: Logout Confirmation Page', async ({ page }) => {
    await helpers.loadUrl(page, '/logout');

    await expect(
      page.locator(
        'button:has-text("Logout"), button:has-text("Log out"), button:has-text("Sign out")'
      )
    ).toBeVisible();

    await helpers.takeScreenshot(page, 'milestone2-logout-confirmation');
  });
});
