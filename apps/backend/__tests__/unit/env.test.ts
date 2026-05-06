import { describe, expect, it } from "vitest";
import { loadEnv } from "../../src/main/config/env.js";

describe("loadEnv", () => {
  it("applies defaults when optional values are missing", () => {
    const env = loadEnv({});
    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(3000);
    expect(env.ENABLE_SWAGGER).toBe(true);
  });

  it("coerces PORT from string", () => {
    const env = loadEnv({ PORT: "4000" });
    expect(env.PORT).toBe(4000);
  });

  it("rejects invalid NODE_ENV", () => {
    expect(() => loadEnv({ NODE_ENV: "staging" })).toThrowError(/Invalid environment/);
  });

  it("parses ENABLE_SWAGGER=false", () => {
    const env = loadEnv({ ENABLE_SWAGGER: "false" });
    expect(env.ENABLE_SWAGGER).toBe(false);
  });
});
