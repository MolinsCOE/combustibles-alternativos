import express, { type Router } from "express";
import cors from "cors";
import type { Env } from "./config/env.js";
import { getSwaggerUiHtml, openApiDocument } from "./config/openapi.js";
import { errorHandler } from "../shared/interfaces/http/middleware/error-handler.js";

export type BuildAppOptions = {
  env: Env;
  routers: Router[];
};

/**
 * Builds the Express application. Pure assembly: receives already-wired
 * routers from the composition root and mounts them, plus the shared
 * middleware stack (json parser, docs, error handler).
 */
export function buildApp({ env, routers }: BuildAppOptions) {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin:
        env.NODE_ENV === "production"
          ? false
          : (origin, cb) => cb(null, true), // allow all localhost origins in dev
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json({ limit: "100kb" }));

  if (env.ENABLE_SWAGGER) {
    app.get("/openapi.json", (_req, res) => {
      res.status(200).json(openApiDocument);
    });
    app.get("/docs", (_req, res) => {
      res.status(200).type("html").send(getSwaggerUiHtml("/openapi.json"));
    });
  }

  for (const router of routers) {
    app.use(router);
  }

  app.use(errorHandler);

  return app;
}
