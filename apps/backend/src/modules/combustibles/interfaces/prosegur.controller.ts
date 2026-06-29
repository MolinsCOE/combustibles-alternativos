/**
 * Thin controller for Prosegur endpoints.
 * No business logic here — delegates to use cases.
 * All handlers are typed as RequestHandler to satisfy Express 5 strict overloads.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { RequestHandler } from "express";
import { z } from "zod";
import { parseFile } from "../infrastructure/prosegur/prosegur-excel.parser.js";
import type {
  DeleteMapUseCase,
  GetDailySummaryUseCase,
  GetMapsUseCase,
  GetProsegurImportDetailUseCase,
  GetProsegurImportsUseCase,
  GetUnmappedEntriesUseCase,
  GetWeeklySummaryUseCase,
  ImportProsegurFilesUseCase,
  MapEntryUseCase,
  RunProsegurImportUseCase,
  UpsertMapUseCase,
} from "../application/use-cases/prosegur.use-cases.js";
import type { DailySummaryQuery, MapEntryBody, ProsegurIdParam, UpsertMapBody, WeeklySummaryQuery } from "./prosegur.schemas.js";

const uploadBodySchema = z.object({
  filename: z.string().min(1),
  content: z.string().min(1), // base64
});

export type ProsegurControllerDeps = {
  getProsegurImports: GetProsegurImportsUseCase;
  getProsegurImportDetail: GetProsegurImportDetailUseCase;
  getUnmappedEntries: GetUnmappedEntriesUseCase;
  mapEntry: MapEntryUseCase;
  getMaps: GetMapsUseCase;
  upsertMap: UpsertMapUseCase;
  deleteMap: DeleteMapUseCase;
  runImport: RunProsegurImportUseCase;
  importFiles: ImportProsegurFilesUseCase;
  getDailySummary: GetDailySummaryUseCase;
  getWeeklySummary: GetWeeklySummaryUseCase;
  watchDir: string;
};

export class ProsegurController {
  constructor(private readonly deps: ProsegurControllerDeps) {}

  readonly listImports: RequestHandler = async (_req, res, next) => {
    try {
      const imports = await this.deps.getProsegurImports.execute();
      res.json(imports);
    } catch (err) {
      next(err);
    }
  };

  readonly getImportDetail: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as ProsegurIdParam;
      const result = await this.deps.getProsegurImportDetail.execute(id);
      if (!result) {
        res.status(404).json({ code: "NOT_FOUND", message: "Import not found" });
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly listUnmapped: RequestHandler = async (_req, res, next) => {
    try {
      const entries = await this.deps.getUnmappedEntries.execute();
      res.json(entries);
    } catch (err) {
      next(err);
    }
  };

  readonly mapEntry: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as ProsegurIdParam;
      const { materialId, proveedorId, saveMapping, prosegurLabel } =
        req.body as MapEntryBody;
      const label = prosegurLabel ?? "";
      const updated = await this.deps.mapEntry.execute(
        id,
        materialId,
        proveedorId,
        saveMapping,
        label
      );
      if (!updated) {
        res.status(404).json({ code: "NOT_FOUND", message: "Entry not found" });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  readonly listMaps: RequestHandler = async (_req, res, next) => {
    try {
      const maps = await this.deps.getMaps.execute();
      res.json(maps);
    } catch (err) {
      next(err);
    }
  };

  readonly upsertMap: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as UpsertMapBody;
      const map = await this.deps.upsertMap.execute(body);
      res.status(200).json(map);
    } catch (err) {
      next(err);
    }
  };

  readonly deleteMap: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as ProsegurIdParam;
      await this.deps.deleteMap.execute(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  readonly runImport: RequestHandler = async (_req, res, next) => {
    try {
      const results = await this.deps.runImport.execute(this.deps.watchDir);
      res.json({ results });
    } catch (err) {
      next(err);
    }
  };

  // Recibe { filename, content: base64 }, parsea y guarda en BD
  readonly uploadFile: RequestHandler = async (req, res, next) => {
    let tmpPath: string | null = null;
    try {
      const { filename, content } = uploadBodySchema.parse(req.body);
      const buf = Buffer.from(content, "base64");
      tmpPath = path.join(os.tmpdir(), `prosegur_${Date.now()}_${filename}`);
      fs.writeFileSync(tmpPath, buf);
      const rows = parseFile(tmpPath);
      const results = await this.deps.importFiles.execute([{ filename, rows }]);
      res.status(200).json(results[0] ?? { filename, total: 0, mapped: 0, unmapped: 0 });
    } catch (err) {
      next(err);
    } finally {
      if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  };

  readonly getDailySummary: RequestHandler = async (req, res, next) => {
    try {
      const { date } = req.query as unknown as DailySummaryQuery;
      const summary = await this.deps.getDailySummary.execute(date);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  };

  readonly getWeeklySummary: RequestHandler = async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query as unknown as WeeklySummaryQuery;
      const summary = await this.deps.getWeeklySummary.execute(startDate, endDate);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  };
}
