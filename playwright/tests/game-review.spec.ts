/**
 * Game Review Tests
 * Tests for submitting, viewing, and editing game reviews
 */

import { test, expect } from "../fixtures";
import * as helpers from "../utils/test-helpers";

test.describe("Game Review", () => {
  test("TEST 1: Submit and view a game review", async ({
    authenticatedContext,
    apiHelpers,
  }) => {
    const { page, session } = authenticatedContext;

    // Create a past game with the current user as an accepted player (required for review)
    const pastGame = await helpers.createGame({
      status: helpers.TestGameStatus.Past,
      created_by_user_id: session.user.id,
      add_user_to_game: true,
    });

    // Navigate to the past game detail page
    await apiHelpers.loadUrl(page, `/games/${pastGame.game.id}`);

    // Wait for the game data to load via SSE (the page starts with "Loading..." spinner)
    // The Review Game button appears once game data and player data are loaded
    const reviewButton = page.locator('a').filter({ hasText: 'Review Game' }).first();
    await expect(reviewButton).toBeVisible({ timeout: 15000 });

    await apiHelpers.takeScreenshot(page, "game-review-before-submit");

    // Click the "Review Game" button and wait for navigation
    await reviewButton.click();
    await page.waitForURL(/\/games\/.*\/review$/, { timeout: 10000 });

    // Verify we're on the review page with "Review Game" header (not editing)
    await expect(page.locator('h1:has-text("Review Game")')).toBeVisible();

    await apiHelpers.takeScreenshot(page, "game-review-form");

    // Fill in the overall rating - click the 4th star
    // StarRating component uses role="radiogroup" with aria-label="Rating"
    const overallStars = page
      .locator('h2:has-text("Overall Game Experience")')
      .locator("..")
      .locator('[role="radiogroup"] button');
    await expect(overallStars).toHaveCount(5);
    await overallStars.nth(3).click(); // Click 4th star (0-indexed)

    // Add some notes
    const notesField = page.locator('textarea[name="overall_notes"]');
    await notesField.fill("Great game! Had a lot of fun playing.");

    await apiHelpers.takeScreenshot(page, "game-review-filled");

    // Submit the review
    await page.click('button:has-text("Submit Review")');

    // Wait for redirect back to game detail page (the form redirects there with a flash message)
    await page.waitForURL(new RegExp(`/games/${pastGame.game.id}(\\?.*)?$`), { timeout: 10000 });

    await apiHelpers.takeScreenshot(page, "game-review-success");

    // Verify we now see "Your Review" section instead of "Review Game" button
    // Note: The review data comes via SSE, so we need to wait for it to load
    await expect(page.locator('h3:has-text("Your Review")')).toBeVisible({
      timeout: 10000,
    });

    // Verify the "Review Game" link is no longer visible
    await expect(
      page.locator('a:has-text("Review Game")'),
    ).not.toBeVisible();

    // Verify the "Your Review" section is clickable (clicking it takes you to edit)
    const yourReviewLink = page.locator('a').filter({ hasText: 'Your Review' }).first();
    await expect(yourReviewLink).toBeVisible();

    // Verify the rating is displayed (4 stars should be yellow)
    const yellowStars = page.locator("svg.text-yellow-400");
    const yellowStarCount = await yellowStars.count();
    expect(yellowStarCount).toBe(4);

    // Verify the notes are displayed (notes are wrapped in decorative quotes in the UI)
    await expect(
      page.locator('text="\"Great game! Had a lot of fun playing.\""'),
    ).toBeVisible();

    await apiHelpers.takeScreenshot(page, "game-review-displayed");
  });

  test("TEST 2: Edit an existing game review", async ({
    authenticatedContext,
    apiHelpers,
  }) => {
    const { page, session } = authenticatedContext;

    // Create a past game with the current user as an accepted player (required for review)
    const pastGame = await helpers.createGame({
      status: helpers.TestGameStatus.Past,
      created_by_user_id: session.user.id,
      add_user_to_game: true,
    });

    // Navigate to the past game detail page
    await apiHelpers.loadUrl(page, `/games/${pastGame.game.id}`);

    // First, submit an initial review
    // Wait for the game data to load via SSE before the Review button appears
    const reviewButton = page.locator('a').filter({ hasText: 'Review Game' }).first();
    await expect(reviewButton).toBeVisible({ timeout: 15000 });

    // Click the "Review Game" button and wait for navigation
    await reviewButton.click();
    await page.waitForURL(/\/games\/.*\/review$/, { timeout: 10000 });

    // Fill in initial rating (3 stars)
    const starContainer = page
      .locator("text=How was your overall experience?")
      .locator("..");
    const stars = starContainer.locator("button");
    if ((await stars.count()) >= 3) {
      await stars.nth(2).click(); // 3rd star (0-indexed)
    }

    await page.locator('textarea[name="overall_notes"]').fill("Initial review");

    // Submit the review
    await page.click('button:has-text("Submit Review")');

    // Wait for redirect back to game detail page
    await page.waitForURL(new RegExp(`/games/${pastGame.game.id}(\\?.*)?$`), { timeout: 10000 });

    // Click "Your Review" section to edit (the entire section is a clickable link)
    const yourReviewLink = page.locator('a').filter({ hasText: 'Your Review' }).first();
    await expect(yourReviewLink).toBeVisible({ timeout: 5000 });
    await yourReviewLink.click();

    // Wait for review page to load
    await page.waitForURL(/\/games\/.*\/review$/);

    // Verify we're in edit mode - header should say "Edit Review"
    await expect(page.locator('h1:has-text("Edit Review")')).toBeVisible();

    // Verify the form is pre-filled with the existing rating (3 stars should be yellow initially)
    // Note: The StarRating component shows filled stars for the current rating

    await apiHelpers.takeScreenshot(page, "game-review-edit-form");

    // Update the rating to 5 stars
    const editStarContainer = page
      .locator("text=How was your overall experience?")
      .locator("..");
    const editStars = editStarContainer.locator("button");
    if ((await editStars.count()) >= 5) {
      await editStars.nth(4).click(); // 5th star (0-indexed)
    }

    // Update the notes
    await page
      .locator('textarea[name="overall_notes"]')
      .fill("Updated review - even better than I remembered!");

    await apiHelpers.takeScreenshot(page, "game-review-edit-filled");

    // Submit the update
    await page.click('button:has-text("Update Review")');

    // Wait for redirect back to game detail page
    await page.waitForURL(new RegExp(`/games/${pastGame.game.id}(\\?.*)?$`), { timeout: 10000 });

    // Verify the updated rating is displayed (5 stars should be yellow now)
    const updatedYellowStars = page.locator("svg.text-yellow-400");
    const updatedYellowStarCount = await updatedYellowStars.count();
    expect(updatedYellowStarCount).toBe(5);

    // Verify the updated notes are displayed (notes are wrapped in decorative quotes in the UI)
    await expect(
      page.locator(
        'text="\"Updated review - even better than I remembered!\""',
      ),
    ).toBeVisible();

    await apiHelpers.takeScreenshot(page, "game-review-updated");
  });

  test("TEST 3: Review button not shown for non-past games", async ({
    testGame,
    apiHelpers,
  }) => {
    // testGame fixture creates an upcoming game by default
    const { page, game } = testGame;

    // Navigate to game detail page
    await apiHelpers.loadUrl(page, `/games/${game.id}`);

    // Verify the game is not in "past" status (it's upcoming)
    // The "Review Game" link should NOT be visible
    const reviewLink = page.locator('a:has-text("Review Game")');
    await expect(reviewLink).not.toBeVisible();

    // The "Your Review" section should also NOT be visible (no review exists)
    const yourReviewSection = page.locator('h3:has-text("Your Review")');
    await expect(yourReviewSection).not.toBeVisible();

    await apiHelpers.takeScreenshot(page, "game-no-review-upcoming");
  });
});
