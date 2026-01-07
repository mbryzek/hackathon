/**
 * TypeScript Type Definitions for Private Dinkers Tests
 * Shared types used across all test files
 */

import type { BrowserContext, Page } from "@playwright/test";

// Import from generated API types
import type {
  TenantSession,
  User,
} from "../src/generated/com-bryzek-platform-v0";
import type {
  TestGame,
  TestGameForm,
  DeleteTestUsersForm,
  PlaywrightPasswordResetToken,
  TestGuestConnectionForm,
} from "./generated/com-bryzek-playwright-v0";
import { TestGameStatus } from "./generated/com-bryzek-playwright-v0";

// Import from API error handler
import type { ApiResponse } from "../src/lib/api/error-handler";

// Import GuestConnection from main app generated types
import type { GuestConnection } from "../src/generated/com-bryzek-privatedinkers-api-v0";

// Re-export generated types for convenience
export type {
  TenantSession,
  User,
  TestGame,
  TestGameForm,
  DeleteTestUsersForm,
  PlaywrightPasswordResetToken,
  TestGuestConnectionForm,
  GuestConnection,
  ApiResponse,
};

export { TestGameStatus };

/**
 * Test game configuration (for form filling in UI tests)
 */
export interface TestGameData {
  location: string;
  duration: number;
  numCourts: number;
  desiredNumPlayers: number;
}

/**
 * Browser configuration options
 */
export interface BrowserConfig {
  headless: boolean;
  slowMo: number;
  viewport: {
    width: number;
    height: number;
  };
}

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  default: number;
  navigation: number;
  action: number;
}

/**
 * Screenshot settings
 */
export interface ScreenshotConfig {
  enabled: boolean;
  path: string;
  fullPage: boolean;
}

/**
 * Main test configuration object
 */
export interface TestConfig {
  FRONTEND_BASE_URL: string;
  BACKEND_BASE_URL: string;
  TestEmailDomain: string;
  COMMUNITY_ID: string;
  BROWSER_CONFIG: BrowserConfig;
  TIMEOUTS: TimeoutConfig;
  SCREENSHOTS: ScreenshotConfig;
}

/**
 * Alias for TenantSession from generated types
 * Used for backward compatibility in test code
 */
export type SessionData = TenantSession;

/**
 * Wait for element options
 */
export interface WaitForElementOptions {
  timeout?: number;
  state?: "attached" | "detached" | "visible" | "hidden";
}

/**
 * Safe click options
 */
export interface SafeClickOptions {
  retries?: number;
  timeout?: number;
}

/**
 * Wait for API response options
 */
export interface WaitForAPIResponseOptions {
  timeout?: number;
  status?: number;
}

/**
 * Test summary extra information
 */
export interface TestSummaryExtraInfo {
  suites?: number;
  duration?: string;
  screenshots?: string;
}

/**
 * Test result structure for JSON output
 */
export interface TestResult {
  testFile: string;
  testName: string;
  status: "passed" | "failed";
  exitCode: number;
  testsPassed: number;
  testsFailed: number;
  duration: number;
  timestamp: string;
  errors: string[];
  screenshots: string[];
}

/**
 * Context that can be either BrowserContext or Page
 */
export type ContextOrPage = BrowserContext | Page;
