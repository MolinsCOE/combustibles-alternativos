import { Router } from "express";
import { validate } from "../../../shared/interfaces/http/middleware/validate.js";
import type { ProsegurController } from "./prosegur.controller.js";
import {
  dailySummaryQuerySchema,
  mapEntryBodySchema,
  prosegurIdParamSchema,
  upsertMapBodySchema,
  weeklySummaryQuerySchema,
} from "./prosegur.schemas.js";

export function buildProsegurRouter(controller: ProsegurController): Router {
  const r = Router();

  // GET  /api/combustibles/prosegur/imports
  r.get("/api/combustibles/prosegur/imports", controller.listImports);

  // GET  /api/combustibles/prosegur/imports/:id
  r.get(
    "/api/combustibles/prosegur/imports/:id",
    validate("params", prosegurIdParamSchema),
    controller.getImportDetail
  );

  // GET  /api/combustibles/prosegur/unmapped
  r.get("/api/combustibles/prosegur/unmapped", controller.listUnmapped);

  // POST /api/combustibles/prosegur/entries/:id/map
  r.post(
    "/api/combustibles/prosegur/entries/:id/map",
    validate("params", prosegurIdParamSchema),
    validate("body", mapEntryBodySchema),
    controller.mapEntry
  );

  // GET  /api/combustibles/prosegur/maps
  r.get("/api/combustibles/prosegur/maps", controller.listMaps);

  // POST /api/combustibles/prosegur/maps
  r.post(
    "/api/combustibles/prosegur/maps",
    validate("body", upsertMapBodySchema),
    controller.upsertMap
  );

  // DELETE /api/combustibles/prosegur/maps/:id
  r.delete(
    "/api/combustibles/prosegur/maps/:id",
    validate("params", prosegurIdParamSchema),
    controller.deleteMap
  );

  // POST /api/combustibles/prosegur/run  (manual trigger for testing)
  r.post("/api/combustibles/prosegur/run", controller.runImport);

  // POST /api/combustibles/prosegur/upload  (subida directa de fichero XLS en base64)
  r.post("/api/combustibles/prosegur/upload", controller.uploadFile);

  // GET  /api/combustibles/prosegur/daily-summary?date=yyyy-mm-dd
  r.get(
    "/api/combustibles/prosegur/daily-summary",
    validate("query", dailySummaryQuerySchema),
    controller.getDailySummary
  );

  // GET  /api/combustibles/prosegur/weekly-summary?startDate=yyyy-mm-dd&endDate=yyyy-mm-dd
  r.get(
    "/api/combustibles/prosegur/weekly-summary",
    validate("query", weeklySummaryQuerySchema),
    controller.getWeeklySummary
  );

  return r;
}
