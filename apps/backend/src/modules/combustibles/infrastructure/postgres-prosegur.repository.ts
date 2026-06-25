/**
 * Drizzle/PostgreSQL implementation of the Prosegur repository ports.
 */

import { and, between, eq, sql } from "drizzle-orm";
import type { Db } from "../../../shared/infrastructure/db/client.js";
import {
  caProsegurEntriesTable,
  caProsegurImportsTable,
  caProsegurMaterialMapTable,
} from "./db/combustibles.schema.js";
import type {
  ProsegurEntry,
  ProsegurImport,
  ProsegurImportStatus,
  ProsegurMaterialMap,
} from "../domain/entities/combustibles.js";
import type {
  DailySummaryItem,
  WeeklySummaryItem,
  ProsegurEntriesRepository,
  ProsegurImportsRepository,
  ProsegurMaterialMapRepository,
} from "../domain/ports/prosegur-repo.port.js";

// ---------------------------------------------------------------------------
// Helpers — row → domain
// ---------------------------------------------------------------------------

function rowToImport(row: typeof caProsegurImportsTable.$inferSelect): ProsegurImport {
  return {
    id: row.id,
    filename: row.filename,
    processedAt: row.processedAt instanceof Date
      ? row.processedAt.toISOString()
      : String(row.processedAt),
    status: row.status as ProsegurImportStatus,
    rowsTotal: row.rowsTotal ?? null,
    rowsMapped: row.rowsMapped ?? null,
    rowsUnmapped: row.rowsUnmapped ?? null,
    errorMessage: row.errorMessage ?? null,
  };
}

function rowToEntry(row: typeof caProsegurEntriesTable.$inferSelect): ProsegurEntry {
  return {
    id: row.id,
    importId: row.importId,
    fecha: String(row.fecha),
    horaEntrada: row.horaEntrada ?? null,
    horaSalida: row.horaSalida ?? null,
    dni: row.dni ?? null,
    nombre: row.nombre ?? null,
    tarjeta: row.tarjeta ?? null,
    tractora: row.tractora ?? null,
    remolque: row.remolque ?? null,
    materialRaw: row.materialRaw,
    destinoRaw: row.destinoRaw ?? null,
    fullSeguimentNo: row.fullSeguimentNo ?? null,
    mappedMaterialId: row.mappedMaterialId ?? null,
    mappedProveedorId: row.mappedProveedorId ?? null,
    status: row.status,
  };
}

