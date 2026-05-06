import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  ConflictError,
  NotFoundError
} from "../../src/shared/errors/domain-error.js";
import { errorHandler } from "../../src/shared/interfaces/http/middleware/error-handler.js";
import { validate } from "../../src/shared/interfaces/http/middleware/validate.js";

describe("error-handler middleware", () => {
  it("maps DomainError to its httpStatus and payload", async () => {
    const app = express();
    app.get("/not-found", (_req, _res, next) => {
      next(new NotFoundError("thing missing"));
    });
    app.get("/conflict", (_req, _res, next) => {
      next(new ConflictError("dup"));
    });
    app.use(errorHandler);

    const nf = await request(app).get("/not-found");
    expect(nf.status).toBe(404);
    expect(nf.body).toEqual({ code: "NOT_FOUND", message: "thing missing" });

    const cf = await request(app).get("/conflict");
    expect(cf.status).toBe(409);
    expect(cf.body).toEqual({ code: "CONFLICT", message: "dup" });
  });

  it("returns generic 500 for unknown errors and logs server-side", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = express();
    app.get("/boom", (_req, _res, next) => {
      next(new Error("boom"));
    });
    app.use(errorHandler);

    const res = await request(app).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: "INTERNAL_ERROR", message: "Internal server error" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("validate middleware", () => {
  const schema = z.object({ name: z.string().min(1), age: z.coerce.number().int() });

  function makeApp() {
    const app = express();
    app.use(express.json());
    app.post("/users", validate("body", schema), (req, res) => {
      res.json(req.body);
    });
    app.use(errorHandler);
    return app;
  }

  it("passes and coerces valid input", async () => {
    const res = await request(makeApp())
      .post("/users")
      .send({ name: "ana", age: "33" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "ana", age: 33 });
  });

  it("returns 422 with details on invalid input", async () => {
    const res = await request(makeApp())
      .post("/users")
      .send({ name: "", age: "x" });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      code: "VALIDATION_ERROR",
      message: expect.stringMatching(/Invalid body/) as unknown as string
    });
  });
});
