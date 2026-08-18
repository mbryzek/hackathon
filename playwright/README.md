# Playwright End-to-End Tests

TypeScript-based end-to-end tests for the Private Dinkers application using [@playwright/test](https://playwright.dev/).

## Overview

- **Full type safety** with TypeScript
- **Modern test framework** using @playwright/test
- **Custom fixtures** for common test scenarios
- **Comprehensive test helpers** for API interactions and UI testing

This code is held to the same standards as `src/`. `npm run check` type-checks it
(`check:e2e`), loads it (`check:e2e:collect`), lints it (`lint`), and format-checks it
(`format:check`) — see [Static checks](#static-checks) below. Only `playwright/generated/` is
exempt, because it is generated.

## Getting Started

### Prerequisites

- Node.js and npm installed
- Application server running on `http://localhost:5173` (or set `BASE_URL` env var)
- Backend API server running on `http://localhost:9300`

**Note:** The test suite automatically checks that required servers are running before executing tests. If any server is unavailable, tests will fail immediately with a clear error message.

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test home-redirect.spec.ts

# Run tests matching a pattern
npx playwright test --grep "password"

# View HTML report
npm run test:e2e:report
```

### Static checks

Running the suite needs a frontend and a backend up. The static checks do not, so they are the
gate this code is normally held to — all four run under `npm run check`:

```bash
npm run check:e2e          # tsc --noEmit against playwright/tsconfig.json
npm run check:e2e:collect  # playwright test --list: load every spec and resolve every fixture
npm run lint               # eslint, including playwright/ and playwright.config.ts
npm run format:check       # prettier
```

`check:e2e:collect` is there because type-checking and linting cannot see how Playwright wires
fixtures together. Playwright reads a fixture's dependencies out of `fn.toString()` and rejects a
first argument that is not a literal `{...}` destructuring pattern — so renaming `({}, use)` to
`(_fixtures, use)` compiles, lints, and then fails collection of the _entire_ suite. `--list`
loads every spec and resolves every fixture without starting a browser or needing a server, in
well under a second, and is the only one of the four that catches it.

## Environment Variables

Configure tests using environment variables:

```bash
# Frontend server URL (default: http://localhost:5173)
export FRONTEND_BASE_URL=http://localhost:5173

# Backend API server URL (default: http://localhost:9300)
export BACKEND_BASE_URL=http://localhost:9300

# Legacy: BASE_URL still supported as alias for FRONTEND_BASE_URL
export BASE_URL=http://localhost:5173

# Browser headless mode (default: false)
export HEADLESS=true

# Enable/disable screenshots (default: true)
export SCREENSHOTS=false

# Test results directory (default: /tmp/playwright-screenshots)
export TEST_RUN_DIR=/tmp/test-results

# Skip server dependency check (default: false)
export SKIP_DEPENDENCY_CHECK=true
```

## Server Dependency Check

Before running tests, Playwright automatically verifies that required servers are running:

- **Frontend**: Checks `http://localhost:5173` (or `$FRONTEND_BASE_URL`)
- **Backend API**: Checks `http://localhost:9300/_internal_/healthcheck` (or `$BACKEND_BASE_URL/_internal_/healthcheck`)

If any server is not responding, tests will fail immediately with a clear error message:

```
❌ Server dependency check FAILED

The following servers are not running:

  • Backend API: http://localhost:9300/_internal_/healthcheck
    → Start backend server

Please start all required servers before running tests.
```

### Skipping Dependency Check

To skip the dependency check (useful for debugging):

```bash
SKIP_DEPENDENCY_CHECK=true npx playwright test
```

## Project Structure

```
playwright/
├── tests/              # Test files (*.spec.ts)
│   ├── authentication.spec.ts
│   ├── home-redirect.spec.ts
│   ├── password-reset.spec.ts
│   └── ...
├── utils/
│   └── test-helpers.ts # Helper functions for common test operations
├── config.ts           # Test configuration
├── fixtures.ts         # Custom Playwright fixtures
├── global-setup.ts     # Global setup (server dependency checks)
├── types.ts            # TypeScript type definitions
└── README.md           # This file

playwright.config.ts    # Playwright configuration (project root)
tsconfig.playwright.json # TypeScript configuration for tests
```

## Test Suites

### Authentication & Registration (15 tests)

- **authentication.spec.ts** - Login, registration, form validation
- **mobile-registration-optimized.spec.ts** - Mobile phone registration
- **mobile-registration-variant.spec.ts** - Registration without SMS
- **registration-login-flow.spec.ts** - Complete auth flow
- **registration-partners.spec.ts** - Partner registration step

### Account Management (8 tests)

- **account-management.spec.ts** - Profile, password, account settings
- **password-reset.spec.ts** - Complete password reset flow

### Game Management (14 tests)

- **game-list.spec.ts** - Game filters and list display
- **game-management.spec.ts** - Game creation and details
- **game-player-selection.spec.ts** - Player selection during scheduling

### Player Invitations (6 tests)

- **player-invitation-accept.spec.ts** - Accept game invitations
- **player-invitation-decline.spec.ts** - Decline invitations
- **player-invitation-initial.spec.ts** - Initial invitation page

### Partners & Connections (2 tests)

- **partners-star-rating.spec.ts** - Partner management and ratings

### Navigation (2 tests)

- **home-redirect.spec.ts** - Home page redirect logic

**Total: 55 tests across 15 test suites**

## Custom Fixtures

The test suite provides custom fixtures for common scenarios:

### `authenticatedPage`

Provides a page with user session already set up (auto-cleanup).

```typescript
test('my test', async ({ authenticatedPage }) => {
  // Page already has valid session
  await authenticatedPage.goto('/dashboard');
});
```

### `testSession`

Creates a test user and session (auto-cleanup).

```typescript
test('my test', async ({ testSession, context }) => {
  const userEmail = testSession.user.email.address;
  await helpers.setSessionCookie(context, testSession.session.id);
});
```

### `testGame`

Creates an authenticated user, creates a game for that user, and provides both the page and game data (auto-cleanup).

```typescript
test('my test', async ({ testGame, apiHelpers }) => {
  const { page, game, players, session } = testGame;
  await apiHelpers.loadUrl(page, `/games/${game.id}`);
  // page is already authenticated for the user who created the game
});
```

For games with custom options, use `authenticatedPage` + `apiHelpers.createGame()`:

```typescript
test('my test', async ({ authenticatedPage: page, apiHelpers }) => {
  const { game } = await apiHelpers.createGame({
    players: [{ status: PlayerStatus.Invited }, { status: PlayerStatus.Accepted }]
  });
  await apiHelpers.loadUrl(page, `/games/${game.id}`);
});
```

### `apiHelpers`

Access to all test helper functions.

```typescript
test('my test', async ({ apiHelpers, page }) => {
  await apiHelpers.login(page, email, password);
  await apiHelpers.assertVisible(page, '.dashboard');
});
```

## Helper Functions

The `test-helpers.ts` file provides utilities for common operations:

### API Helpers

- `createUserSession()` - Create authenticated user via API
- `createTestPlayer()` - Create test player invitation
- `createGame(options)` - Create test game with optional players
- `getPasswordResetToken(email)` - Get password reset token
- `cleanupTestUsers(emails)` - Delete test users

### Browser Helpers

- `login(page, email, password)` - Log in user
- `logout(page)` - Log out user
- `setSessionCookie(context, sessionId)` - Set authentication cookie
- `loadUrl(page, path)` - Navigate and wait for page load

### UI Helpers

- `waitForElement(page, selector, options)` - Wait for element
- `safeClick(page, selector, options)` - Click with retry logic
- `fillField(page, selector, value)` - Fill form field with validation
- `takeScreenshot(page, name)` - Capture screenshot

### Assertion Helpers

- `assertVisible(page, selector, message)` - Assert element visibility
- `assertText(page, selector, expectedText)` - Assert text content
- `assertVisibleText(page, selector, expectedText)` - Assert visible text
- `checkForErrors(page)` - Check for error messages

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '../fixtures';
import * as helpers from '../utils/test-helpers';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await helpers.loadUrl(page, '/my-page');

    // Use expect() for assertions
    expect(page.url()).toContain('/my-page');

    // Use helpers for common operations
    await helpers.assertVisible(page, '.my-element');
  });

  test('with authenticated user', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    expect(authenticatedPage.url()).toContain('/dashboard');
  });
});
```

### Using Custom Fixtures

```typescript
test('view game details', async ({ testGame, authenticatedPage }) => {
  const { game, players } = testGame;

  await authenticatedPage.goto(`/games/${game.id}`);
  expect(authenticatedPage.url()).toContain(game.id);
});
```

### Type Safety

All helpers and fixtures are fully typed:

```typescript
import type { TenantSession, GameCreationResponse } from '../types';

