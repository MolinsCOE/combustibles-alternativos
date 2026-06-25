/**
 * Cron job that triggers the Prosegur import pipeline at a configurable schedule.
 *
 * Uses `node-cron` if available (checked at runtime), otherwise falls back to a
 * `setInterval` approach that recalculates the delay until the next target time.
 *
 * Schedule is read from PROSEGUR_CRON_SCHEDULE (default "0 4 * * *" = 04:00 daily).
 */

import type { RunProsegurImportUseCase } from "../../application/use-cases/prosegur.use-cases.js";

// ---------------------------------------------------------------------------
// Schedule parsing (minimal — only handles "MIN HOUR * * *" format)
// ---------------------------------------------------------------------------

type SimpleSchedule = { hour: number; minute: number };

function parseSimpleSchedule(cron: string): SimpleSchedule | null {
  // Handles "MIN HOUR * * *" only
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const minute = parseInt(parts[0] ?? "", 10);
  const hour = parseInt(parts[1] ?? "", 10);
  if (isNaN(minute) || isNaN(hour)) return null;
  if (minute < 0 || minute > 59 || hour < 0 || hour > 23) return null;
  return { hour, minute };
}

function msUntilNext(schedule: SimpleSchedule): number {
  const now = new Date();
  const next = new Date();
  next.setHours(schedule.hour, schedule.minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

// ---------------------------------------------------------------------------
// node-cron dynamic import (optional dependency check)
// ---------------------------------------------------------------------------

async function tryLoadNodeCron(): Promise<
  | { schedule: (expr: string, fn: () => void) => void }
  | null
> {
  try {
    // node-cron is not a listed dependency — attempt a best-effort runtime load.
    // We use Function constructor to bypass static TypeScript analysis so the
    // compiler does not try to resolve the module at type-check time.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const dynamicImport = new Function("specifier", "return import(specifier)") as (
      s: string
    ) => Promise<unknown>;
    const mod: unknown = await dynamicImport("node-cron").catch(() => null);
    if (
      mod !== null &&
      typeof mod === "object" &&
      "schedule" in mod &&
      typeof (mod as Record<string, unknown>)["schedule"] === "function"
    ) {
      return mod as { schedule: (expr: string, fn: () => void) => void };
    }
  } catch {
    // node-cron not installed — fall through to setInterval fallback
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function startProsegurCron(
  useCase: RunProsegurImportUseCase,
  watchDir: string,
  cronSchedule: string
): Promise<void> {
  const runJob = async () => {
    console.log("[prosegur:cron] Starting scheduled import...");
    try {
      const results = await useCase.execute(watchDir);
      const total = results.reduce((s, r) => s + r.total, 0);
      const mapped = results.reduce((s, r) => s + r.mapped, 0);
      console.log(
        `[prosegur:cron] Done. Files: ${results.length}, Rows: ${total}, Mapped: ${mapped}`
      );
    } catch (err) {
      console.error("[prosegur:cron] Import failed:", err);
    }
  };

  const nodeCron = await tryLoadNodeCron();

  if (nodeCron) {
    console.log(
      `[prosegur:cron] Using node-cron with schedule "${cronSchedule}"`
    );
    nodeCron.schedule(cronSchedule, () => {
      void runJob();
    });
    return;
  }

  // Fallback: setInterval recalculated against clock
  const schedule = parseSimpleSchedule(cronSchedule);
  if (!schedule) {
    console.warn(
      `[prosegur:cron] Cannot parse schedule "${cronSchedule}". Cron not started.`
    );
    return;
  }

  console.log(
    `[prosegur:cron] node-cron not available. Using setInterval fallback. ` +
      `Next run at ${schedule.hour.toString().padStart(2, "0")}:${schedule.minute
        .toString()
        .padStart(2, "0")} daily.`
  );

  const scheduleNext = () => {
    const delay = msUntilNext(schedule);
    globalThis.setTimeout(() => {
      void runJob().then(scheduleNext);
    }, delay);
  };

  scheduleNext();
}
