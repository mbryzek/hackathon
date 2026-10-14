/* global process, console, fetch */
// Takes every screenshot in ./screenshots, against the SvelteKit dev server pointed at stub-api.mjs.
//
//   node docs/voting-app-inventory/stub-api.mjs 9417
//   VITE_API_BASE_URL=http://127.0.0.1:9417 npm run dev -- --port 5281
//   node docs/voting-app-inventory/capture.mjs http://localhost:5281 http://127.0.0.1:9417
//
// Drives the system Chrome (`channel: 'chrome'`), so no Playwright browser download is needed.

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = process.argv[2] ?? 'http://localhost:5281';
const api = process.argv[3] ?? 'http://127.0.0.1:9417';
const out = join(dirname(fileURLToPath(import.meta.url)), 'screenshots');
mkdirSync(out, { recursive: true });

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function scenario(name) {
  const response = await fetch(`${api}/_stub/scenario`, { method: 'POST', body: JSON.stringify({ name }) });
  if (response.status !== 204) throw new Error(`scenario ${name}: ${response.status}`);
}

async function context(viewport) {
  return browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
}

async function shot(page, name) {
  await page.waitForLoadState('networkidle');
  // The app fades every page in; wait it out so no shot is half-transparent.
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
  console.log(`${name}.png  ${page.url()}`);
}

async function signIn(page) {
  await page.goto(`${app}/vote/admin/login`);
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'password');
  await Promise.all([page.waitForURL(`${app}/vote/admin`), page.click('button[type=submit]')]);
}

// ---------------------------------------------------------------- voter screens (phone)

{
  const ctx = await context(PHONE);
  const page = await ctx.newPage();

  await scenario('two-open');
  await page.goto(`${app}/vote`);
  await page.getByText('Select an Event').waitFor();
  await shot(page, 'vote-01-select-event');

  await scenario('none-open');
  await page.goto(`${app}/vote`);
  await page.getByText('No Active Events').waitFor();
  await shot(page, 'vote-02-no-active-events');

  await page.goto(`${app}/vote/hackathon-2026`);
  await page.getByTestId('vote-not-available').waitFor();
  await shot(page, 'vote-03-voting-not-available');

  await scenario('default');
  await page.goto(`${app}/vote/hackathon-2026`);
  await page.getByText('Enter your code').waitFor();
  await shot(page, 'vote-04-enter-code');

  await page.fill('#code', 'ZZ9999');
  await page.click('button[type=submit]');
  await page.getByText('Invalid code').waitFor();
  await shot(page, 'vote-05-invalid-code');

  await page.goto(`${app}/vote/hackathon-2026?code=SJ4682`);
  await page.getByText('Voting as:').waitFor();
  await shot(page, 'vote-06-ballot-student');
  await page.getByText('Bus Tracker').click();
  await shot(page, 'vote-07-ballot-student-selected');
  await page.getByRole('button', { name: 'Submit Vote' }).click();
  await page.getByText('Thank You!').waitFor();
  await page.getByText('You voted for:').waitFor();
  await shot(page, 'vote-08-thanks-student');

  await page.goto(`${app}/vote/hackathon-2026?code=PA2345`);
  await page.getByText('Voting as:').waitFor();
  await shot(page, 'vote-09-ballot-parent-prior-votes');
  await page.goto(`${app}/vote/hackathon-2026?code=PC4567`);
  await page.getByText('Voting as:').waitFor();
  for (const name of ['Study Buddy', 'Club Finder', 'Quiet Spaces']) await page.getByText(name).click();
  await shot(page, 'vote-10-ballot-parent-three-selected');
  await page.getByRole('button', { name: 'Submit Vote' }).click();
  await page.getByTestId('organizer-cta').waitFor();
  await shot(page, 'vote-11-thanks-parent');

  await ctx.close();
}

// ---------------------------------------------------------------- sign-in and emailed links (desktop)

