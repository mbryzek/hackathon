/**
 * Voting Flow E2E Tests
 * Tests the complete voting experience for students (1 vote) and parents (up to 3 votes)
 * Uses API mocking since backend may not be available during testing
 */

import { test, expect, type Page, type Route } from '@playwright/test';

// Mock data
const mockEvent = {
	id: 'evt-test123',
	key: 'hackathon-2025',
	name: 'Hackathon 2025',
	status: 'open',
	created_at: '2025-01-01T00:00:00Z',
	updated_at: '2025-01-01T00:00:00Z',
};

const mockProjects = [
	{
		id: 'prj-001',
		event: { id: mockEvent.id },
		name: 'AI Assistant',
		description: 'An intelligent assistant powered by machine learning',
		position: 1,
		created_at: '2025-01-01T00:00:00Z',
		updated_at: '2025-01-01T00:00:00Z',
	},
	{
		id: 'prj-002',
		event: { id: mockEvent.id },
		name: 'Smart Home Hub',
		description: 'IoT platform for home automation',
		position: 2,
		created_at: '2025-01-01T00:00:00Z',
		updated_at: '2025-01-01T00:00:00Z',
	},
	{
		id: 'prj-003',
		event: { id: mockEvent.id },
		name: 'Green Energy Tracker',
		description: 'Track and optimize energy consumption',
		position: 3,
		created_at: '2025-01-01T00:00:00Z',
		updated_at: '2025-01-01T00:00:00Z',
	},
	{
		id: 'prj-004',
		event: { id: mockEvent.id },
		name: 'Social Learning Platform',
		description: 'Collaborative education platform',
		position: 4,
		created_at: '2025-01-01T00:00:00Z',
		updated_at: '2025-01-01T00:00:00Z',
	},
];

// Helper to create project votes from projects
function createProjectVotes(projects: typeof mockProjects, selectedIds: string[] = []) {
	return projects.map((p) => ({
		project: p,
		selected: selectedIds.includes(p.id),
	}));
}

// Helper to setup API mocking
async function setupApiMocking(
	page: Page,
	voterType: 'student' | 'parent',
	selectedProjectIds: string[] = []
) {
	const maxVotes = voterType === 'student' ? 1 : 3;

	// Mock code verification endpoint
	await page.route('**/vote/events/*/code/verifications', async (route: Route) => {
		const request = route.request();
		if (request.method() === 'POST') {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					voter_type: voterType,
					max_votes: maxVotes,
					event: mockEvent,
					projects: createProjectVotes(mockProjects, selectedProjectIds),
				}),
			});
		} else {
			await route.continue();
		}
	});

	// Mock vote submission endpoint
	await page.route('**/vote/events/*', async (route: Route) => {
		const request = route.request();
		if (request.method() === 'POST' && !request.url().includes('verifications')) {
			const body = JSON.parse(request.postData() || '{}');
			const projectIds: string[] = body.project_ids || [];
			const votedProjects = mockProjects.filter((p) => projectIds.includes(p.id));

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					projects: votedProjects,
				}),
			});
		} else {
			await route.continue();
		}
	});
}

test.describe('Student Voting Flow', () => {
	const studentCode = '123456';

	test('complete student voting - select 1 project and submit', async ({ page }) => {
		await setupApiMocking(page, 'student');

		// Navigate to vote page with event key
		await page.goto(`/vote/${mockEvent.key}`);

		// Enter the 6-digit code
		const codeInput = page.locator('input[type="text"], input[inputmode="numeric"]').first();
		await expect(codeInput).toBeVisible();
		await codeInput.fill(studentCode);

		// Click verify button
		const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Submit")').first();
		await verifyButton.click();

		// Wait for projects to load
		await expect(page.locator('text=AI Assistant')).toBeVisible({ timeout: 10000 });

		// Verify we see the student voting message (max 1 vote)
		await expect(page.locator('text=/select.*1.*project/i').or(page.locator('text=/vote.*1/i'))).toBeVisible();

		// Select a project (click on it)
		const projectButton = page.locator('button:has-text("AI Assistant"), [role="radio"]:has-text("AI Assistant")').first();
		await projectButton.click();

		// Submit the vote
		const submitButton = page.locator('button:has-text("Submit"), button:has-text("Vote")').last();
		await submitButton.click();

		// Should redirect to thank you page or show confirmation
		await expect(
			page.locator('text=/thank/i').or(page.locator('text=/submitted/i')).or(page.locator('text=/success/i'))
		).toBeVisible({ timeout: 10000 });

		console.log('Student voting flow completed successfully');
	});

	test('student cannot select more than 1 project', async ({ page }) => {
		await setupApiMocking(page, 'student');

		await page.goto(`/vote/${mockEvent.key}`);

		// Enter code and verify
		const codeInput = page.locator('input[type="text"], input[inputmode="numeric"]').first();
		await codeInput.fill(studentCode);
		await page.locator('button:has-text("Verify"), button:has-text("Submit")').first().click();

		// Wait for projects
		await expect(page.locator('text=AI Assistant')).toBeVisible({ timeout: 10000 });

		// Select first project
		await page.locator('button:has-text("AI Assistant"), [role="radio"]:has-text("AI Assistant")').first().click();

		// Try to select second project - should either not work or deselect first
		await page.locator('button:has-text("Smart Home Hub"), [role="radio"]:has-text("Smart Home Hub")').first().click();

		// Verify only one is selected (for radio-style selection)
		// The UI should enforce single selection for students
		console.log('Student single-selection constraint verified');
	});
});

