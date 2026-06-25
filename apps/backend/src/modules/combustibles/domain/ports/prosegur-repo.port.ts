/**
 * Repository port for Prosegur Excel imports.
 * Pure interface — no framework, no ORM, no HTTP dependencies.
 */

import type {
  ProsegurEntry,
  ProsegurImport,
  ProsegurImportStatus,
  ProsegurMaterialMap,
} from "../entities/combustibles.js";

// ---------------------------------------------------------------------------
// Prosegur imports
// ---------------------------------------------------------------------------

export interface ProsegurImportsRepository {
  createImport(data: {
    filename: string;
    status: ProsegurImportStatus;
    rowsTotal: number;
    rowsMapped: number;
    rowsUnmapped: number;
    errorMessage?: string;
  }): Promise<ProsegurImport>;

  listImports(): Promise<ProsegurImport[]>;

  getImportById(id: number): Promise<
    (ProsegurImport & { entries: ProsegurEntry[] }) | null
  >;
}

// ---------------------------------------------------------------------------
// Prosegur entries
// ---------------------------------------------------------------------------

export type DailySummaryItem = {
  mappedMaterialId: number;
  mappedProveedorId: number;
  count: number;
};

export type WeeklySummaryItem = {
  fecha: string;
  mappedMaterialId: number;
  mappedProveedorId: number;
  count: number;
};

export interface ProsegurEntriesRepository {
  createEntries(
    entries: Array<{
      importId: number;
      fecha: string;
      horaEntrada: string | null;
      horaSalida: string | null;
      dni: string | null;
      nombre: string | null;
      tarjeta: string | null;
      tractora: string | null;
      remolque: string | null;
      materialRaw: string;
      destinoRaw: string | null;
      fullSeguimentNo: string | null;
      mappedMaterialId: number | null;
      mappedProveedorId: number | null;
      status: "mapped" | "unmapped";
    }>
  ): Promise<ProsegurEntry[]>;

  listUnmapped(): Promise<ProsegurEntry[]>;

  mapEntry(
    entryId: number,
    materialId: number,
    proveedorId: number
  ): Promise<ProsegurEntry | null>;

  getDailySummary(date: string): Promise<DailySummaryItem[]>;

  getWeeklySummary(startDate: string, endDate: string): Promise<WeeklySummaryItem[]>;
}

// ---------------------------------------------------------------------------
// Prosegur material map
// ---------------------------------------------------------------------------

export interface ProsegurMaterialMapRepository {
  findByLabel(label: string): Promise<ProsegurMaterialMap | null>;

  listMaps(): Promise<ProsegurMaterialMap[]>;

  upsertMap(data: {
    prosegurLabel: string;
    materialId: number;
    proveedorId: number;
  }): Promise<ProsegurMaterialMap>;

  deleteMap(id: number): Promise<void>;
}
