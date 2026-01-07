/**
 * TypeScript Type Definitions for Private Dinkers Tests
 * Shared types used across all test files
 */

import type { BrowserContext, Page } from "@playwright/test";

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
  TENANT_ID: string;
  BROWSER_CONFIG: BrowserConfig;
  TIMEOUTS: TimeoutConfig;
  SCREENSHOTS: ScreenshotConfig;
}

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
