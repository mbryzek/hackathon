/**
 * The vote admin's account menu (claude rules/frontend.account.menu.mdc): profile and log out
 * live in it and nowhere else in the header or the slide-out menu.
 */

import { test, expect } from '../fixtures';
import type { Page } from '../fixtures';
import * as helpers from '../utils/test-helpers';

async function openAdmin(page: Page): Promise<{ name: string; email: string }> {
  const admin = await helpers.signInAsAdmin(page);
  await helpers.loadUrl(page, '/vote/admin');
  return { name: admin.user.person.name ?? '', email: admin.user.person.email?.address ?? '' };
}

test.describe('Vote admin account menu', () => {
  test('opens on Your Profile and Log out, and Escape closes it', async ({ page }) => {
    const { name, email } = await openAdmin(page);

    // No sign-out in the header itself.
    const header = page.getByRole('navigation');
    await expect(header.getByRole('button', { name: /log ?out/i })).toHaveCount(0);
    await expect(header.getByRole('link', { name: /log ?out/i })).toHaveCount(0);

    const chip = page.getByRole('button', { name: 'Account menu' });
    await expect(chip).toContainText(name || email);
    await chip.click();

    const menu = page.getByRole('menu', { name: 'Account' });
    await expect(menu.getByRole('menuitem')).toHaveText(['Your Profile', 'Log out']);
    await expect(chip).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(chip).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes on a click outside it', async ({ page }) => {
    await openAdmin(page);

    await page.getByRole('button', { name: 'Account menu' }).click();
    await expect(page.getByRole('menu', { name: 'Account' })).toBeVisible();

    await page.getByRole('heading', { name: 'Events' }).click();
    await expect(page.getByRole('menu', { name: 'Account' })).toHaveCount(0);
  });

  test('Your Profile shows the signed-in admin', async ({ page }) => {
    const { name, email } = await openAdmin(page);

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Your Profile' }).click();

    await expect(page).toHaveURL(/\/vote\/admin\/profile$/);
    await expect(page.getByRole('menu', { name: 'Account' })).toHaveCount(0);
    await expect(page.getByTestId('profile-name')).toHaveText(name);
    await expect(page.getByTestId('profile-email')).toHaveText(email);
  });

  test('Log out signs the admin out', async ({ page }) => {
    await openAdmin(page);

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    await expect(page).toHaveURL(/\/vote\/admin\/login$/);
    await helpers.loadUrl(page, '/vote/admin');
    await expect(page).toHaveURL(/\/vote\/admin\/login$/);
  });

  test('on a phone the account menu sits at the bottom of the slide-out menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openAdmin(page);

    await expect(page.getByRole('button', { name: 'Account menu' })).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();

    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer.getByRole('link', { name: 'Events' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: /log ?out/i })).toHaveCount(0);

    await drawer.getByRole('button', { name: 'Account menu' }).click();
    await expect(drawer.getByRole('menu', { name: 'Account' }).getByRole('menuitem')).toHaveText(['Your Profile', 'Log out']);

    await page.keyboard.press('Escape');
    await expect(drawer.getByRole('menu', { name: 'Account' })).toHaveCount(0);
    await expect(drawer).toBeVisible();
  });
});
