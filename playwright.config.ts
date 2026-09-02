import { defineConfig, devices } from "@playwright/test";

const PORT = 5199;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Minimal e2e setup — one Chromium project, the dev server booted on demand.
 * Covers the pipeline → Worker → render path that has no unit coverage.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1600, height: 1000 } },
    },
  ],
  webServer: {
    command: `yarn dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
