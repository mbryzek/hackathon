/**
 * Global Setup for Playwright Tests
 * Runs once before all tests to verify dependencies
 *
 * FAILING FAST IS FOR A REFUSED CONNECTION, NOT A SLOW ANSWER. A server that accepted the
 * connection is running; what it is doing is its first request, and on a cold dev server that is
 * expensive — vite compiles the root layout and the page on demand, and the page's own load may
 * then make its first call to a backend that is itself cold. So a probe answers within the budget
 * a spec gives a page navigation (`navigationTimeout` in playwright.config.ts) rather than a fixed
 * few seconds, and a refusal still fails immediately, since it never waits on the timer at all.
 */

import type { FullConfig } from '@playwright/test';
import { config } from './config';
import { probe } from './probe';

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
async function checkServer(check: ServerCheck, timeoutMs: number): Promise<boolean> {
  const result = await probe(check.url, timeoutMs);
  if (result.kind === 'up') {
    console.log(`✅ ${check.name} is running at ${check.url}`);
    return true;
  }

  console.error('');
  switch (result.kind) {
    case 'timeout':
      console.error(`❌ ${check.name} timeout: ${check.url}`);
      console.error(`   Server accepted the connection but did not respond within ${result.timeoutMs / 1000} seconds`);
      break;
    case 'refused':
      console.error(`❌ ${check.name} connection refused: ${check.url}`);
      console.error(`   ${check.description}`);
      break;
    case 'error':
      console.error(`❌ ${check.name} error: ${result.message}`);
      console.error(`   URL: ${check.url}`);
      break;
  }

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

  // Check all servers
  const results = await Promise.all(
    servers.map(async (server) => ({
      server,
      isRunning: await checkServer(server, timeoutMs)
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
