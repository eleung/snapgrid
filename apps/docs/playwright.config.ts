import { defineConfig } from "@playwright/test";

// End-to-end tests for the interactive behaviors (drag, resize, keyboard,
// cross-grid, external-drop, nested, responsive) that unit tests can't cover —
// driven against the live docs examples + showcase.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 1200 },
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/showcase/",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
