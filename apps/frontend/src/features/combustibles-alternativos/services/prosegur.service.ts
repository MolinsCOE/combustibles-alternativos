import { z } from "zod";
import { httpClient } from "../../../shared/services/http-client.js";

const BASE = "/api/combustibles/prosegur";

// ---------------------------------------------------------------------------
// Zod schemas (mirror backend domain types)
// ---------------------------------------------------------------------------

export const prosegurImportSchema = z.object({
  id: z.number(),
  filename: z.string(),
  processedAt: z.string(),
  status: z.enum(["ok", "error", "partial"]),
  rowsTotal: z.number().nullable(),
  rowsMapped: z.number().nullable(),
  rowsUnmapped: z.number().nullable(),
  errorMessage: z.string().nullable(),
});
export type ProsegurImport = z.infer<typeof prosegurImportSchema>;

export const prosegurEntrySchema = z.object({
  id: z.number(),
  importId: z.number(),
  fecha: z.string(),
  horaEntrada: z.string().nullable(),
  horaSalida: z.string().nullable(),
  dni: z.string().nullable(),
  nombre: z.string().nullable(),
  tarjeta: z.string().nullable(),
  tractora: z.string().nullable(),
  remolque: z.string().nullable(),
  materialRaw: z.string(),
  destinoRaw: z.string().nullable(),
  fullSeguimentNo: z.string().nullable(),
  mappedMaterialId: z.number().nullable(),
  mappedProveedorId: z.number().nullable(),
  status: z.enum(["mapped", "unmapped"]),
});
export type ProsegurEntry = z.infer<typeof prosegurEntrySchema>;

export const prosegurImportDetailSchema = prosegurImportSchema.extend({
  entries: z.array(prosegurEntrySchema),
});
export type ProsegurImportDetail = z.infer<typeof prosegurImportDetailSchema>;

export const prosegurMaterialMapSchema = z.object({
  id: z.number(),
  prosegurLabel: z.string(),
  materialId: z.number(),
  proveedorId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProsegurMaterialMap = z.infer<typeof prosegurMaterialMapSchema>;

export const dailySummaryItemSchema = z.object({
  mappedMaterialId: z.number(),
  mappedProveedorId: z.number(),
  count: z.number(),
});
export type DailySummaryItem = z.infer<typeof dailySummaryItemSchema>;

export const weeklySummaryItemSchema = z.object({
  fecha: z.string(),
  mappedMaterialId: z.number(),
  mappedProveedorId: z.number(),
  count: z.number(),
});
export type WeeklySummaryItem = z.infer<typeof weeklySummaryItemSchema>;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const prosegurService = {
  listImports: () =>
    httpClient.get(`${BASE}/imports`, z.array(prosegurImportSchema)),

  getImportDetail: (id: number) =>
    httpClient.get(`${BASE}/imports/${id}`, prosegurImportDetailSchema),

  listUnmapped: () =>
    httpClient.get(`${BASE}/unmapped`, z.array(prosegurEntrySchema)),

  mapEntry: (
    entryId: number,
    data: { materialId: number; proveedorId: number; saveMapping: boolean; prosegurLabel: string }
  ) =>
    httpClient.post(`${BASE}/entries/${entryId}/map`, data, prosegurEntrySchema),

  listMaps: () =>
    httpClient.get(`${BASE}/maps`, z.array(prosegurMaterialMapSchema)),

  upsertMap: (data: { prosegurLabel: string; materialId: number; proveedorId: number }) =>
    httpClient.post(`${BASE}/maps`, data, prosegurMaterialMapSchema),

  deleteMap: (id: number) =>
    httpClient.delete(`${BASE}/maps/${id}`),

  runImport: () =>
    httpClient.post(
      `${BASE}/run`,
      {},
      z.object({ results: z.array(z.object({ filename: z.string(), total: z.number(), mapped: z.number(), unmapped: z.number() })) })
    ),

  uploadFile: (filename: string, content: string) =>
    httpClient.post(
      `${BASE}/upload`,
      { filename, content },
      z.object({ filename: z.string(), total: z.number(), mapped: z.number(), unmapped: z.number() })
    ),

  getDailySummary: (date: string) =>
    httpClient.get(`${BASE}/daily-summary?date=${date}`, z.array(dailySummaryItemSchema)),

  getWeeklySummary: (startDate: string, endDate: string) =>
    httpClient.get(
      `${BASE}/weekly-summary?startDate=${startDate}&endDate=${endDate}`,
      z.array(weeklySummaryItemSchema)
    ),
};
