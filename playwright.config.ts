import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * Official @playwright/test configuration for Private Dinkers end-to-end tests
 *
 * See https://playwright.dev/docs/test-configuration
 */

// Support both FRONTEND_BASE_URL and legacy BASE_URL
const FRONTEND_BASE_URL = process.env['FRONTEND_BASE_URL'] || process.env['BASE_URL'] || 'http://localhost:5173';
const HEADLESS = process.env['HEADLESS'] === 'true';
const TEST_RUN_DIR = process.env['TEST_RUN_DIR'] || '/tmp/playwright-screenshots';

/**
 * The port CI told this build to serve the frontend on (`dev e2e run`, ISS-2193).
 *
 * ONLY SET IN CI, and the `webServer` below keys off that rather than off `CI`, so a developer's
 * workflow is untouched: you start `npm run dev` yourself, this stays undefined, and playwright
 * manages no server — exactly as before.
 *
 * `strictPort` IS THE LOAD-BEARING WORD. A runner executes several builds at once behind nothing
 * but a per-repo flock (ISS-2066), and vite silently auto-increments a taken port. Without
 * `--strictPort` the collision is not a bind error: this suite attaches to the NEIGHBOURING
 * build's dev server and reports on that repo's frontend against this one's backend, which is a
 * red (or worse, a green) that nothing in the log explains.
 */
const E2E_WEB_PORT = process.env.E2E_WEB_PORT;

export default defineConfig({
  testDir: './playwright/tests',

  // Global setup - runs once before all tests
  globalSetup: './playwright/global-setup.ts',

  // Test output directories
  outputDir: `${TEST_RUN_DIR}/test-results`,

  // Timeout configuration
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 30000 // 30 seconds for assertions
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env['CI'],

  // Retry on CI only
  retries: process.env['CI'] ? 2 : 0,

  // Opt out of parallel tests on CI. Spread rather than `: undefined`, because
  // under `exactOptionalPropertyTypes` an explicit `undefined` is not the same
  // as an absent key — and absent is what asks Playwright for its own default.
  ...(process.env['CI'] ? { workers: 1 } : {}),

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: `${TEST_RUN_DIR}/html-report` }],
    ['json', { outputFile: `${TEST_RUN_DIR}/test-results.json` }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: FRONTEND_BASE_URL,

    // Bypass rate limiting for Playwright tests (only works in Dev/Test mode on backend)
    extraHTTPHeaders: {
      'X-Bypass-Rate-Limit': 'true'
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
    actionTimeout: 30000
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          slowMo: HEADLESS ? 0 : 50 // Slow down by 50ms only for visible mode
        }
      }
    }

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
  ...(E2E_WEB_PORT
    ? {
        webServer: {
          // `npm run dev` rather than a build + preview: these specs were written against the dev
          // server a developer runs, and the point of enrolling them is to run THAT suite rather
          // than a differently-served approximation of it. VITE_API_BASE_URL reaches it from this
          // process's environment, where `dev e2e run` put it — vite gives a `VITE_`-prefixed
          // process variable precedence over the committed `.env`.
          command: `npm run dev -- --port ${E2E_WEB_PORT} --strictPort`,
          url: FRONTEND_BASE_URL,
          // NEVER reuse. A server already on this port is by definition not ours — the port was
          // allocated to this build seconds ago — so reusing it is the ISS-2066 collision wearing
          // a friendlier face.
          reuseExistingServer: false,
          timeout: 120_000,
          stdout: 'pipe',
          stderr: 'pipe'
        }
      }
    : {})
});
