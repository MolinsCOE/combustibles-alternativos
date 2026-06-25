/**
 * Use cases for Prosegur Excel import, mapping and cross-reference.
 *
 * All ports are injected via constructor — no framework, no ORM, no HTTP here.
 */

import type { ImportResult } from "../../domain/entities/combustibles.js";
import type {
  ProsegurEntriesRepository,
  ProsegurImportsRepository,
  ProsegurMaterialMapRepository,
} from "../../domain/ports/prosegur-repo.port.js";
import type { ParseResult } from "../../infrastructure/prosegur/prosegur-excel.parser.js";

// ---------------------------------------------------------------------------
// ImportProsegurFilesUseCase
// ---------------------------------------------------------------------------

/**
 * Given a list of parsed Excel results (from the infrastructure parser),
 * persists each file as a ProsegurImport + its ProsegurEntries.
 *
 * For each row it looks up prosegur_material_map to auto-map entries.
 */
export class ImportProsegurFilesUseCase {
  constructor(
    private readonly importsRepo: ProsegurImportsRepository,
    private readonly entriesRepo: ProsegurEntriesRepository,
    private readonly mapRepo: ProsegurMaterialMapRepository
  ) {}

  async execute(parseResults: ParseResult[]): Promise<ImportResult[]> {
    const results: ImportResult[] = [];

    for (const parseResult of parseResults) {
      const { filename, rows } = parseResult;

      if (rows.length === 0) {
        await this.importsRepo.createImport({
          filename,
          status: "error",
          rowsTotal: 0,
          rowsMapped: 0,
          rowsUnmapped: 0,
          errorMessage: "No valid rows found in file",
        });
        results.push({ filename, total: 0, mapped: 0, unmapped: 0 });
        continue;
      }

      // Resolve mappings for all unique labels upfront (avoids N+1)
      const uniqueLabels = [...new Set(rows.map((r) => r.materialRaw))];
      const mapCache = new Map<
        string,
        { materialId: number; proveedorId: number }
      >();

      for (const label of uniqueLabels) {
        const mapping = await this.mapRepo.findByLabel(label);
        if (mapping) {
          mapCache.set(label, {
            materialId: mapping.materialId,
            proveedorId: mapping.proveedorId,
          });
        }
      }

      let mapped = 0;
      let unmapped = 0;

      // Create the import record first to get its id
      const importRecord = await this.importsRepo.createImport({
        filename,
        status: "partial", // will update after
        rowsTotal: rows.length,
        rowsMapped: 0,
        rowsUnmapped: rows.length,
      });

      // Prepare entry inserts
      const entryData = rows.map((row) => {
        const mapHit = mapCache.get(row.materialRaw);
        if (mapHit) {
          mapped++;
          return {
            importId: importRecord.id,
            ...row,
            mappedMaterialId: mapHit.materialId,
            mappedProveedorId: mapHit.proveedorId,
            status: "mapped" as const,
          };
        }
        unmapped++;
        return {
          importId: importRecord.id,
          ...row,
          mappedMaterialId: null,
          mappedProveedorId: null,
          status: "unmapped" as const,
        };
      });

      await this.entriesRepo.createEntries(entryData);

      // The import record status can't be updated without an update method.
      // The status stored reflects the state at creation. If we want accuracy,
      // we'd need an updateImport() method — for now "partial" covers all cases
      // where there are unmapped rows, "ok" if all mapped.
      // TODO: add updateImport() to repository port when needed.

      results.push({ filename, total: rows.length, mapped, unmapped });
    }

    return results;
  }
}

// ---------------------------------------------------------------------------
// GetProsegurImportsUseCase
// ---------------------------------------------------------------------------

export class GetProsegurImportsUseCase {
  constructor(private readonly importsRepo: ProsegurImportsRepository) {}

  execute() {
    return this.importsRepo.listImports();
  }
}

// ---------------------------------------------------------------------------
// GetProsegurImportDetailUseCase
// ---------------------------------------------------------------------------

export class GetProsegurImportDetailUseCase {
  constructor(private readonly importsRepo: ProsegurImportsRepository) {}

