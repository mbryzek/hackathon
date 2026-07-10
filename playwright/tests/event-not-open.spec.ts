/**
 * Event Gating Tests
 * Verifies that /vote/[event_key] and /vote/[event_key]/thanks only render
 * the voting/thanks UI for events whose status is Open. Draft, Closed, and
 * missing events should display the "Voting Not Available" card instead.
 */

import { test, expect } from '../fixtures';
import * as helpers from '../utils/test-helpers';
import { EventStatus } from '../generated/com-bryzek-vote-api';
import type { TestEvent } from '../generated/com-bryzek-playwright-vote';

const NOT_AVAILABLE = '[data-testid="vote-not-available"]';
// Literal code used for gate-only tests — these navigations never reach code
// verification because the layout guard blocks first.
const UNVERIFIED_CODE = 'SU3999';

async function expectNotAvailable(page: import('@playwright/test').Page) {
  await expect(page.locator(NOT_AVAILABLE)).toBeVisible();
  // Voting UI markers should not appear.
  await expect(page.locator('text="Enter your code"')).toHaveCount(0);
  await expect(page.locator('text="Thank You!"')).toHaveCount(0);
}

function firstStudentCode(testEvent: TestEvent): string {
  const code = testEvent.student_codes[0];
  expect(code, 'fixture should produce a student code').toBeDefined();
  return code as string;
}

async function createEventWithStatus(apiHelpers: typeof helpers, status: EventStatus): Promise<TestEvent> {
  return apiHelpers.createTestEvent({
    project_names: ['Team 1', 'Team 2'],
    number_students: 1,
    status
  });
}

test.describe('Event Gating', () => {
  test('missing event shows not-available on voting page', async ({ page }) => {
    await helpers.loadUrl(page, `/vote/does-not-exist-event-key`);
    await expectNotAvailable(page);
  });

  test('missing event shows not-available on thanks page', async ({ page }) => {
    await helpers.loadUrl(page, `/vote/does-not-exist-event-key/thanks?code=${UNVERIFIED_CODE}`);
    await expectNotAvailable(page);
  });

  test('draft event shows not-available on voting page', async ({ apiHelpers, page }) => {
    const testEvent = await createEventWithStatus(apiHelpers, EventStatus.Draft);
    const code = firstStudentCode(testEvent);
    await helpers.loadUrl(page, `/vote/${testEvent.event.key}?code=${code}`);
    await expectNotAvailable(page);
  });

  test('draft event shows not-available on thanks page', async ({ apiHelpers, page }) => {
    const testEvent = await createEventWithStatus(apiHelpers, EventStatus.Draft);
    const code = firstStudentCode(testEvent);
    await helpers.loadUrl(page, `/vote/${testEvent.event.key}/thanks?code=${code}`);
    await expectNotAvailable(page);
  });

  test('closed event shows not-available on voting page', async ({ apiHelpers, page }) => {
    const testEvent = await createEventWithStatus(apiHelpers, EventStatus.Closed);
    const code = firstStudentCode(testEvent);
    await helpers.loadUrl(page, `/vote/${testEvent.event.key}?code=${code}`);
    await expectNotAvailable(page);
  });

  test('closed event shows not-available on thanks page', async ({ apiHelpers, page }) => {
    const testEvent = await createEventWithStatus(apiHelpers, EventStatus.Closed);
    const code = firstStudentCode(testEvent);
    await helpers.loadUrl(page, `/vote/${testEvent.event.key}/thanks?code=${code}`);
    await expectNotAvailable(page);
  });

  test('open event renders the voting UI (not the gate)', async ({ apiHelpers, page }) => {
    const testEvent = await createEventWithStatus(apiHelpers, EventStatus.Open);
    const code = firstStudentCode(testEvent);
    await helpers.loadUrl(page, `/vote/${testEvent.event.key}?code=${code}`);
    await page.waitForSelector('text="Voting as:"', { timeout: 10000 });
    await expect(page.locator(NOT_AVAILABLE)).toHaveCount(0);
  });

  test('open event renders the thanks UI (not the gate)', async ({ apiHelpers, page }) => {
    const testEvent = await createEventWithStatus(apiHelpers, EventStatus.Open);
    const code = firstStudentCode(testEvent);
    await helpers.loadUrl(page, `/vote/${testEvent.event.key}/thanks?code=${code}`);
    await expect(page.locator('text="Thank You!"')).toBeVisible();
    await expect(page.locator(NOT_AVAILABLE)).toHaveCount(0);
  });
});