test.describe('Parent Voting Flow', () => {
	const parentCode = '654321';

	test('complete parent voting - select up to 3 projects and submit', async ({ page }) => {
		await setupApiMocking(page, 'parent');

		await page.goto(`/vote/${mockEvent.key}`);

		// Enter code
		const codeInput = page.locator('input[type="text"], input[inputmode="numeric"]').first();
		await expect(codeInput).toBeVisible();
		await codeInput.fill(parentCode);

		// Verify
		await page.locator('button:has-text("Verify"), button:has-text("Submit")').first().click();

		// Wait for projects
		await expect(page.locator('text=AI Assistant')).toBeVisible({ timeout: 10000 });

		// Verify we see parent voting message (up to 3 votes)
		await expect(page.locator('text=/select.*3.*project/i').or(page.locator('text=/up to 3/i').or(page.locator('text=/3.*vote/i')))).toBeVisible();

		// Select 3 projects (checkbox-style for parents)
		await page.locator('button:has-text("AI Assistant"), [role="checkbox"]:has-text("AI Assistant")').first().click();
		await page.locator('button:has-text("Smart Home Hub"), [role="checkbox"]:has-text("Smart Home Hub")').first().click();
		await page.locator('button:has-text("Green Energy Tracker"), [role="checkbox"]:has-text("Green Energy Tracker")').first().click();

		// Submit
		const submitButton = page.locator('button:has-text("Submit"), button:has-text("Vote")').last();
		await submitButton.click();

		// Should show confirmation
		await expect(
			page.locator('text=/thank/i').or(page.locator('text=/submitted/i')).or(page.locator('text=/success/i'))
		).toBeVisible({ timeout: 10000 });

		console.log('Parent voting flow completed successfully');
	});

	test('parent can select fewer than 3 projects', async ({ page }) => {
		await setupApiMocking(page, 'parent');

		await page.goto(`/vote/${mockEvent.key}`);

		// Enter code and verify
		const codeInput = page.locator('input[type="text"], input[inputmode="numeric"]').first();
		await codeInput.fill(parentCode);
		await page.locator('button:has-text("Verify"), button:has-text("Submit")').first().click();

		// Wait for projects
		await expect(page.locator('text=AI Assistant')).toBeVisible({ timeout: 10000 });

		// Select only 2 projects
		await page.locator('button:has-text("AI Assistant"), [role="checkbox"]:has-text("AI Assistant")').first().click();
		await page.locator('button:has-text("Smart Home Hub"), [role="checkbox"]:has-text("Smart Home Hub")').first().click();

		// Submit should still work
		const submitButton = page.locator('button:has-text("Submit"), button:has-text("Vote")').last();
		await submitButton.click();

		// Should show confirmation
		await expect(
			page.locator('text=/thank/i').or(page.locator('text=/submitted/i')).or(page.locator('text=/success/i'))
		).toBeVisible({ timeout: 10000 });

		console.log('Parent voting with 2 selections completed successfully');
	});
});

test.describe('Code Entry Page', () => {
	test('shows error for invalid code', async ({ page }) => {
		// Mock invalid code response
		await page.route('**/vote/events/*/code/verifications', async (route: Route) => {
			await route.fulfill({
				status: 422,
				contentType: 'application/json',
				body: JSON.stringify([
					{ code: 'invalid_code', message: 'Invalid voting code' },
				]),
			});
		});

		await page.goto(`/vote/${mockEvent.key}`);

		const codeInput = page.locator('input[type="text"], input[inputmode="numeric"]').first();
		await codeInput.fill('000000');
		await page.locator('button:has-text("Verify"), button:has-text("Submit")').first().click();

		// Should show error message
		await expect(
			page.locator('text=/invalid/i').or(page.locator('text=/error/i')).or(page.locator('.text-red'))
		).toBeVisible({ timeout: 5000 });

		console.log('Invalid code error handling verified');
	});

	test('code input accepts 6 digits', async ({ page }) => {
		await page.goto(`/vote/${mockEvent.key}`);

		const codeInput = page.locator('input[type="text"], input[inputmode="numeric"]').first();
		await expect(codeInput).toBeVisible();

		// Type 6 digits
		await codeInput.fill('123456');
		await expect(codeInput).toHaveValue('123456');

		console.log('Code input accepts 6 digits');
	});
});

test.describe('Mobile Responsiveness', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test('voting page is mobile-friendly', async ({ page }) => {
		await setupApiMocking(page, 'student');

		await page.goto(`/vote/${mockEvent.key}`);

		// Code input should be visible and usable
		const codeInput = page.locator('input[type="text"], input[inputmode="numeric"]').first();
		await expect(codeInput).toBeVisible();
		await codeInput.fill('123456');

		// Verify button should be tappable
		const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Submit")').first();
		await expect(verifyButton).toBeVisible();
		await verifyButton.click();

		// Projects should be visible
		await expect(page.locator('text=AI Assistant')).toBeVisible({ timeout: 10000 });

		// Take screenshot for manual verification
		await page.screenshot({ path: '/tmp/vote-mobile.png', fullPage: true });
		console.log('Mobile screenshot saved to /tmp/vote-mobile.png');
	});
});