test('typed data', async ({ testSession }) => {
  // testSession is typed as TenantSession
  const userId: string = testSession.user.id;
  const sessionId: string = testSession.session.id;
});
```

## Test Output

### Console Output

Tests display progress and results in the console with emoji indicators:

- 🚀 Test starting
- ✅ Test passed / Step completed
- ❌ Test failed
- 📸 Screenshot captured
- 🍪 Cookie set
- 🔑 User created

### Screenshots

Failed tests and explicit `takeScreenshot()` calls save to:

- Default: `/tmp/playwright-screenshots/`
- Custom: `$TEST_RUN_DIR/screenshots/`

### HTML Report

View detailed test results:

```bash
npm run test:e2e:report
```

### JSON Results

Test results are saved to:

- `$TEST_RUN_DIR/test-results.json` (summary)
- `$TEST_RUN_DIR/individual/*.json` (per-test results)

## Debugging Tests

### Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### UI Mode

```bash
npm run test:e2e:ui
```

Interactive mode with test explorer and time travel debugging.

### Headed Mode

```bash
npm run test:e2e:headed
```

Run tests with visible browser window.

### VSCode Integration

Install the [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension for:

- Run tests from editor
- Set breakpoints
- View test results inline

## CI

`ci/e2e.sh` runs this suite post-merge on `main` (ISS-4028). `dev e2e run` pulls the newest
released `platform` image, boots it in `Mode.Test` against a throwaway session database, hands the
suite its URLs, and removes both afterwards; the result posts as the `e2e` commit status.

`e2e` is NOT what the merge lane reads. That is `ci`, produced by `ci/build.sh`, which deliberately
omits `npm run test:e2e` — so a red browser suite files an issue rather than parking every pull
request in this repo. `devops/docs/ci.md` carries the three-step rollout that is the first step of.

The `CI` branches in `playwright.config.ts` are for that run: two retries and a single worker,
because the backend is an emulated amd64 JVM sharing a runner with other builds.

## Migration Notes

This test suite was migrated from JavaScript to TypeScript in November 2024:

- All 16 test files converted to TypeScript
- Migrated from custom framework to @playwright/test
- Added comprehensive type definitions
- Created custom fixtures for common scenarios
- Improved test organization with describe/test blocks
- Removed manual browser lifecycle management

### Key Benefits

- Full TypeScript type safety
- Better IDE autocomplete and refactoring
- Modern Playwright Test features (fixtures, retry, parallelization)
- Consistent with main SvelteKit codebase
- Improved maintainability and developer experience

## Troubleshooting

### Tests fail with "Cannot find module"

Ensure you're running tests from the project root and dependencies are installed:

```bash
npm install
```

### Server dependency check fails

If you see "Server dependency check FAILED", ensure all required servers are running:

```bash
# Start frontend (Terminal 1)
npm run dev

# Start backend (Terminal 2)
# (See backend project README for instructions)
```

To verify servers manually:

```bash
# Check frontend
curl http://localhost:5173

# Check backend healthcheck
curl http://localhost:9300/_internal_/healthcheck
```

To run tests anyway (not recommended):

```bash
SKIP_DEPENDENCY_CHECK=true npx playwright test
```

### Backend API not responding

Verify the backend server is running on `http://localhost:9300`:

```bash
# Check if server is running via healthcheck
curl http://localhost:9300/_internal_/healthcheck
```

### Application not loading

Verify the frontend is running on `http://localhost:5173`:

```bash
npm run dev
```

### Type errors

Ensure TypeScript configuration is correct:

```bash
npx tsc --noEmit --project tsconfig.playwright.json
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Project Plan](~/code/claude/plans/privatedinkers/playwright-typescript-migration.md)
