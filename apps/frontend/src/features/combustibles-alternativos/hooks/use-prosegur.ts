import { useCallback, useEffect, useState } from "react";
import {
  prosegurService,
  type DailySummaryItem,
  type ProsegurEntry,
  type ProsegurImport,
  type ProsegurMaterialMap,
  type WeeklySummaryItem,
} from "../services/prosegur.service.js";

// ---------------------------------------------------------------------------
// useProsegurImports
// ---------------------------------------------------------------------------

export function useProsegurImports() {
  const [imports, setImports] = useState<ProsegurImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await prosegurService.listImports();
      setImports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading imports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { imports, loading, error, reload: load };
}

// ---------------------------------------------------------------------------
// useProsegurUnmapped
// ---------------------------------------------------------------------------

export function useProsegurUnmapped() {
  const [entries, setEntries] = useState<ProsegurEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await prosegurService.listUnmapped();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading unmapped entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const mapEntry = useCallback(
    async (
      entryId: number,
      materialId: number,
      proveedorId: number,
      prosegurLabel: string
    ) => {
      await prosegurService.mapEntry(entryId, {
        materialId,
        proveedorId,
        saveMapping: true,
        prosegurLabel,
      });
      // Refresh unmapped list
      await load();
    },
    [load]
  );

  return { entries, loading, error, reload: load, mapEntry };
}

// ---------------------------------------------------------------------------
// useProsegurMaps
// ---------------------------------------------------------------------------

export function useProsegurMaps() {
  const [maps, setMaps] = useState<ProsegurMaterialMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await prosegurService.listMaps();
      setMaps(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading maps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const upsert = useCallback(
    async (data: { prosegurLabel: string; materialId: number; proveedorId: number }) => {
      await prosegurService.upsertMap(data);
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (id: number) => {
      await prosegurService.deleteMap(id);
      await load();
    },
    [load]
  );

  return { maps, loading, error, reload: load, upsert, remove };
}

// ---------------------------------------------------------------------------
// useProsegurDailySummary
// ---------------------------------------------------------------------------

export function useProsegurDailySummary(date: string) {
  const [summary, setSummary] = useState<DailySummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    prosegurService
      .getDailySummary(date)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error cargando datos de Prosegur");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  return { summary, loading, error };
}

// ---------------------------------------------------------------------------
// useProsegurWeeklySummary
// ---------------------------------------------------------------------------

export function useProsegurWeeklySummary(startDate: string, endDate: string) {
  const [summary, setSummary] = useState<WeeklySummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    prosegurService
      .getWeeklySummary(startDate, endDate)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error cargando datos semanales de Prosegur");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  return { summary, loading, error };
}
