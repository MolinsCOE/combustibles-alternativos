import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

describe("database integration", () => {
  it("connects to PostgreSQL from testcontainers setup", async () => {
    const testUrl = process.env.TEST_DATABASE_URL;

    expect(testUrl).toBeDefined();

    const { createDb } = await import("../../src/shared/infrastructure/db/client.js");
    const db = createDb(testUrl);
    const result = await db.execute(sql`select 1 as ok`);
    const row = result.rows[0] as { ok?: number } | undefined;

    expect(row?.ok).toBe(1);
  });
});
