import { describe, expect, it } from "vitest";
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError
} from "../../src/shared/errors/domain-error.js";

describe("DomainError subclasses", () => {
  it("NotFoundError maps to 404", () => {
    const err = new NotFoundError("missing");
    expect(err).toBeInstanceOf(DomainError);
    expect(err.httpStatus).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("missing");
  });

  it("ConflictError maps to 409", () => {
    const err = new ConflictError("conflict");
    expect(err.httpStatus).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("ValidationError maps to 422", () => {
    const err = new ValidationError("invalid");
    expect(err.httpStatus).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  it("UnauthorizedError maps to 401", () => {
    const err = new UnauthorizedError("nope");
    expect(err.httpStatus).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("ForbiddenError maps to 403", () => {
    const err = new ForbiddenError("nope");
    expect(err.httpStatus).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });
});
