/**
 * Home Page Redirect Tests
 * Tests that verify proper redirect behavior based on authentication status
 * Covers: unauthenticated redirect to login, authenticated redirect to dashboard
 */

import { test, expect } from '../fixtures';
import * as helpers from '../utils/test-helpers';

test.describe('Home Page Redirect', () => {
  test('TEST 1: Logged out user visiting / sees marketing home page', async ({ page, context }) => {
    await context.clearCookies();

    await helpers.loadUrl(page, '/');

    // Marketing home page should stay at / (not redirect to /login)
    expect(page.url()).toMatch(/\/$/);

    // Should see marketing content (Hero CTA or key marketing elements)
    await expect(page.locator('text=Get Started Free').first()).toBeVisible();

    await helpers.takeScreenshot(page, 'home-marketing-page');
  });

  test('TEST 2: Logged in user visiting / redirects to /dashboard', async ({
    authenticatedPage: page,
  }) => {
    await helpers.loadUrl(page, '/');

    expect(page.url()).toContain('/dashboard');

    await helpers.takeScreenshot(page, 'home-redirect-to-dashboard');
  });
});
