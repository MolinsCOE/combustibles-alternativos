import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, labelEstadoSolicitud } from "../store/caStore.js";
import { ProsegurSeguimientoSection } from "../components/ProsegurSeguimientoSection.js";
import { useProsegurDailySummary, useProsegurWeeklySummary } from "../hooks/use-prosegur.js";
import type { DiaKey, EstadoConfirmacion } from "../store/caStore.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Devuelve la clave de día (dl, dt, …) que corresponde a un Date. */
function diaKeyFromDate(date: Date): DiaKey {
  // getDay(): 0=domingo, 1=lunes, …, 6=sábado
  const map: DiaKey[] = ["dg", "dl", "dt", "dc", "dj", "dv", "ds"];
  return map[date.getDay()] as DiaKey;
}

function formatFechaES(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year as number, (month as number) - 1, day as number);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Calcula el lunes y domingo de la semana ISO que contiene `isoDate`. */
function getWeekBounds(isoDate: string): { startDate: string; endDate: string; days: string[] } {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y as number, (m as number) - 1, d as number);
  const dow = date.getDay(); // 0=domingo
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d2 = new Date(monday);
    d2.setDate(monday.getDate() + i);
    return d2.toISOString().slice(0, 10);
  });
  return { startDate: days[0] as string, endDate: days[6] as string, days };
}

/** Formatea una fecha ISO como "Lun 19 Jun" para columnas de tabla. */
function formatDiaCorto(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year as number, (month as number) - 1, day as number);
  const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${labels[d.getDay()]} ${String(day).padStart(2, "0")} ${meses[d.getMonth()]}`;
}

/** Formatea una fecha ISO como "Dom 07 Jun 2026" para el encabezado de semana. */
function formatDiaLargo(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year as number, (month as number) - 1, day as number);
  const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${labels[d.getDay()]} ${String(day).padStart(2, "0")} ${meses[d.getMonth()]} ${year as number}`;
}

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

type EstadoCruce = "cargando" | "sin-datos" | "ok" | "incidencia" | "exceso";

type FilaCruce = {
  materialNom: string;
  proveedorNom: string;
  destino: string;
  planificado: number;
  real: number | null;
  estado: EstadoCruce;
  motivoRechazo: string | null;
};

// Cada celda de la tabla semanal
type CeldaSemana = {
  planificado: number;
  confirmado: number | null; // null = proveedor aún no ha confirmado
  real: number | null;
  cargando: boolean;
};