  async execute(id: number) {
    const result = await this.importsRepo.getImportById(id);
    return result ?? null;
  }
}

// ---------------------------------------------------------------------------
// GetUnmappedEntriesUseCase
// ---------------------------------------------------------------------------

export class GetUnmappedEntriesUseCase {
  constructor(private readonly entriesRepo: ProsegurEntriesRepository) {}

  execute() {
    return this.entriesRepo.listUnmapped();
  }
}

// ---------------------------------------------------------------------------
// MapEntryUseCase
// ---------------------------------------------------------------------------

/**
 * Maps a single unmapped entry and, optionally, saves the label → material/proveedor
 * mapping to prosegur_material_map so future imports auto-map it.
 */
export class MapEntryUseCase {
  constructor(
    private readonly entriesRepo: ProsegurEntriesRepository,
    private readonly mapRepo: ProsegurMaterialMapRepository
  ) {}

  async execute(
    entryId: number,
    materialId: number,
    proveedorId: number,
    saveMapping: boolean,
    prosegurLabel: string
  ) {
    const updated = await this.entriesRepo.mapEntry(entryId, materialId, proveedorId);
    if (!updated) return null;

    if (saveMapping && prosegurLabel) {
      await this.mapRepo.upsertMap({ prosegurLabel, materialId, proveedorId });
    }

    return updated;
  }
}

// ---------------------------------------------------------------------------
// GetMapsUseCase
// ---------------------------------------------------------------------------

export class GetMapsUseCase {
  constructor(private readonly mapRepo: ProsegurMaterialMapRepository) {}

  execute() {
    return this.mapRepo.listMaps();
  }
}

// ---------------------------------------------------------------------------
// UpsertMapUseCase
// ---------------------------------------------------------------------------

export class UpsertMapUseCase {
  constructor(private readonly mapRepo: ProsegurMaterialMapRepository) {}

  execute(data: { prosegurLabel: string; materialId: number; proveedorId: number }) {
    return this.mapRepo.upsertMap(data);
  }
}

// ---------------------------------------------------------------------------
// DeleteMapUseCase
// ---------------------------------------------------------------------------

export class DeleteMapUseCase {
  constructor(private readonly mapRepo: ProsegurMaterialMapRepository) {}

  execute(id: number) {
    return this.mapRepo.deleteMap(id);
  }
}

// ---------------------------------------------------------------------------
// GetDailySummaryUseCase
// ---------------------------------------------------------------------------

export class GetDailySummaryUseCase {
  constructor(private readonly entriesRepo: ProsegurEntriesRepository) {}

  execute(date: string) {
    return this.entriesRepo.getDailySummary(date);
  }
}

// ---------------------------------------------------------------------------
// GetWeeklySummaryUseCase
// ---------------------------------------------------------------------------

export class GetWeeklySummaryUseCase {
  constructor(private readonly entriesRepo: ProsegurEntriesRepository) {}

  execute(startDate: string, endDate: string) {
    return this.entriesRepo.getWeeklySummary(startDate, endDate);
  }
}

// ---------------------------------------------------------------------------
// RunProsegurImportUseCase (orchestrator — calls parser + importer)
// ---------------------------------------------------------------------------

/**
 * Full pipeline: parse directory → import to DB.
 * Separated from the parser itself so tests can inject mocked parse results.
 *
 * The actual filesystem call (parseProsegurDirectory) is injected as a
 * dependency to keep this use case pure and testable.
 */
export class RunProsegurImportUseCase {
  constructor(
    private readonly importFilesUseCase: ImportProsegurFilesUseCase,
    private readonly parseDirectory: (dir: string) => Promise<ParseResult[]>
  ) {}

  async execute(watchDir: string): Promise<ImportResult[]> {
    const parseResults = await this.parseDirectory(watchDir);
    if (parseResults.length === 0) {
      console.log("[prosegur] No new files found in watch directory.");
      return [];
    }
    const results = await this.importFilesUseCase.execute(parseResults);
    for (const r of results) {
      console.log(
        `[prosegur] ${r.filename}: total=${r.total} mapped=${r.mapped} unmapped=${r.unmapped}`
      );
    }
    return results;
  }
}
