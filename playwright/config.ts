/**
 * Playwright Test Configuration
 * Shared configuration for all Private Dinkers tests
 */

import type { TestConfig } from "./types";

export const config: TestConfig = {
  // Frontend server URL
  // Can be overridden with FRONTEND_BASE_URL or legacy BASE_URL env var
  FRONTEND_BASE_URL:
    process.env.FRONTEND_BASE_URL ||
    process.env.BASE_URL ||
    "http://localhost:5173",

  // Backend API server URL
  // Can be overridden with BACKEND_BASE_URL env var
  BACKEND_BASE_URL: process.env.BACKEND_BASE_URL || "http://localhost:9300",

  // Tenant ID used for all playwright API calls
  TENANT_ID: "vote",

  // Browser configuration
  BROWSER_CONFIG: {
    headless: process.env.HEADLESS === "true", // Default false (visible), set HEADLESS=true for headless
    slowMo: process.env.HEADLESS === "true" ? 0 : 50, // Slow down by 50ms only for visible mode
    viewport: { width: 1920, height: 1080 },
  },

  // Timeouts
  TIMEOUTS: {
    default: 5000,
    navigation: 10000,
    action: 5000,
  },

  // Screenshot settings
  SCREENSHOTS: {
    enabled: process.env.SCREENSHOTS === "true", // Default false, set SCREENSHOTS=true to enable
    path: process.env.TEST_RUN_DIR
      ? `${process.env.TEST_RUN_DIR}/screenshots`
      : "/tmp/playwright-screenshots", // Fallback for backward compatibility
    fullPage: true,
  },
};
