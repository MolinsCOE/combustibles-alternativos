/**
 * Parses Prosegur daily Excel files (.xls/.xlsx).
 *
 * Column layout (0-indexed):
 *  0 = DNI
 *  1 = APELLIDOS Y NOMBRE
 *  2 = FECHA (dd/mm/yyyy)
 *  3 = HORA ENTRADA (HH:MM)
 *  4 = TARJETA
 *  5 = TRACTORA
 *  6 = REMOLQUE
 *  7 = MATERIAL
 *  8 = FULL SEGUIMENT Nº
 *  9 = HORA SALIDA (HH:MM)
 * 10 = OBSERVACIONES (destino)
 */

import XLSX from "xlsx";
import * as fs from "node:fs";
import * as path from "node:path";
import type { ParsedProsegurRow } from "../../domain/entities/combustibles.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseCellText(cell: XLSX.CellObject | undefined): string | null {
  if (cell === undefined || cell === null) return null;
  const raw = cell.v;
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  return str.length > 0 ? str : null;
}

/**
 * Converts an Excel date serial number or a "dd/mm/yyyy" string to
 * an ISO date string "yyyy-mm-dd".
 */
function parseFecha(cell: XLSX.CellObject | undefined): string | null {
  if (!cell) return null;

  // If Drizzle already made it a JS Date (type 'd')
  if (cell.t === "d" && cell.v instanceof Date) {
    return cell.v.toISOString().slice(0, 10);
  }

  const raw = String(cell.v ?? "").trim();
  if (!raw) return null;

  // dd/mm/yyyy
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const m = ddmmyyyy.exec(raw);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm!.padStart(2, "0")}-${dd!.padStart(2, "0")}`;
  }

  // Try numeric serial (Excel date)
  const serial = Number(raw);
  if (!isNaN(serial) && serial > 0) {
    // XLSX.SSF.parse_date_code returns an object with y/m/d fields.
    // The library ships its own types but parse_date_code is typed as `any`
    // in some versions — we guard with a runtime check instead.
    const date: unknown = (XLSX.SSF as { parse_date_code?: (n: number) => unknown }).parse_date_code?.(serial) ?? null;
    if (date !== null && typeof date === "object") {
      const d = date as { y: number; m: number; d: number };
      const yyyy = String(d.y);
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  return null;
}

/**
 * Returns "HH:MM" string from a cell that may contain "HH:MM" text,
 * a decimal fraction (Excel time), or null.
 */
function parseHora(cell: XLSX.CellObject | undefined): string | null {
  if (!cell) return null;
  const raw = String(cell.v ?? "").trim();
  if (!raw) return null;

  // Already "HH:MM" or "HH:MM:SS"
  const timePattern = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
  const tm = timePattern.exec(raw);
  if (tm) {
    return `${tm[1]!.padStart(2, "0")}:${tm[2]}`;
  }

  // Excel fraction (0.xxx) representing time of day
  const frac = parseFloat(raw);
  if (!isNaN(frac) && frac >= 0 && frac < 1) {
    const totalMinutes = Math.round(frac * 24 * 60);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const mm = String(totalMinutes % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return null;
}

function isRowEmpty(ws: XLSX.WorkSheet, rowIdx: number, totalCols = 11): boolean {
  for (let c = 0; c < totalCols; c++) {
    const addr = XLSX.utils.encode_cell({ r: rowIdx, c });
    const cell = ws[addr] as XLSX.CellObject | undefined;
    if (cell && cell.v !== null && cell.v !== undefined && String(cell.v).trim() !== "") {
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ParseResult = {
  rows: ParsedProsegurRow[];
  filename: string;
};

/**
 * Reads all .xls/.xlsx files from a directory, parses them and moves them
 * to a ./archive/ subfolder. Returns one ParseResult per file.
 */
export function parseProsegurDirectory(
  watchDir: string
): Promise<ParseResult[]> {
  if (!fs.existsSync(watchDir)) {
    console.warn(`[prosegur] Watch dir does not exist: ${watchDir}`);
    return Promise.resolve([]);
  }

  const archiveDir = path.join(watchDir, "archive");
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const entries = fs.readdirSync(watchDir);
  const xlsFiles = entries.filter((f) => /\.(xls|xlsx)$/i.test(f));

  const results: ParseResult[] = [];

  for (const filename of xlsFiles) {
    const filepath = path.join(watchDir, filename);
    try {
      const rows = parseFile(filepath);
      results.push({ rows, filename });

      // Move to archive after successful parse
      const dest = path.join(archiveDir, filename);
      fs.renameSync(filepath, dest);
      console.log(`[prosegur] Parsed and archived: ${filename} (${rows.length} rows)`);
    } catch (err) {
      console.error(`[prosegur] Error parsing file ${filename}:`, err);
      results.push({ rows: [], filename });
    }
  }

  return Promise.resolve(results);
}

/**
 * Parses a single .xls/.xlsx file. Exported for unit testing.
 */
export function parseFile(filepath: string): ParsedProsegurRow[] {
  const workbook = XLSX.readFile(filepath, { cellDates: false, raw: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];

  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  const rows: ParsedProsegurRow[] = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    if (isRowEmpty(ws, r)) continue;

    const get = (col: number) =>
      ws[XLSX.utils.encode_cell({ r, c: col })] as XLSX.CellObject | undefined;

    const fecha = parseFecha(get(2));
    const materialRaw = normaliseCellText(get(7));

    // A row must have at least a date and a material label to be meaningful
    if (!fecha || !materialRaw) continue;

    rows.push({
      fecha,
      horaEntrada: parseHora(get(3)),
      horaSalida: parseHora(get(9)),
      dni: normaliseCellText(get(0)),
      nombre: normaliseCellText(get(1)),
      tarjeta: normaliseCellText(get(4)),
      tractora: normaliseCellText(get(5)),
      remolque: normaliseCellText(get(6)),
      materialRaw,
      destinoRaw: normaliseCellText(get(10)),
      fullSeguimentNo: normaliseCellText(get(8)),
    });
  }

  return rows;
}
