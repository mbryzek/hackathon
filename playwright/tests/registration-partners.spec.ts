/**
 * Registration Step 3: Add Playing Partners Tests
 * Tests for the partner addition step in the registration flow
 * Covers: partners page UI, navigating to add partners, continuing to dashboard
 */

import { test, expect } from '../fixtures';
import * as helpers from '../utils/test-helpers';
import { config } from '../config';

test.describe('Registration Step 3: Playing Partners', () => {
  test('TEST 1: Partners page shows correct UI', async ({
    authenticatedPage: page,
    apiHelpers,
  }) => {
    await apiHelpers.loadUrl(page, '/register/partners');

    await expect(page.locator('h2:has-text("Add Playing Partners")').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Find Partners to Add' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue to Dashboard' }).first()).toBeVisible();

    await apiHelpers.takeScreenshot(page, 'reg-step3-partners-ui');
  });

  test('TEST 2: Navigate to Add Partner Page', async ({
    authenticatedPage: page,
    apiHelpers,
  }) => {
    await apiHelpers.loadUrl(page, '/register/partners');

    const findPartnersLink = page.getByRole('link', { name: 'Find Partners to Add' });
    await expect(findPartnersLink).toBeVisible();

    await findPartnersLink.click();

    // Wait for navigation to /partners/add
    await helpers.waitForCondition(
      () => {
        const currentUrl = page.url();
        return currentUrl.includes('/partners/add');
      },
      { description: 'navigation to partners/add page', maxAttempts: 15 }
    );

    const finalUrl = page.url();
    expect(finalUrl).toContain('/partners/add');

    await apiHelpers.takeScreenshot(page, 'reg-step3-navigate-to-add-partner');
  });

  test('TEST 3: Continue to Dashboard', async ({
    authenticatedPage: page,
    apiHelpers,
  }) => {
    await apiHelpers.loadUrl(page, '/register/partners');

    const continueButton = page.getByRole('button', { name: 'Continue to Dashboard' });
    await expect(continueButton).toBeVisible();

    // Use Playwright's waitForURL to handle navigation
    await Promise.all([
      page.waitForURL(url => !url.pathname.includes('/register/partners'), { timeout: 10000 }),
      continueButton.click()
    ]);

    const finalUrl = page.url();
    // Verify we're no longer on the registration partners page
    expect(finalUrl).not.toContain('/register/partners');

    await apiHelpers.takeScreenshot(page, 'reg-step3-completed');
  });

  test('TEST 4: Navigate to Partners Page After Registration', async ({
    authenticatedPage: page,
    apiHelpers,
  }) => {
    await apiHelpers.loadUrl(page, '/partners');

    const partnersUrl = page.url();
    expect(partnersUrl).toContain('/partners');

    const partnersList = await page.locator('[data-testid*="partner"], .partner-item').count();

    if (partnersList > 0) {
      await expect(page.locator('[data-testid*="partner"], .partner-item').first()).toBeVisible();
    }

    await apiHelpers.takeScreenshot(page, 'reg-step3-partners-list');
  });
});
