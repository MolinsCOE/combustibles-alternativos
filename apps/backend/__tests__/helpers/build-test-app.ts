import type { Express } from "express";
import { composeApp } from "../../src/main/composition-root.js";
import { loadEnv } from "../../src/main/config/env.js";
import { createDb, type Db } from "../../src/shared/infrastructure/db/client.js";

function resolveTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Testcontainers global setup must run first."
    );
  }
  return url;
}

/**
 * Builds a fully wired Express app for integration tests pointing at the
 * Testcontainers-managed Postgres instance. Uses the real composition root
 * so tests validate the same wiring as production.
 */
export function buildTestApp(overrides: Record<string, string | undefined> = {}): Express {
  return buildTestComposedApp(overrides).app;
}

export function buildTestComposedApp(
  overrides: Record<string, string | undefined> = {}
): { app: Express; db: Db } {
  const databaseUrl = resolveTestDatabaseUrl();
  const env = loadEnv({
    NODE_ENV: "test",
    PORT: "0",
    DATABASE_URL: databaseUrl,
    ...overrides
  });
  const db = createDb(databaseUrl);
  const composed = composeApp(env, { db });
  return { app: composed.app, db: composed.db };
}
