import { defineConfig } from "@playwright/test";

// End-to-end tests for the interactive behaviors (drag, resize, keyboard,
// cross-grid, external-drop, nested, responsive) that unit tests can't cover —
// driven against the live docs examples + showcase.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Cap workers so a handful of cold `next dev` page compiles don't contend under
  // high parallelism (the Svelte pages made cold compiles heavier).
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? "github" : "list",
  // Pre-compile the driven routes so the first cross-page navigation isn't a slow
  // cold compile mid-test.
  globalSetup: "./e2e/global-setup.ts",
  // A generous per-test budget: the interaction is fast, but a cold page load under
  // `next dev` can be slow.
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 1200 },
    trace: "on-first-retry",
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/showcase/",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