{
  await scenario('default');
  const ctx = await context(DESKTOP);
  const page = await ctx.newPage();

  await page.goto(`${app}/vote/admin/login`);
  await shot(page, 'auth-01-admin-login');
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'wrong');
  await page.click('button[type=submit]');
  await page.getByText('Invalid email or password').waitFor();
  await shot(page, 'auth-02-admin-login-error');

  await page.goto(`${app}/login/password/reset`);
  await shot(page, 'auth-03-forgot-password');
  await page.fill('#email', 'admin@example.com');
  await page.click('button[type=submit]');
  await page.getByText('a link to reset the password is on its way').waitFor();
  await shot(page, 'auth-04-forgot-password-sent');

  await page.goto(`${app}/login/password/reset/expired-token`);
  await shot(page, 'auth-05-reset-password');
  await page.fill('#password', 'a new password');
  await page.fill('#password_confirmation', 'a new password');
  await page.click('button[type=submit]');
  await page.getByText('Reset password link has expired').waitFor();
  await shot(page, 'auth-06-reset-password-expired');

  await page.goto(`${app}/welcome/welcome-token`);
  await shot(page, 'auth-07-welcome');
  await page.goto(`${app}/welcome/spent-token`);
  await page.getByTestId('welcome-expired').waitFor();
  await shot(page, 'auth-08-welcome-expired');

  await page.goto(`${app}/email/verifications/verify-token`);
  await page.getByTestId('email-verification-verified').waitFor();
  await shot(page, 'auth-09-email-verified');
  await page.goto(`${app}/email/verifications/old-token`);
  await page.getByTestId('email-verification-invalid').waitFor();
  await shot(page, 'auth-10-email-link-invalid');

  await ctx.close();
}

// ---------------------------------------------------------------- admin console (desktop)

{
  await scenario('default');
  const ctx = await context(DESKTOP);
  const page = await ctx.newPage();
  await signIn(page);
  await shot(page, 'admin-01-events');

  await page.getByRole('button', { name: 'Account menu' }).first().click();
  await shot(page, 'admin-02-account-menu');
  await page.goto(`${app}/vote/admin/profile`);
  await shot(page, 'admin-03-profile');

  await page.goto(`${app}/vote/admin/events/new`);
  await page.fill('#name', 'Spring Showcase 2027');
  await shot(page, 'admin-04-event-new');

  await page.goto(`${app}/vote/admin/events/evt-y26`);
  await shot(page, 'admin-05-event-detail');
  await page.getByRole('button', { name: 'Delete Event' }).click();
  await shot(page, 'admin-06-event-delete-confirm');

  await page.goto(`${app}/vote/admin/events/evt-y26/edit`);
  await shot(page, 'admin-07-event-edit');

  await page.goto(`${app}/vote/admin/events/evt-y26/projects`);
  await shot(page, 'admin-08-projects');
  await page.getByRole('button', { name: 'Add Project' }).click();
  await shot(page, 'admin-09-project-add');
  await page.goto(`${app}/vote/admin/events/evt-y26/projects`);
  await page.getByRole('button', { name: 'Edit project Lunch Line' }).click();
  await shot(page, 'admin-10-project-edit');

  await page.goto(`${app}/vote/admin/events/evt-y26/projects/bulk`);
  await shot(page, 'admin-11-projects-bulk');

  await page.goto(`${app}/vote/admin/events/evt-y26/codes`);
  await shot(page, 'admin-12-codes');
  await page.getByRole('button', { name: 'Generate Codes' }).click();
  await shot(page, 'admin-13-codes-generate');
  await page.goto(`${app}/vote/admin/events/evt-y26/codes?has_voted=false&voter_type=student`);
  await shot(page, 'admin-14-codes-filtered');

  await page.goto(`${app}/vote/admin/events/evt-y26/results`);
  await shot(page, 'admin-15-results');
  await page.getByRole('button', { name: 'Present' }).click();
  await shot(page, 'admin-16-results-presentation');

  await ctx.close();
}

{
  await scenario('default');
  const ctx = await context(PHONE);
  const page = await ctx.newPage();
  await signIn(page);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await shot(page, 'admin-17-mobile-menu');
  await ctx.close();
}

await browser.close();
