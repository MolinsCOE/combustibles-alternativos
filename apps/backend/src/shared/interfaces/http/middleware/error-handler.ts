import type { ErrorRequestHandler } from "express";
import { DomainError } from "../../../errors/domain-error.js";

/**
 * Centralized error middleware. Maps domain errors to HTTP with stable
 * `{ code, message }` payloads. Unexpected errors become 500 with a
 * generic message; full details go to server logs only.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    res.status(err.httpStatus).json({ code: err.code, message: err.message });
    return;
  }

  // Log the full error server-side; never expose stack traces or internal paths.
  console.error("[unhandled-error]", err);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
};
