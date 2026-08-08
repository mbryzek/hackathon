/**
 * Parent Voting Tests
 * Tests for parent voting functionality including code verification and vote submission
 * Parents can vote for up to 3 projects (unlike students who can only vote for 1)
 */

import { test, expect } from '../fixtures';
import * as helpers from '../utils/test-helpers';

test.describe('Parent Voting', () => {
  test('should verify parent code and vote for Team 1, then change vote to Teams 1, 2, and 3', async ({ parentFixture }) => {
    const { page, event } = parentFixture;
    const parentCode = event.parent_codes[0];
    const eventKey = event.event.key;

    // Navigate to voting page with parent code
    await helpers.loadUrl(page, `/vote/${eventKey}?code=${parentCode}`);

    // Wait for code verification to complete and voting interface to appear
    await page.waitForSelector('text="Voting as:"', { timeout: 10000 });

    // Verify we're voting as a parent
    await expect(page.locator('text=Parent')).toBeVisible();

    // Verify instruction shows "Select up to 3 projects" (parents can vote for up to 3)
    await expect(page.getByTestId('vote-instructions')).toHaveText('Select up to 3 projects');

    // A parent gets several independent votes, so the same cards must be CHECKBOXES here, inside a
    // group named by the limit. The student ballot asserts radios for the identical markup; the two
    // together are what prove the page distinguishes the cases at all, which is the whole defect.
    await expect(page.getByRole('group', { name: 'Select up to 3 projects' })).toBeVisible();

    // Find and click on Team 1 project
    const team1 = helpers.projectOption(page, 'Team 1', 'checkbox');
    await expect(team1).toBeVisible();
    await helpers.selectProject(page, 'Team 1', 'checkbox');
    await expect(team1).toBeChecked();

    // Verify Team 1 is selected (should show 1 of 3 selected)
    await expect(page.locator('text=1 of 3 selected')).toBeVisible();

    // Submit the vote
    await helpers.safeClick(page, 'Submit Vote');

    // Should navigate to thanks page
    await page.waitForURL((url) => url.pathname.includes('/thanks'), {
      timeout: 10000
    });

    // Verify we're on the thanks page
    await expect(page.locator('text=Thank')).toBeVisible();

    // Wait for verifyCode to populate state (CTAs depend on voter_type from API)
    await expect(page.locator('text=You voted for:')).toBeVisible();

    // Verify parent-only "next year" CTAs render with correct external URLs
    const organizerCta = page.locator('[data-testid="organizer-cta"]');
    const donateCta = page.locator('[data-testid="donate-cta"]');
    await expect(organizerCta).toBeVisible();
    await expect(organizerCta).toHaveAttribute('href', 'https://forms.gle/zh6AKeEaa415QdTp8');
    await expect(donateCta).toBeVisible();
    await expect(donateCta).toHaveAttribute('href', 'https://donorbox.org/2026-bt-hackathon');

    // Now change the vote - click "Change My Vote" button
    await helpers.safeClick(page, 'Change My Vote');

    // Team 1 should be pre-selected since we voted for it
    // Verify Team 1 is still selected
    await expect(page.locator('text=1 of 3 selected')).toBeVisible();

    // Now also select Team 2 (parents can vote for multiple projects). Team 1 staying checked is
    // the independence a checkbox promises — the opposite of what the student ballot asserts.
    const team1Again = helpers.projectOption(page, 'Team 1', 'checkbox');
    const team2 = helpers.projectOption(page, 'Team 2', 'checkbox');
    await expect(team2).toBeVisible();
    await helpers.selectProject(page, 'Team 2', 'checkbox');
    await expect(team2).toBeChecked();
    await expect(team1Again).toBeChecked();

    // Verify 2 projects are now selected
    await expect(page.locator('text=2 of 3 selected')).toBeVisible();

    // Now also select Team 3
    const team3 = helpers.projectOption(page, 'Team 3', 'checkbox');
    await expect(team3).toBeVisible();
    await helpers.selectProject(page, 'Team 3', 'checkbox');
    await expect(team3).toBeChecked();

    // Verify all 3 projects are now selected
    await expect(page.locator('text=3 of 3 selected')).toBeVisible();

    // At the limit, the unpicked option is disabled rather than silently ignored — and a native
    // checkbox is what lets a screen reader say so before the voter tries. The fixture creates a
    // fourth project precisely so there is one left over at 3 of 3.
    await expect(helpers.projectOption(page, 'Team 4', 'checkbox')).toBeDisabled();
    await expect(team1Again).toBeEnabled();

    // Submit the changed vote with all 3 teams selected
    await helpers.safeClick(page, 'Submit Vote');

    // Should navigate to thanks page again
    await page.waitForURL((url) => url.pathname.includes('/thanks'), {
      timeout: 10000
    });

    // Verify we're on the thanks page
    await expect(page.locator('text=Thank')).toBeVisible();
  });
});
