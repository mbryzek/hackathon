/**
 * Partners Star Rating Tests
 * Tests for the star rating UI in partner creation/edit forms
 * Covers: partner form UI, star rating component, adding/editing partners
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Partners Star Rating And Notes", () => {
  test("Create Partner With Rating And Edit Rating", async ({
    authenticatedPage: page,
    apiHelpers,
  }) => {
    await apiHelpers.loadUrl(page, "/partners");

    // Generate unique email for the test partner
    const testEmail = await helpers.generateRandomEmailAsync();
    const emailPrefix = testEmail.split("@")[0];
    const initialNotes = "Initial notes for test partner";
    const updatedNotes = "Updated notes after editing";

    // Click "Add New Partner" button to show the form
    await helpers.safeClick(page, "Add New Partner");

    // Fill in the email field
    await helpers.fillField(page, "#email", testEmail);

    // Select 5 stars rating
    await page.locator('button[aria-label="Rate 5 stars"]').click();

    // Verify "Excellent" label appears (indicates 5 stars selected)
    await expect(page.getByText("Excellent")).toBeVisible();

    // Fill in notes
    await helpers.fillField(page, "#notes", initialNotes);

    await apiHelpers.takeScreenshot(page, "partner-form-5-stars-with-notes");

    // Click "Create Partner" submit button
    await helpers.safeClick(page, "Create Partner");

    // Wait for form to close and partner list to appear
    await page.waitForSelector(`text=${emailPrefix}`, { timeout: 10000 });

    // Verify the partner appears in the list with 5 yellow stars
    const partnerCard = page.locator(`text=${emailPrefix}`).first();
    await expect(partnerCard).toBeVisible();

    // Count yellow stars (text-yellow-400) in the partner's card
    const partnerContainer = partnerCard.locator("xpath=ancestor::button");
    const yellowStars = partnerContainer.locator("svg.text-yellow-400");
    await expect(yellowStars).toHaveCount(5);

    await apiHelpers.takeScreenshot(page, "partner-list-5-stars");

    // Click on the partner card to go to detail page
    await partnerContainer.click();

    // Wait for detail page to load
    await page.waitForURL(/\/partners\/[^/]+$/);

    // Verify current rating shows "Excellent" (5 stars) on detail page
    await expect(page.getByText("Excellent")).toBeVisible();

    // Verify initial notes are shown on detail page
    await expect(page.getByText(initialNotes)).toBeVisible();

    // Click Edit button to go to edit page
    await page.locator('a:has-text("Edit")').click();

    // Wait for edit page to load
    await page.waitForURL(/\/partners\/.*\/edit/);
    await expect(page.getByRole("heading", { name: /^Edit/ })).toBeVisible();

    // Verify initial notes are present in the edit form
    const notesTextarea = page.locator("#notes");
    await expect(notesTextarea).toHaveValue(initialNotes);

    // Change rating to 3 stars
    await page.locator('button[aria-label="Rate 3 stars"]').click();

    // Verify "Good" label appears (indicates 3 stars selected)
    await expect(page.getByText("Good")).toBeVisible();

    // Update notes
    await notesTextarea.clear();
    await notesTextarea.fill(updatedNotes);

    await apiHelpers.takeScreenshot(page, "partner-edit-3-stars-updated-notes");

    // Click "Save Changes" button
    await helpers.safeClick(page, "Save Changes");

    // Wait for save to complete and redirect to partner detail page
    await page.waitForURL(/\/partners\/[^/]+$/, { timeout: 10000 });

    // Verify rating is now 3 stars (shows "Good") on detail page
    await expect(page.getByText("Good")).toBeVisible();

    // Verify updated notes are shown on detail page
    await expect(page.getByText(updatedNotes)).toBeVisible();

    await apiHelpers.takeScreenshot(page, "partner-detail-after-edit");

    // Go back to partners list and verify the star count
    await page.locator('a:has-text("Back to Partners")').click();
    await page.waitForURL("/partners", { timeout: 10000 });

    // Find the partner card again and verify it now shows 3 yellow stars
    const updatedPartnerCard = page.locator(`text=${emailPrefix}`).first();
    await expect(updatedPartnerCard).toBeVisible();

    const updatedPartnerContainer = updatedPartnerCard.locator(
      "xpath=ancestor::button",
    );
    const updatedYellowStars =
      updatedPartnerContainer.locator("svg.text-yellow-400");
    await expect(updatedYellowStars).toHaveCount(3);

    await apiHelpers.takeScreenshot(page, "partner-list-3-stars");
  });

  test("Create Partner With Full Contact Information", async ({
    authenticatedPage: page,
    apiHelpers,
  }) => {
    await apiHelpers.loadUrl(page, "/partners");

    // Generate unique test data
    const testEmail = await helpers.generateRandomEmailAsync();
    const name = "TestFirst TestLast";
    const nickname = "Testy";
    const phone = "5551234567";

    // Click "Add New Partner" button to show the form
    await helpers.safeClick(page, "Add New Partner");

    // Fill in all contact information fields
    await helpers.fillField(page, "#name", name);
    await helpers.fillField(page, "#nickname", nickname);
    await helpers.fillField(page, "#email", testEmail);
    await helpers.fillField(page, "#phone", phone);

    // Phone opt-in checkbox should appear after entering phone
    const phoneOptInCheckbox = page.locator('input[name="phoneOptIn"]');
    await expect(phoneOptInCheckbox).toBeVisible();
    await phoneOptInCheckbox.check();
    await expect(phoneOptInCheckbox).toBeChecked();

    // Select gender
    await page.locator("#gender").selectOption("male");

    await apiHelpers.takeScreenshot(page, "partner-form-full-contact");

    // Click "Create Partner" submit button
    await helpers.safeClick(page, "Create Partner");

    // Wait for form to close and partner list to appear
    // Partner should display with nickname since we provided it
    await page.waitForSelector(`text=${nickname}`, { timeout: 10000 });

    // Verify the partner appears in the list
    const partnerCard = page.locator(`text=${nickname}`).first();
    await expect(partnerCard).toBeVisible();

    await apiHelpers.takeScreenshot(page, "partner-list-full-contact");

    // Click on the partner card to go to detail page
    const partnerContainer = partnerCard.locator("xpath=ancestor::button");
    await partnerContainer.click();

    // Wait for detail page to load
    await page.waitForURL(/\/partners\/[^/]+$/);

    await apiHelpers.takeScreenshot(page, "partner-detail-full-contact");

    // Click Edit button to go to edit page
    await page.locator('a:has-text("Edit")').click();

    // Wait for edit page to load
    await page.waitForURL(/\/partners\/.*\/edit/);
    await expect(page.getByRole("heading", { name: /^Edit/ })).toBeVisible();

    // Verify all contact information was saved correctly
    await expect(page.locator("#name")).toHaveValue(name);
    await expect(page.locator("#nickname")).toHaveValue(nickname);
    await expect(page.locator("#email")).toHaveValue(testEmail);
    await expect(page.locator("#phone")).toHaveValue(phone);
    await expect(page.locator('input[name="phoneOptIn"]')).toBeChecked();
    await expect(page.locator("#gender")).toHaveValue("male");

    await apiHelpers.takeScreenshot(page, "partner-edit-full-contact-verified");

    // Update some fields to verify editing works
    const updatedName = "UpdatedFirst UpdatedLast";
    const updatedNickname = "Updy";

    await page.locator("#name").clear();
    await page.locator("#name").fill(updatedName);
    await page.locator("#nickname").clear();
    await page.locator("#nickname").fill(updatedNickname);

    // Clear phone number to test removing it (backend requires consent if phone is present)
    await page.locator("#phone").clear();

    // Change gender
    await page.locator("#gender").selectOption("female");

    await apiHelpers.takeScreenshot(page, "partner-edit-updated-contact");

    // Save changes
    await helpers.safeClick(page, "Save Changes");

    // Wait for save to complete and redirect to partner detail page
    await page.waitForURL(/\/partners\/[^/]+$/, { timeout: 10000 });

    await apiHelpers.takeScreenshot(page, "partner-detail-after-update");

    // Click Edit button to go to edit page and verify form values persisted
    await page.locator('a:has-text("Edit")').click();

    // Wait for edit page to load
    await page.waitForURL(/\/partners\/.*\/edit/);

    // Verify all updated fields
    await expect(page.locator("#name")).toHaveValue(updatedName);
    await expect(page.locator("#nickname")).toHaveValue(updatedNickname);
    await expect(page.locator("#email")).toHaveValue(testEmail);
    await expect(page.locator("#phone")).toHaveValue(""); // Phone was cleared
    // Phone opt-in checkbox should not be visible when phone is empty
    await expect(page.locator('input[name="phoneOptIn"]')).not.toBeVisible();
    await expect(page.locator("#gender")).toHaveValue("female");

    await apiHelpers.takeScreenshot(page, "partner-edit-changes-persisted");

    // Go back to partners list and verify updated name appears
    await page.locator('a:has-text("Back")').click();
    await page.waitForURL(/\/partners\/[^/]+$/, { timeout: 10000 });
    await page.locator('a:has-text("Back to Partners")').click();
    await page.waitForURL("/partners", { timeout: 10000 });

    // Verify updated name appears in list
    const updatedPartnerCard = page.locator(`text=${updatedNickname}`).first();
    await expect(updatedPartnerCard).toBeVisible();

    await apiHelpers.takeScreenshot(page, "partner-list-updated-name");
  });
});
