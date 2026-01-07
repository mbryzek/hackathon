import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * Official @playwright/test configuration for Private Dinkers end-to-end tests
 *
 * See https://playwright.dev/docs/test-configuration
 */

// Support both FRONTEND_BASE_URL and legacy BASE_URL
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || process.env.BASE_URL || 'http://localhost:5173';
const HEADLESS = process.env.HEADLESS === 'true';
const TEST_RUN_DIR = process.env.TEST_RUN_DIR || '/tmp/playwright-screenshots';

export default defineConfig({
  testDir: './playwright/tests',

  // Global setup - runs once before all tests
  globalSetup: './playwright/global-setup.ts',

  // Test output directories
  outputDir: `${TEST_RUN_DIR}/test-results`,

  // Timeout configuration
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 30000, // 30 seconds for assertions
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: `${TEST_RUN_DIR}/html-report` }],
    ['json', { outputFile: `${TEST_RUN_DIR}/test-results.json` }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: FRONTEND_BASE_URL,

    // Bypass rate limiting for Playwright tests (only works in Dev/Test mode on backend)
    extraHTTPHeaders: {
      'X-Bypass-Rate-Limit': 'true',
    },

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot configuration - always capture on failure
    screenshot: 'only-on-failure',

    // Video configuration
    video: 'retain-on-failure',

    // Navigation timeout
    navigationTimeout: 60000,

    // Action timeout
    actionTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          slowMo: HEADLESS ? 0 : 50, // Slow down by 50ms only for visible mode
        },
      },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    // },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Run your local dev server before starting the tests
  // webServer: {
  //   command: 'npm run dev',
  //   url: FRONTEND_BASE_URL,
  //   reuseExistingServer: !process.env.CI,
  // },
});