type FilaSemana = {
  materialNom: string;
  proveedorNom: string;
  transportistaNom: string;
  destino: string;
  materialId: number;
  proveedorId: number;
  // celdas indexadas por fecha ISO
  celdas: Record<string, CeldaSemana>;
  totalPlanificado: number;
  totalReal: number | null;
  confirmacionProveedor: EstadoConfirmacion;
  tieneReduccion: boolean;
  motivoRechazo: string | null;
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export function SeguimientoPage() {
  const { t } = useTranslation("combustibles");
  const { state } = useCaStore();

  const diaSeleccionado = new Date().toISOString().slice(0, 10);
  const [vistaMode, setVistaMode] = useState<"dia" | "semana">("dia");
  const [toasts, setToasts] = useState<{ id: number; msg: string; tipo: "success" | "warning" }[]>([]);

  const showToast = (msg: string, tipo: "success" | "warning" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, tipo }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  };

  // -- Datos de Prosegur diario --
  const { summary, loading: summaryLoading } = useProsegurDailySummary(diaSeleccionado);

  // -- Semana actual --
  const weekBounds = useMemo(() => getWeekBounds(diaSeleccionado), [diaSeleccionado]);

  // -- Datos de Prosegur semanal --
  const { summary: weeklySummary, loading: weeklyLoading } = useProsegurWeeklySummary(
    weekBounds.startDate,
    weekBounds.endDate
  );

  // Índices de materiales y proveedores por nombre para resolver IDs
  const materialPorNom = useMemo(
    () => new Map(state.materiales.map((m) => [m.nom, m.id])),
    [state.materiales]
  );
  const proveedorPorNom = useMemo(
    () => new Map(state.proveedores.map((p) => [p.nom, p.id])),
    [state.proveedores]
  );

  // Índice del resumen diario: "materialId-proveedorId" → count
  const summaryIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of summary) {
      map.set(`${item.mappedMaterialId}-${item.mappedProveedorId}`, item.count);
    }
    return map;
  }, [summary]);

  // Índice del resumen semanal: "fecha-materialId-proveedorId" → count
  const weeklySummaryIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of weeklySummary) {
      map.set(`${item.fecha}-${item.mappedMaterialId}-${item.mappedProveedorId}`, item.count);
    }
    return map;
  }, [weeklySummary]);

  // Clave de día a partir de la fecha seleccionada
  const diaKey: DiaKey = useMemo(() => {
    const [year, month, day] = diaSeleccionado.split("-").map(Number);
    const d = new Date(year as number, (month as number) - 1, day as number);
    return diaKeyFromDate(d);
  }, [diaSeleccionado]);

  // Mapa fecha-ISO → diaKey para la semana
  const diasKeyMap = useMemo((): Record<string, DiaKey> => {
    const result: Record<string, DiaKey> = {};
    for (const isoDate of weekBounds.days) {
      const [year, month, day] = isoDate.split("-").map(Number);
      const d = new Date(year as number, (month as number) - 1, day as number);
      result[isoDate] = diaKeyFromDate(d);
    }
    return result;
  }, [weekBounds.days]);

  // -- Vista diaria --
  const filas = useMemo((): FilaCruce[] => {
    return state.distribucion
      .map((linea) => {
        const planificado = linea[diaKey] ?? 0;
        if (planificado === 0) return null;

        const materialId = materialPorNom.get(linea.materialNom) ?? null;
        const proveedorId = proveedorPorNom.get(linea.proveedorNom) ?? null;

        let real: number | null = null;
        if (materialId !== null && proveedorId !== null) {
          const key = `${materialId}-${proveedorId}`;
          real = summaryIndex.has(key) ? (summaryIndex.get(key) ?? 0) : null;
        }

        let estado: EstadoCruce;
        if (summaryLoading) {
          estado = "cargando";
        } else if (real === null) {
          estado = "sin-datos";
        } else if (real >= planificado) {
          estado = "ok";
        } else {
          estado = "incidencia";
        }

        if (!summaryLoading && real !== null && real > planificado) {
          estado = "exceso";
        }

        return {
          materialNom: linea.materialNom,
          proveedorNom: linea.proveedorNom,
          destino: linea.destino,
          planificado,
          real,
          estado,
          motivoRechazo: linea.motivoRechazoProveedor,
        } satisfies FilaCruce;
      })
      .filter((f): f is FilaCruce => f !== null);
  }, [state.distribucion, diaKey, summaryIndex, summaryLoading, materialPorNom, proveedorPorNom]);

  // -- Vista semanal --
  const filasSemana = useMemo((): FilaSemana[] => {
    const result: FilaSemana[] = [];

    for (const linea of state.distribucion) {
      const materialId = materialPorNom.get(linea.materialNom) ?? null;
      const proveedorId = proveedorPorNom.get(linea.proveedorNom) ?? null;

      const celdas: Record<string, CeldaSemana> = {};
      let totalPlanificado = 0;
      let totalReal: number | null = null;
      let tieneAlgunPlanificado = false;

      for (const isoDate of weekBounds.days) {
        const dk = diasKeyMap[isoDate] as DiaKey;
        const planificado = linea[dk] ?? 0;

        // Cantidad confirmada por el proveedor (null = pendiente de confirmar)
        let confirmado: number | null = null;
        if (linea.confirmacionProveedor === "confirmada") {
          confirmado = linea.cantidadesProveedor?.[dk] !== undefined
            ? (linea.cantidadesProveedor[dk] ?? planificado)
            : planificado;
        }

        let real: number | null = null;
        if (materialId !== null && proveedorId !== null) {
          const key = `${isoDate}-${materialId}-${proveedorId}`;
          real = weeklySummaryIndex.has(key) ? (weeklySummaryIndex.get(key) ?? 0) : null;
        }

        celdas[isoDate] = { planificado, confirmado, real, cargando: weeklyLoading };
        totalPlanificado += planificado;
        if (real !== null) totalReal = (totalReal ?? 0) + real;
        if (planificado > 0) tieneAlgunPlanificado = true;
      }

      if (!tieneAlgunPlanificado) continue;

      const tieneReduccion = Object.values(celdas).some(
        (c) => c.confirmado !== null && c.confirmado < c.planificado
      );

      result.push({
        materialNom: linea.materialNom,
        proveedorNom: linea.proveedorNom,
        transportistaNom: linea.transportistaNom,
        destino: linea.destino,
        materialId: materialId ?? 0,
        proveedorId: proveedorId ?? 0,
        celdas,
        totalPlanificado,
        totalReal,
        confirmacionProveedor: linea.confirmacionProveedor,
        tieneReduccion,
        motivoRechazo: linea.motivoRechazoProveedor,
      });
    }

    return result;
  }, [state.distribucion, weekBounds.days, diasKeyMap, weeklySummaryIndex, weeklyLoading, materialPorNom, proveedorPorNom]);

  // Historial
  const [historialExpandido, setHistorialExpandido] = useState<Set<number>>(new Set());

  const toggleHistorial = (solicitudId: number) => {
    setHistorialExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(solicitudId)) next.delete(solicitudId);
      else next.add(solicitudId);
      return next;
    });
  };

  const solicitudesConHistorial = useMemo(
    () =>
      state.solicitudes
        .filter((s) => (s.historial ?? []).length > 0)
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()),
    [state.solicitudes]
  );

  // ---------------------------------------------------------------------------
  // Render helpers — vista diaria
  // ---------------------------------------------------------------------------

  function renderEstadoPill(fila: FilaCruce) {
    if (fila.estado === "cargando") {
      return <span className="pill pill--muted">...</span>;
    }
    if (fila.estado === "sin-datos") {
      return <span className="pill pill--muted">Sin datos Prosegur</span>;
    }
    if (fila.estado === "ok") {
      return <span className="pill pill--success">OK</span>;
    }
    if (fila.estado === "incidencia") {
      const falta = fila.planificado - (fila.real ?? 0);
      return (
        <span className="pill pill--danger">
          Incidencia (falta {falta} {falta === 1 ? "viaje" : "viajes"})
        </span>
      );
    }
    const extra = (fila.real ?? 0) - fila.planificado;
    return (
      <span className="pill pill--warning">
        Exceso (+{extra} {extra === 1 ? "viaje" : "viajes"})
      </span>
    );
  }

  function renderRealCell(fila: FilaCruce) {
    if (fila.estado === "cargando") return <span style={{ color: "var(--c-neutral-400)" }}>...</span>;
    if (fila.real === null) return <span style={{ color: "var(--c-neutral-400)" }}>—</span>;
    return <>{fila.real}</>;
  }

  function renderBadgeConfirmacion(confirmacion: EstadoConfirmacion, tieneReduccion: boolean) {
    const base: React.CSSProperties = {
      display: "inline-block",
      fontSize: "0.7rem",
      borderRadius: "4px",
      padding: "1px 6px",
      marginTop: "0.25rem",
      lineHeight: 1.5,
      border: "1px solid",
    };
    if (confirmacion === "rechazada") {
      return <span style={{ ...base, color: "var(--c-danger-700, #b91c1c)", background: "var(--c-danger-50, #fef2f2)", borderColor: "var(--c-danger-200, #fecaca)" }}>✗ Rechazado</span>;
    }
    if (confirmacion === "confirmada" && tieneReduccion) {
      return <span style={{ ...base, color: "var(--c-warning-700, #b45309)", background: "var(--c-warning-50, #fffbeb)", borderColor: "var(--c-warning-300, #fcd34d)" }}>↓ Reducido</span>;
    }
    if (confirmacion === "confirmada") {
      return <span style={{ ...base, color: "var(--c-success-700, #15803d)", background: "var(--c-success-50, #f0fdf4)", borderColor: "var(--c-success-200, #bbf7d0)" }}>✓ Confirmado</span>;
    }
    return <span style={{ ...base, color: "var(--c-neutral-500)", background: "var(--c-neutral-100)", borderColor: "var(--c-neutral-200)" }}>⏳ Pendiente</span>;
  }

  const hayDistribucion = state.distribucion.length > 0;
  const hayFilasDelDia = filas.length > 0;
  const hayFilasSemana = filasSemana.length > 0;

  return (
    <div className="combustibles-page">
      <DemoBanner />

      <section className="page">
        <header className="page__header">
          <div>
            <h2>{t("seguimiento.title")}</h2>
            <p className="page__subtitle">{t("seguimiento.subtitle")}</p>
          </div>
        </header>

        {/* Sección Prosegur — entradas automáticas */}
        <ProsegurSeguimientoSection
          materiales={state.materiales.filter((m) => m.activo)}
          proveedores={state.proveedores.filter((p) => p.activo)}
          onToast={showToast}
        />

        {/* ------------------------------------------------------------------ */}
        {/* Toggle Día / Semana                                                  */}
        {/* ------------------------------------------------------------------ */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "1.5rem 0 0.75rem" }}>
          <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--c-neutral-700)", flex: 1 }}>
            {vistaMode === "dia"
              ? `Viajes del ${formatFechaES(diaSeleccionado)} — Planificado vs. Real`
              : `Semana del ${formatDiaLargo(weekBounds.startDate)} al ${formatDiaLargo(weekBounds.endDate)} — Planificado vs. Real`}
          </h3>
          <div
            role="group"
            aria-label="Vista de seguimiento"
            style={{
              display: "inline-flex",
              border: "1px solid var(--c-neutral-200)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setVistaMode("dia")}
              style={{
                padding: "0.35rem 0.85rem",
                fontSize: "0.82rem",
                fontWeight: vistaMode === "dia" ? 600 : 400,
                background: vistaMode === "dia" ? "var(--c-brand-500, #2563eb)" : "white",
                color: vistaMode === "dia" ? "white" : "var(--c-neutral-600)",
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => setVistaMode("semana")}
              style={{
                padding: "0.35rem 0.85rem",
                fontSize: "0.82rem",
                fontWeight: vistaMode === "semana" ? 600 : 400,
                background: vistaMode === "semana" ? "var(--c-brand-500, #2563eb)" : "white",
                color: vistaMode === "semana" ? "white" : "var(--c-neutral-600)",
                border: "none",
                cursor: "pointer",
                borderLeft: "1px solid var(--c-neutral-200)",
                transition: "background 0.15s",
              }}
            >
              Semana
            </button>
          </div>
        </div>

        {/* Nota informativa */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-start",
            background: "var(--c-neutral-50)",
            border: "1px solid var(--c-neutral-200)",
            borderRadius: "6px",
            padding: "0.6rem 0.85rem",
            marginBottom: "0.75rem",
            fontSize: "0.85rem",
            color: "var(--c-neutral-600)",
          }}
        >
          <Info size={14} aria-hidden="true" style={{ marginTop: "2px", flexShrink: 0, color: "var(--c-neutral-400)" }} />
          <span>
            Los viajes reales se obtienen automáticamente del archivo de Prosegur procesado cada madrugada.
            {vistaMode === "semana" && " En la vista semanal cada celda muestra planificado / real."}
            {vistaMode === "dia" && " Si el archivo del día seleccionado no se ha procesado aún, la columna \"Real\" mostrará \"Sin datos\"."}
          </span>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Vista diaria                                                         */}
        {/* ------------------------------------------------------------------ */}
        {vistaMode === "dia" && (
          <>
            {!hayDistribucion && (
              <p style={{ color: "var(--c-neutral-500)", fontStyle: "italic" }}>
                No hay planificación activa para la semana de este día.
              </p>
            )}

            {hayDistribucion && !hayFilasDelDia && (
              <p style={{ color: "var(--c-neutral-500)", fontStyle: "italic" }}>
                No hay viajes planificados para este día.
              </p>
            )}

            {hayDistribucion && hayFilasDelDia && (() => {
              const totalPlan = filas.reduce((s, f) => s + f.planificado, 0);
              const totalReal = filas.filter((f) => f.real !== null).reduce((s, f) => s + (f.real ?? 0), 0);
              const hayReal = filas.some((f) => f.real !== null);
              const nIncidencias = filas.filter((f) => f.estado === "incidencia").length;
              const nOk = filas.filter((f) => f.estado === "ok").length;
              return (
                <>
                  {/* Barra de resumen */}
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <div style={{ background: "var(--c-neutral-50)", border: "1px solid var(--c-neutral-200)", borderRadius: "8px", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px" }}>
                      <span style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1 }}>{totalPlan}</span>
                      <span style={{ fontSize: "0.73rem", color: "var(--c-neutral-500)", marginTop: "2px" }}>Viajes plan.</span>
                    </div>
                    {hayReal && (
                      <div style={{ background: totalReal >= totalPlan ? "var(--c-success-50, #f0fdf4)" : "var(--c-danger-50, #fef2f2)", border: `1px solid ${totalReal >= totalPlan ? "var(--c-success-200, #bbf7d0)" : "var(--c-danger-200, #fecaca)"}`, borderRadius: "8px", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px" }}>
                        <span style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1, color: totalReal >= totalPlan ? "var(--c-success-700, #15803d)" : "var(--c-danger-700, #b91c1c)" }}>{totalReal}</span>
                        <span style={{ fontSize: "0.73rem", color: "var(--c-neutral-500)", marginTop: "2px" }}>Viajes reales</span>
                      </div>
                    )}
                    {nOk > 0 && (
                      <div style={{ background: "var(--c-success-50, #f0fdf4)", border: "1px solid var(--c-success-200, #bbf7d0)", borderRadius: "8px", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "80px" }}>
                        <span style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1, color: "var(--c-success-700, #15803d)" }}>{nOk}</span>
                        <span style={{ fontSize: "0.73rem", color: "var(--c-neutral-500)", marginTop: "2px" }}>Líneas OK</span>
                      </div>
                    )}
                    {nIncidencias > 0 && (
                      <div style={{ background: "var(--c-danger-50, #fef2f2)", border: "1px solid var(--c-danger-200, #fecaca)", borderRadius: "8px", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "80px" }}>
                        <span style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1, color: "var(--c-danger-700, #b91c1c)" }}>{nIncidencias}</span>
                        <span style={{ fontSize: "0.73rem", color: "var(--c-neutral-500)", marginTop: "2px" }}>Incidencias</span>
                      </div>
                    )}
                  </div>

                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">{t("seguimiento.columns.material")}</th>
                          <th scope="col">Proveedor</th>
                          <th scope="col" className="table__col--numeric">Planificado</th>
                          <th scope="col" className="table__col--numeric">Real (Prosegur)</th>
                          <th scope="col">Estado</th>
                          <th scope="col">Motivo rechazo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((fila, i) => (
                          <tr
                            key={i}
                            className={
                              fila.estado === "incidencia" ? "combustibles-row--incidencia"
                              : fila.estado === "exceso" ? "combustibles-row--aviso"
                              : ""
                            }
                          >
                            <td className="combustibles-material-cell">{fila.materialNom}</td>
                            <td>
                              <div>{fila.proveedorNom}</div>
                              {fila.destino && (
                                <div style={{ color: "var(--c-neutral-500)", fontSize: "0.78rem", fontWeight: 600 }}>
                                  {fila.destino}
                                </div>
                              )}
                            </td>
                            <td className="table__col--numeric" style={{ fontWeight: 600 }}>{fila.planificado}</td>
                            <td className="table__col--numeric" style={{
                              fontWeight: fila.real !== null ? 600 : 400,
                              color: fila.real === null ? undefined
                                : fila.real >= fila.planificado ? "var(--c-success-700, #15803d)"
                                : "var(--c-danger-700, #b91c1c)",
                            }}>
                              {renderRealCell(fila)}
                            </td>
                            <td>{renderEstadoPill(fila)}</td>
                            <td className="table__col--muted" style={{ fontSize: "0.85rem" }}>
                              {fila.motivoRechazo ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Vista semanal                                                        */}
        {/* ------------------------------------------------------------------ */}
        {vistaMode === "semana" && (
          <>
            {!hayDistribucion && (
              <p style={{ color: "var(--c-neutral-500)", fontStyle: "italic" }}>
                No hay planificación activa para la semana de este día.
              </p>
            )}

            {hayDistribucion && !hayFilasSemana && (
              <p style={{ color: "var(--c-neutral-500)", fontStyle: "italic" }}>
                No hay viajes planificados para ningún día de esta semana.
              </p>
            )}

            {hayDistribucion && hayFilasSemana && (
              <div style={{ overflowX: "auto" }}>
                {/* Leyenda de colores */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem", fontSize: "0.78rem", alignItems: "center" }}>
                  <span style={{ color: "var(--c-neutral-500)", fontWeight: 500 }}>Leyenda celdas:</span>
                  {[
                    { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.35)", label: "Real ≥ planificado" },
                    { bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)", label: "Real por debajo" },
                    { bg: "var(--c-warning-100, #fef3c7)", border: "var(--c-warning-300, #fcd34d)", label: "Proveedor confirmó menos" },
                    { bg: "var(--c-brand-100, #dbeafe)", border: "var(--c-brand-300, #93c5fd)", label: "Hoy" },
                  ].map(({ bg, border, label }) => (
                    <span key={label} style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--c-neutral-600)" }}>
                      <span style={{ width: "12px", height: "12px", background: bg, border: `1px solid ${border}`, borderRadius: "3px", display: "inline-block", flexShrink: 0 }} />
                      {label}
                    </span>
                  ))}
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--c-neutral-600)" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.85em" }}>P</span> = plan · <span style={{ color: "var(--c-neutral-400)", fontSize: "0.85em" }}>R:</span> = real Prosegur
                  </span>
                </div>

                <table className="table" style={{ fontSize: "0.82rem", minWidth: "700px" }}>
                  <thead>
                    <tr>
                      <th scope="col" style={{ minWidth: "120px" }}>Material</th>
                      <th scope="col" style={{ minWidth: "140px" }}>Proveedor</th>
                      {weekBounds.days.map((isoDate) => {
                        const esHoy = isoDate === diaSeleccionado;
                        return (
                          <th
                            key={isoDate}
                            scope="col"
                            className="table__col--numeric"
                            style={{
                              minWidth: "64px",
                              fontSize: "0.76rem",
                              background: esHoy ? "var(--c-brand-100, #dbeafe)" : undefined,
                              color: esHoy ? "var(--c-brand-700, #1d4ed8)" : undefined,
                              fontWeight: esHoy ? 700 : undefined,
                            }}
                          >
                            {formatDiaCorto(isoDate)}
                            {esHoy && <span style={{ display: "block", fontSize: "0.65rem", fontWeight: 400, opacity: 0.8 }}>Hoy</span>}
                          </th>
                        );
                      })}
                      <th scope="col" className="table__col--numeric" style={{ minWidth: "52px" }}>T. Plan.</th>
                      <th scope="col" className="table__col--numeric" style={{ minWidth: "52px" }}>T. Real</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasSemana.map((fila, i) => (
                      <tr key={i}>
                        <td className="combustibles-material-cell">{fila.materialNom}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{fila.proveedorNom}</div>
                          {fila.transportistaNom && fila.transportistaNom !== fila.proveedorNom && (
                            <div style={{ color: "var(--c-neutral-400)", fontSize: "0.75rem" }}>
                              {fila.transportistaNom}
                            </div>
                          )}
                          {fila.destino && (
                            <div style={{ color: "var(--c-neutral-500)", fontSize: "0.75rem", fontWeight: 600 }}>
                              {fila.destino}
                            </div>
                          )}
                          {renderBadgeConfirmacion(fila.confirmacionProveedor, fila.tieneReduccion)}
                          {fila.motivoRechazo && (
                            <div style={{ fontSize: "0.7rem", color: "var(--c-danger-600, #dc2626)", marginTop: "2px", fontStyle: "italic" }}>
                              {fila.motivoRechazo}
                            </div>
                          )}
                        </td>
                        {weekBounds.days.map((isoDate) => {
                          const celda = fila.celdas[isoDate];
                          const esHoy = isoDate === diaSeleccionado;
                          if (!celda) return <td key={isoDate} style={{ borderLeft: esHoy ? "2px solid var(--c-brand-300, #93c5fd)" : undefined, borderRight: esHoy ? "2px solid var(--c-brand-300, #93c5fd)" : undefined }} />;
                          const reducida = celda.confirmado !== null && celda.confirmado < celda.planificado;
                          const efectivo = celda.confirmado !== null ? celda.confirmado : celda.planificado;
                          const realColor = celda.real === null
                            ? "var(--c-neutral-400)"
                            : celda.real >= efectivo
                              ? "var(--c-success-700, #15803d)"
                              : "var(--c-danger-700, #b91c1c)";
                          const bgColor = celda.planificado === 0
                            ? "var(--c-neutral-50)"
                            : reducida
                              ? "var(--c-warning-100, #fef3c7)"
                              : celda.cargando || celda.real === null
                                ? (esHoy ? "rgba(219,234,254,0.4)" : "transparent")
                                : celda.real >= efectivo
                                  ? "rgba(34,197,94,0.12)"
                                  : "rgba(239,68,68,0.10)";
                          return (
                            <td
                              key={isoDate}
                              className="table__col--numeric"
                              style={{
                                background: bgColor,
                                fontSize: "0.8rem",
                                padding: "0.3rem 0.4rem",
                                verticalAlign: "middle",
                                borderLeft: esHoy ? "2px solid var(--c-brand-300, #93c5fd)" : undefined,
                                borderRight: esHoy ? "2px solid var(--c-brand-300, #93c5fd)" : undefined,
                              }}
                            >
                              {celda.planificado > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.4 }}>
                                  {/* Planificado / Confirmado */}
                                  {reducida ? (
                                    <>
                                      <span style={{ fontSize: "0.75em", color: "var(--c-neutral-400)", textDecoration: "line-through" }}>
                                        P: {celda.planificado}
                                      </span>
                                      <span style={{ fontWeight: 700, color: "var(--c-warning-700, #b45309)" }}>
                                        ↓ {efectivo}
                                      </span>
                                    </>
                                  ) : (
                                    <span style={{ fontWeight: 700 }}>P: {efectivo}</span>
                                  )}
                                  {/* Separador */}
                                  <span style={{ width: "80%", borderTop: "1px solid var(--c-neutral-200)", display: "block", margin: "2px 0" }} />
                                  {/* Real */}
                                  <span style={{ fontSize: "0.78em", color: realColor, fontWeight: celda.real !== null ? 600 : 400 }}>
                                    R: {celda.cargando ? "…" : celda.real === null ? "—" : String(celda.real)}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: "var(--c-neutral-200)" }}>—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="table__col--numeric" style={{ fontWeight: 700 }}>
                          {fila.totalPlanificado}
                        </td>
                        <td className="table__col--numeric" style={{
                          fontWeight: 700,
                          color: fila.totalReal === null
                            ? "var(--c-neutral-400)"
                            : fila.totalReal >= fila.totalPlanificado
                              ? "var(--c-success-700, #15803d)"
                              : "var(--c-danger-700, #b91c1c)",
                        }}>
                          {fila.totalReal === null ? "—" : fila.totalReal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Historial de cambios por planificación */}
        {solicitudesConHistorial.length > 0 && (
          <>
            <h3 style={{ fontSize: "1rem", margin: "1.5rem 0 0.5rem", color: "var(--c-neutral-700)" }}>
              Historial de cambios en planificaciones
            </h3>
            <div className="table-wrapper">
              <table className="table" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th scope="col">Semana</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="table__col--numeric">Cambios</th>
                    <th scope="col" className="table__col--actions">Historial</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesConHistorial.map((s) => {
                    const nCambios = (s.historial ?? []).length;
                    const expandido = historialExpandido.has(s.id);
                    return (
                      <>
                        <tr key={s.id}>
                          <td>{s.semana}</td>
                          <td>
                            <span className={
                              s.estado === "cerrada" ? "pill pill--muted"
                              : s.estado === "confirmada" ? "pill pill--success"
                              : "pill pill--warning"
                            }>
                              {labelEstadoSolicitud(s.estado)}
                            </span>
                          </td>
                          <td className="table__col--numeric">{nCambios}</td>
                          <td className="table__col--actions">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => toggleHistorial(s.id)}
                              aria-expanded={expandido}
                            >
                              {expandido
                                ? <ChevronDown size={14} aria-hidden="true" />
                                : <ChevronRight size={14} aria-hidden="true" />}
                              {expandido ? "Ocultar" : "Ver historial"}
                            </button>
                          </td>
                        </tr>
                        {expandido && (
                          <tr key={`hist-${s.id}`}>
                            <td colSpan={4} style={{ padding: "0.5rem 1rem", background: "var(--c-neutral-50)" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                {[...(s.historial ?? [])]
                                  .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                                  .map((entrada) => (
                                    <div
                                      key={entrada.id}
                                      style={{
                                        background: "white",
                                        border: "1px solid var(--c-neutral-200)",
                                        borderRadius: "6px",
                                        padding: "0.5rem 0.75rem",
                                        fontSize: "0.82rem",
                                      }}
                                    >
                                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.2rem" }}>
                                        <span style={{ fontWeight: 600 }}>{entrada.descripcion}</span>
                                        <span style={{ color: "var(--c-neutral-400)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                                          {new Date(entrada.ts).toLocaleString("es-ES", {
                                            day: "2-digit", month: "2-digit", year: "2-digit",
                                            hour: "2-digit", minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                      <p style={{ color: "var(--c-neutral-600)", margin: 0, fontStyle: "italic" }}>
                                        &ldquo;{entrada.motivo}&rdquo;
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}
