import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3000"
  },
  webServer: {
    command: "pnpm run build && pnpm run start",
    url: "http://127.0.0.1:3000/health",
    reuseExistingServer: true,
    timeout: 120000
  }
});
