import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestApp } from "../helpers/build-test-app.js";

describe("API docs endpoints", () => {
  it("returns the OpenAPI document when ENABLE_SWAGGER=true", async () => {
    const app = buildTestApp({ ENABLE_SWAGGER: "true" });
    const response = await request(app).get("/openapi.json");
    const body = response.body as { openapi: string; paths: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(body.openapi).toBe("3.0.3");
    expect(body.paths).toHaveProperty("/health");
  });

  it("serves Swagger UI HTML", async () => {
    const app = buildTestApp({ ENABLE_SWAGGER: "true" });
    const response = await request(app).get("/docs");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("SwaggerUIBundle");
    expect(response.text).toContain("/openapi.json");
  });

  it("hides docs when ENABLE_SWAGGER=false", async () => {
    const app = buildTestApp({ ENABLE_SWAGGER: "false" });
    const response = await request(app).get("/openapi.json");
    expect(response.status).toBe(404);
  });
});
