import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './playwright/tests',
	timeout: 60000,
	expect: { timeout: 10000 },
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['list'], ['html', { outputFolder: 'playwright/test-results' }]],
	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:5173',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		headless: process.env.CI ? true : false,
	},
	outputDir: 'playwright/test-results',
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1280, height: 720 },
			},
		},
		{
			name: 'mobile',
			use: {
				...devices['iPhone 13'],
			},
		},
	],
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});
