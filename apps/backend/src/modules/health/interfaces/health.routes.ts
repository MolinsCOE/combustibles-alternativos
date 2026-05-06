import { Router } from "express";
import type { HealthController } from "./health.controller.js";

export function buildHealthRouter(controller: HealthController): Router {
  const router = Router();
  router.get("/health", controller.get);
  return router;
}
