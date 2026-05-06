import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../helpers/build-test-app.js";

describe("GET /health", () => {
  it("returns a healthy status", async () => {
    const app = buildTestApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
