import { useCallback, useEffect, useState } from "react";
import type { PlantillaDistribucion } from "../store/caStore.js";

const BASE = "/api/combustibles/plantilla";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function usePlantillaDistribucion() {
  const [plantilla, setPlantilla] = useState<PlantillaDistribucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PlantillaDistribucion[]>(BASE);
      setPlantilla(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando plantilla");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = useCallback(
    async (input: {
      materialId: number;
      materialNom: string;
      destino: string;
    }) => {
      const created = await apiFetch<PlantillaDistribucion>(BASE, {
        method: "POST",
        body: JSON.stringify(input),
      });
      await load();
      return created;
    },
    [load]
  );

  const remove = useCallback(
    async (id: number) => {
      await apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
      await load();
    },
    [load]
  );

  return { plantilla, loading, error, reload: load, create, remove };
}
