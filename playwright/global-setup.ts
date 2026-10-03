/**
 * Global Setup for Playwright Tests
 * Runs once before all tests to verify dependencies
 *
 * FAILING FAST IS FOR A SERVER NOBODY STARTED, NOT FOR A SLOW OR A DROPPED ANSWER. A server that
 * accepted the connection is running; what it is doing is its first request, and on a cold dev
 * server that is expensive — vite compiles the root layout and the page on demand, and the page's
 * own load may then make its first call to a backend that is itself cold. So the check polls within
 * the budget a spec gives a page navigation (`navigationTimeout` in playwright.config.ts) rather
 * than reporting on one GET.
 *
 * A REFUSAL IS THE ONE VERDICT THAT DEPENDS ON WHO OWNS THE SERVER. When playwright manages it
 * (`webServer` in playwright.config.ts), playwright has ALREADY waited for the URL to answer before
 * this file runs, so a refusal here means not-yet and is waited out with every other failure. When
 * a developer runs the servers themselves, a refusal means they have not started one, and saying so
 * immediately with the command to run beats a silent wait.
 */

import type { FullConfig } from '@playwright/test';
import { config } from './config';
import { pollSummary, verdict, waitUntilUp } from './probe';

interface ServerCheck {
  name: string;
  url: string;
  description: string;
}

/** Used only when the project sets no `navigationTimeout` of its own. */
const DEFAULT_PROBE_TIMEOUT_MS = 30_000;

function probeTimeoutMs(playwrightConfig: FullConfig): number {
  return playwrightConfig.projects[0]?.use.navigationTimeout || DEFAULT_PROBE_TIMEOUT_MS;
}

/**
 * Check if a server is running and accessible.
 *
 * Any response at all (2xx, 3xx, 4xx, 5xx) means the server is up — an auth-protected endpoint
 * answering 401 is a running server.
 */
async function checkServer(check: ServerCheck, timeoutMs: number, retryRefused: boolean): Promise<boolean> {
  const readiness = await waitUntilUp(check.url, timeoutMs, { retryRefused });
  if (readiness.result.kind === 'up') {
    console.log(`✅ ${check.name} is running at ${check.url}`);
    return true;
  }
  console.error('');
  console.error(`❌ ${check.name} is not answering: ${check.url}`);
  console.error(`   ${verdict(readiness.result)}`);
  console.error(`   ${pollSummary(readiness)}`);
  if (readiness.result.kind === 'refused') console.error(`   ${check.description}`);
  return false;
}

/**
 * Global setup function
 * Playwright will run this once before all tests
 *
 * Set SKIP_DEPENDENCY_CHECK=true to skip server checks
 */
export default async function globalSetup(playwrightConfig: FullConfig): Promise<void> {
  // Allow skipping dependency check via environment variable
  if (process.env['SKIP_DEPENDENCY_CHECK'] === 'true') {
    console.log('\n⚠️  Skipping server dependency check (SKIP_DEPENDENCY_CHECK=true)\n');
    return;
  }

  // Define servers to check
  const servers: ServerCheck[] = [
    {
      name: 'Frontend',
      url: config.FRONTEND_BASE_URL,
      description: 'Start frontend with: npm run dev'
    },
    {
      name: 'Backend API',
      url: `${config.BACKEND_BASE_URL}/_internal_/healthcheck`,
      description: 'Start backend with: cd ~/code/platform; ./run.sh; project api; run'
    }
  ];

  const timeoutMs = probeTimeoutMs(playwrightConfig);
  const retryRefused = Boolean(playwrightConfig.webServer);

  // Check all servers
  const results = await Promise.all(
    servers.map(async (server) => ({
      server,
      isRunning: await checkServer(server, timeoutMs, retryRefused)
    }))
  );

  // Find failed servers
  const failedServers = results.filter((r) => !r.isRunning);

  if (failedServers.length > 0) {
    console.error('\nThe following servers did not answer:\n');

    failedServers.forEach(({ server }) => {
      console.error(`  • ${server.name}: ${server.url}`);
      console.error(`    → ${server.description}\n`);
    });

    // Exit with error code
    process.exit(1);
  }
}