function rowToMap(row: typeof caProsegurMaterialMapTable.$inferSelect): ProsegurMaterialMap {
  return {
    id: row.id,
    prosegurLabel: row.prosegurLabel,
    materialId: row.materialId,
    proveedorId: row.proveedorId,
    createdAt: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : String(row.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Imports repository
// ---------------------------------------------------------------------------

export class PostgresProsegurImportsRepository implements ProsegurImportsRepository {
  constructor(private readonly db: Db) {}

  async createImport(data: {
    filename: string;
    status: ProsegurImportStatus;
    rowsTotal: number;
    rowsMapped: number;
    rowsUnmapped: number;
    errorMessage?: string;
  }): Promise<ProsegurImport> {
    const [row] = await this.db
      .insert(caProsegurImportsTable)
      .values({
        filename: data.filename,
        status: data.status,
        rowsTotal: data.rowsTotal,
        rowsMapped: data.rowsMapped,
        rowsUnmapped: data.rowsUnmapped,
        errorMessage: data.errorMessage ?? null,
      })
      .returning();

    if (!row) throw new Error("Failed to create prosegur import record");
    return rowToImport(row);
  }

  async listImports(): Promise<ProsegurImport[]> {
    const rows = await this.db
      .select()
      .from(caProsegurImportsTable)
      .orderBy(caProsegurImportsTable.processedAt);
    return rows.map(rowToImport);
  }

  async getImportById(
    id: number
  ): Promise<(ProsegurImport & { entries: ProsegurEntry[] }) | null> {
    const [row] = await this.db
      .select()
      .from(caProsegurImportsTable)
      .where(eq(caProsegurImportsTable.id, id));

    if (!row) return null;

    const entries = await this.db
      .select()
      .from(caProsegurEntriesTable)
      .where(eq(caProsegurEntriesTable.importId, id));

    return { ...rowToImport(row), entries: entries.map(rowToEntry) };
  }
}

// ---------------------------------------------------------------------------
// Entries repository
// ---------------------------------------------------------------------------

export class PostgresProsegurEntriesRepository implements ProsegurEntriesRepository {
  constructor(private readonly db: Db) {}

  async createEntries(
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
  ): Promise<ProsegurEntry[]> {
    if (entries.length === 0) return [];

    const rows = await this.db
      .insert(caProsegurEntriesTable)
      .values(
        entries.map((e) => ({
          importId: e.importId,
          fecha: e.fecha,
          horaEntrada: e.horaEntrada,
          horaSalida: e.horaSalida,
          dni: e.dni,
          nombre: e.nombre,
          tarjeta: e.tarjeta,
          tractora: e.tractora,
          remolque: e.remolque,
          materialRaw: e.materialRaw,
          destinoRaw: e.destinoRaw,
          fullSeguimentNo: e.fullSeguimentNo,
          mappedMaterialId: e.mappedMaterialId,
          mappedProveedorId: e.mappedProveedorId,
          status: e.status,
        }))
      )
      .returning();

    return rows.map(rowToEntry);
  }

  async listUnmapped(): Promise<ProsegurEntry[]> {
    const rows = await this.db
      .select()
      .from(caProsegurEntriesTable)
      .where(eq(caProsegurEntriesTable.status, "unmapped"));
    return rows.map(rowToEntry);
  }

  async mapEntry(
    entryId: number,
    materialId: number,
    proveedorId: number
  ): Promise<ProsegurEntry | null> {
    const [row] = await this.db
      .update(caProsegurEntriesTable)
      .set({
        mappedMaterialId: materialId,
        mappedProveedorId: proveedorId,
        status: "mapped",
      })
      .where(eq(caProsegurEntriesTable.id, entryId))
      .returning();

    return row ? rowToEntry(row) : null;
  }

  async getDailySummary(date: string): Promise<DailySummaryItem[]> {
    const rows = await this.db
      .select({
        mappedMaterialId: caProsegurEntriesTable.mappedMaterialId,
        mappedProveedorId: caProsegurEntriesTable.mappedProveedorId,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(caProsegurEntriesTable)
      .where(
        and(
          eq(caProsegurEntriesTable.fecha, date),
          eq(caProsegurEntriesTable.status, "mapped")
        )
      )
      .groupBy(
        caProsegurEntriesTable.mappedMaterialId,
        caProsegurEntriesTable.mappedProveedorId
      );

    return rows
      .filter(
        (r): r is { mappedMaterialId: number; mappedProveedorId: number; count: number } =>
          r.mappedMaterialId !== null && r.mappedProveedorId !== null
      )
      .map((r) => ({
        mappedMaterialId: r.mappedMaterialId,
        mappedProveedorId: r.mappedProveedorId,
        count: r.count,
      }));
  }

  async getWeeklySummary(startDate: string, endDate: string): Promise<WeeklySummaryItem[]> {
    const rows = await this.db
      .select({
        fecha: caProsegurEntriesTable.fecha,
        mappedMaterialId: caProsegurEntriesTable.mappedMaterialId,
        mappedProveedorId: caProsegurEntriesTable.mappedProveedorId,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(caProsegurEntriesTable)
      .where(
        and(
          between(caProsegurEntriesTable.fecha, startDate, endDate),
          eq(caProsegurEntriesTable.status, "mapped")
        )
      )
      .groupBy(
        caProsegurEntriesTable.fecha,
        caProsegurEntriesTable.mappedMaterialId,
        caProsegurEntriesTable.mappedProveedorId
      )
      .orderBy(caProsegurEntriesTable.fecha);

    return rows
      .filter(
        (r): r is { fecha: string; mappedMaterialId: number; mappedProveedorId: number; count: number } =>
          r.mappedMaterialId !== null && r.mappedProveedorId !== null
      )
      .map((r) => ({
        fecha: String(r.fecha),
        mappedMaterialId: r.mappedMaterialId,
        mappedProveedorId: r.mappedProveedorId,
        count: r.count,
      }));
  }
}

// ---------------------------------------------------------------------------
// Material map repository
// ---------------------------------------------------------------------------

export class PostgresProsegurMaterialMapRepository
  implements ProsegurMaterialMapRepository
{
  constructor(private readonly db: Db) {}

  async findByLabel(label: string): Promise<ProsegurMaterialMap | null> {
    const [row] = await this.db
      .select()
      .from(caProsegurMaterialMapTable)
      .where(eq(caProsegurMaterialMapTable.prosegurLabel, label));
    return row ? rowToMap(row) : null;
  }

  async listMaps(): Promise<ProsegurMaterialMap[]> {
    const rows = await this.db
      .select()
      .from(caProsegurMaterialMapTable)
      .orderBy(caProsegurMaterialMapTable.prosegurLabel);
    return rows.map(rowToMap);
  }

  async upsertMap(data: {
    prosegurLabel: string;
    materialId: number;
    proveedorId: number;
  }): Promise<ProsegurMaterialMap> {
    const existing = await this.findByLabel(data.prosegurLabel);

    if (existing) {
      const [row] = await this.db
        .update(caProsegurMaterialMapTable)
        .set({
          materialId: data.materialId,
          proveedorId: data.proveedorId,
          updatedAt: new Date(),
        })
        .where(eq(caProsegurMaterialMapTable.prosegurLabel, data.prosegurLabel))
        .returning();

      if (!row) throw new Error("Failed to update prosegur material map");
      return rowToMap(row);
    }

    const [row] = await this.db
      .insert(caProsegurMaterialMapTable)
      .values({
        prosegurLabel: data.prosegurLabel,
        materialId: data.materialId,
        proveedorId: data.proveedorId,
      })
      .returning();

    if (!row) throw new Error("Failed to create prosegur material map");
    return rowToMap(row);
  }

  async deleteMap(id: number): Promise<void> {
    await this.db
      .delete(caProsegurMaterialMapTable)
      .where(eq(caProsegurMaterialMapTable.id, id));
  }
}
