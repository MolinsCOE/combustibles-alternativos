import { describe, expect, it } from "vitest";
import { createDb } from "../../src/shared/infrastructure/db/client.js";

describe("db client env validation", () => {
  it("throws when DATABASE_URL is not defined", () => {
    expect(() => createDb(undefined)).toThrowError("DATABASE_URL is required");
  });

  it("loads when DATABASE_URL is defined", () => {
    expect(() => createDb("postgresql://app:app@localhost:5432/app")).not.toThrow();
  });
});
