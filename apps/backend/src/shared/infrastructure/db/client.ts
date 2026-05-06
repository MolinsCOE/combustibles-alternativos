import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.js";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

export function createDb(connectionString: string | undefined = process.env.DATABASE_URL): Db {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}
