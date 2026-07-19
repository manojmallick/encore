import { defineConfig, devices } from "@playwright/test";

import { resolveProductionSmokeTarget } from "./tests/smoke/smoke-target";

const target = resolveProductionSmokeTarget(process.env);

export default defineConfig({
  testDir: "./tests/smoke",
  testMatch: "production.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: "line",
  outputDir: "output/playwright/smoke-results",
  use: {
    baseURL: target.baseURL,
    extraHTTPHeaders: target.extraHTTPHeaders,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "production-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
