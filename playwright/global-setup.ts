/**
 * Global Setup for Playwright Tests
 * Runs once before all tests to verify dependencies
 */

import { config } from "./config";

interface ServerCheck {
  name: string;
  url: string;
  description: string;
}

/**
 * Check if a server is running and accessible
 */
async function checkServer(check: ServerCheck): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(check.url, {
      signal: controller.signal,
      method: "GET",
    });

    clearTimeout(timeoutId);

    // Accept any response (2xx, 3xx, 4xx, 5xx) as long as server responds
    // This allows for auth-protected endpoints to return 401/403
    if (response) {
      console.log(`✅ ${check.name} is running at ${check.url}`);
      return true;
    }

    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("");
    if (errorMessage.includes("aborted")) {
      console.error(`❌ ${check.name} timeout: ${check.url}`);
      console.error(`   Server did not respond within 5 seconds`);
    } else if (errorMessage.includes("ECONNREFUSED")) {
      console.error(`❌ ${check.name} connection refused: ${check.url}`);
      console.error(`   ${check.description}`);
    } else {
      console.error(`❌ ${check.name} error: ${errorMessage}`);
      console.error(`   URL: ${check.url}`);
    }

    return false;
  }
}

/**
 * Global setup function
 * Playwright will run this once before all tests
 *
 * Set SKIP_DEPENDENCY_CHECK=true to skip server checks
 */
export default async function globalSetup() {
  // Allow skipping dependency check via environment variable
  if (process.env.SKIP_DEPENDENCY_CHECK === "true") {
    console.log(
      "\n⚠️  Skipping server dependency check (SKIP_DEPENDENCY_CHECK=true)\n",
    );
    return;
  }

  // Define servers to check
  const servers: ServerCheck[] = [
    {
      name: "Frontend",
      url: config.FRONTEND_BASE_URL,
      description: "Start frontend with: npm run dev",
    },
    {
      name: "Backend API",
      url: `${config.BACKEND_BASE_URL}/_internal_/healthcheck`,
      description:
        "Start backend with: cd ~/code/platform; ./run.sh; project api; run",
    },
  ];

  // Check all servers
  const results = await Promise.all(
    servers.map(async (server) => ({
      server,
      isRunning: await checkServer(server),
    })),
  );

  // Find failed servers
  const failedServers = results.filter((r) => !r.isRunning);

  if (failedServers.length > 0) {
    console.error("\nThe following servers are not running:\n");

    failedServers.forEach(({ server }) => {
      console.error(`  • ${server.name}: ${server.url}`);
      console.error(`    → ${server.description}\n`);
    });

    // Exit with error code
    process.exit(1);
  }
}
