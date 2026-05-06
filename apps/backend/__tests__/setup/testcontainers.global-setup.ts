import path from "node:path";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export default async function globalSetup(): Promise<() => Promise<void>> {
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("app")
    .withUsername("app")
    .withPassword("app")
    .start();

  const connectionUri = container.getConnectionUri();
  process.env.TEST_DATABASE_URL = connectionUri;

  // Apply generated SQL migrations so integration tests start against a
  // schema identical to production.
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(thisDir, "../../drizzle");

  const pool = new Pool({ connectionString: connectionUri });
  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }

  return async () => {
    await container.stop();
  };
}
