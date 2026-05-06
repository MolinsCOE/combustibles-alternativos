import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for drizzle-kit commands");
}

export default {
  schema: [
    "./src/shared/infrastructure/db/schema/*.schema.ts",
    "./src/modules/*/infrastructure/db/*.schema.ts"
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
} satisfies Config;
