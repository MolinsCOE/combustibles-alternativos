import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.ts"],
    exclude: ["__tests__/e2e/**"],
    environment: "node",
    globals: true,
    // Integration tests share a single Testcontainers-managed Postgres and
    // truncate the `roles`/`usuarios` tables between runs. Parallel file
    // execution would cause one file's truncate to wipe another's state.
    fileParallelism: false,
    globalSetup: ["./__tests__/setup/testcontainers.global-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/main/server.ts", "src/shared/infrastructure/db/schema/**"],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90
      }
    }
  }
});
