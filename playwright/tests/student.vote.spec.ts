/**
 * Student Voting Tests
 * Tests for student voting functionality including code verification and vote submission
 */

import { test, expect } from '../fixtures';
import * as helpers from '../utils/test-helpers';

test.describe('Student Voting', () => {
  test('should verify student code and vote for Team 1, then change vote to Team 2', async ({ studentFixture }) => {
    const { page, event } = studentFixture;
    const studentCode = event.student_codes[0];
    const eventKey = event.event.key;

    // Navigate to voting page with student code
    await helpers.loadUrl(page, `/vote/${eventKey}?code=${studentCode}`);

    // Wait for code verification to complete and voting interface to appear
    await page.waitForSelector('text="Voting as:"', { timeout: 10000 });

    // Verify we're voting as a student
    await expect(page.locator('text=Student')).toBeVisible();

    // Verify instruction shows "Select 1 project" (students can only vote for 1)
    await expect(page.getByTestId('vote-instructions')).toHaveText('Select 1 project');

    // A student gets one vote, so the ballot must be a real radio group: a <fieldset> named by its
    // <legend>, holding radios rather than checkboxes. Asserting the roles is asserting that a
    // screen-reader voter is told the options are mutually exclusive and how many they get — none
    // of which the <button aria-pressed> cards this replaced ever conveyed.
    await expect(page.getByRole('group', { name: 'Select 1 project' })).toBeVisible();

    // Find and click on Team 1 project
    const team1 = helpers.projectOption(page, 'Team 1', 'radio');
    await expect(team1).toBeVisible();
    await helpers.selectProject(page, 'Team 1', 'radio');
    await expect(team1).toBeChecked();

    // Verify Team 1 is selected (should show 1 of 1 selected)
    await expect(page.locator('text=1 of 1 selected')).toBeVisible();

    // Submit the vote
    await helpers.safeClick(page, 'Submit Vote');

    // Should navigate to thanks page
    await page.waitForURL((url) => url.pathname.includes('/thanks'), {
      timeout: 10000
    });

    // Verify we're on the thanks page
    await expect(page.locator('text=Thank')).toBeVisible();

    // Wait for verifyCode to finish populating state (so absence assertions are meaningful)
    await expect(page.locator('text=You voted for:')).toBeVisible();

    // Parent-only CTAs must NOT appear for students
    await expect(page.locator('[data-testid="organizer-cta"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="donate-cta"]')).toHaveCount(0);

    // Now change the vote - click "Change Vote" button
    await helpers.safeClick(page, 'Change My Vote');

    // Team 1 should be pre-selected since we voted for it
    const team1Again = helpers.projectOption(page, 'Team 1', 'radio');
    await expect(team1Again).toBeChecked();

    // Now select Team 2 instead (this should deselect Team 1 since students can only vote for 1).
    // Team 1 going unchecked without being clicked is the exclusivity the radio group promises,
    // and it is now the browser enforcing it rather than handleProjectSelect alone.
    const team2 = helpers.projectOption(page, 'Team 2', 'radio');
    await expect(team2).toBeVisible();
    await helpers.selectProject(page, 'Team 2', 'radio');
    await expect(team2).toBeChecked();
    await expect(team1Again).not.toBeChecked();
    await expect(page.locator('text=1 of 1 selected')).toBeVisible();

    // Submit the changed vote
    await helpers.safeClick(page, 'Submit Vote');

    // Should navigate to thanks page again
    await page.waitForURL((url) => url.pathname.includes('/thanks'), {
      timeout: 10000
    });

    // Verify we're on the thanks page
    await expect(page.locator('text=Thank')).toBeVisible();
  });
});
