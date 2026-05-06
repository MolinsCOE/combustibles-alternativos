import type { RequestHandler } from "express";
import type { ZodTypeAny, z } from "zod";
import { ValidationError } from "../../../errors/domain-error.js";

type Part = "body" | "params" | "query" | "headers";

/**
 * Zod validator for Express. Validates the selected request part and
 * replaces it with the parsed (and coerced) value. On failure it raises
 * a `ValidationError` that the error middleware maps to 422.
 */
export function validate<S extends ZodTypeAny>(part: Part, schema: S): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const detail = result.error.issues
        .map((i) => `${i.path.join(".") || part}: ${i.message}`)
        .join("; ");
      next(new ValidationError(`Invalid ${part}: ${detail}`));
      return;
    }
    // Express 5 makes `req.query` a getter-only property, so we must
    // redefine the property descriptor instead of assigning directly.
    Object.defineProperty(req, part, {
      value: result.data as z.infer<S>,
      writable: true,
      configurable: true,
      enumerable: true
    });
    next();
  };
}
