import { useEffect, useState } from "react";
import { combustiblesService } from "../services/combustibles.service.js";

type ComparativaDia = {
  fecha: string;
  diaKey: string;
  planificado: number;
  real: number;
  desviacion: number;
};

type ComparativaLinea = {
  materialId: number;
  materialNom: string;
  proveedorId: number;
  proveedorNom: string;
  dias: ComparativaDia[];
  totalPlanificado: number;
  totalReal: number;
};

const DIAS_LABEL: Record<string, string> = {
  dl: "L", dt: "M", dc: "X", dj: "J", dv: "V", ds: "S", dg: "D",
};
const DIAS_KEYS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];

function DesviacionCell({ planificado, real }: { planificado: number; real: number }) {
  if (planificado === 0 && real === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--c-neutral-300)", fontSize: "0.75rem" }}>
        —
      </div>
    );
  }
  const ok = real >= planificado;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: ok ? "var(--c-success-700, #15803d)" : "var(--c-error-700, #b91c1c)" }}>
        {real}
      </div>
      <div style={{ fontSize: "0.68rem", color: "var(--c-neutral-400)" }}>
        /{planificado}
      </div>
    </div>
  );
}

export function ComparativaTable({ solicitudId }: { solicitudId: number }) {
  const [data, setData] = useState<ComparativaLinea[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    combustiblesService
      .getComparativa(solicitudId)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [solicitudId]);

  if (loading) {
    return <p style={{ fontSize: "0.85rem", color: "var(--c-neutral-400)", padding: "1rem 0" }}>Cargando comparativa…</p>;
  }
  if (error) {
    return <p style={{ fontSize: "0.85rem", color: "var(--c-error-600, #dc2626)", padding: "0.5rem 0" }}>{error}</p>;
  }
  if (!data || data.length === 0) {
    return (
      <p style={{ fontSize: "0.85rem", color: "var(--c-neutral-400)", padding: "0.5rem 0" }}>
        Sin datos de Prosegur para esta semana todavía.
      </p>
    );
  }

  const totalPlan = data.reduce((s, l) => s + l.totalPlanificado, 0);
  const totalReal = data.reduce((s, l) => s + l.totalReal, 0);

  return (
    <div style={{ overflowX: "auto" }}>
      {/* Leyenda */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.75rem", flexWrap: "wrap", fontSize: "0.78rem" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--c-success-100, #dcfce7)", border: "1px solid var(--c-success-300, #86efac)", display: "inline-block" }} />
          <span style={{ color: "var(--c-neutral-600)" }}>real ≥ planificado</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--c-error-50, #fef2f2)", border: "1px solid var(--c-error-200, #fecaca)", display: "inline-block" }} />
          <span style={{ color: "var(--c-neutral-600)" }}>real &lt; planificado</span>
        </span>
        <span style={{ color: "var(--c-neutral-500)" }}>
          Cada celda: <strong>real</strong> / planificado
        </span>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.82rem" }}>
        <thead>
          <tr>
            <th style={thStyle("left", "140px")}>Material</th>
            <th style={thStyle("left", "110px")}>Proveedor</th>
            {DIAS_KEYS.map((d) => (
              <th key={d} style={thStyle("center", "58px")}>{DIAS_LABEL[d]}</th>
            ))}
            <th style={thStyle("center", "72px")}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((linea) => (
            <tr key={`${linea.materialId}-${linea.proveedorId}`} style={{ borderBottom: "1px solid var(--c-neutral-100)" }}>
              <td style={tdStyle("left")}>{linea.materialNom}</td>
              <td style={{ ...tdStyle("left"), color: "var(--c-neutral-500)", fontSize: "0.78rem" }}>{linea.proveedorNom}</td>
              {linea.dias.map((dia) => (
                <td
                  key={dia.diaKey}
                  style={{
                    ...tdStyle("center"),
                    background:
                      dia.planificado === 0 && dia.real === 0
                        ? "transparent"
                        : dia.real >= dia.planificado
                        ? "var(--c-success-50, #f0fdf4)"
                        : "var(--c-error-50, #fef2f2)",
                  }}
                >
                  <DesviacionCell planificado={dia.planificado} real={dia.real} />
                </td>
              ))}
              <td style={{ ...tdStyle("center"), fontWeight: 600, borderLeft: "2px solid var(--c-neutral-200)" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: linea.totalReal >= linea.totalPlanificado ? "var(--c-success-700, #15803d)" : "var(--c-error-700, #b91c1c)" }}>
                  {linea.totalReal}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--c-neutral-400)" }}>/{linea.totalPlanificado}</div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "var(--c-neutral-50)", fontWeight: 700 }}>
            <td colSpan={2} style={{ ...tdStyle("right"), fontSize: "0.78rem", color: "var(--c-neutral-500)", paddingRight: "0.75rem" }}>
              TOTAL
            </td>
            {DIAS_KEYS.map((d) => {
              const plan = data.reduce((s, l) => s + (l.dias.find(x => x.diaKey === d)?.planificado ?? 0), 0);
              const real = data.reduce((s, l) => s + (l.dias.find(x => x.diaKey === d)?.real ?? 0), 0);
              return (
                <td key={d} style={{ ...tdStyle("center"), borderTop: "2px solid var(--c-neutral-200)" }}>
                  <DesviacionCell planificado={plan} real={real} />
                </td>
              );
            })}
            <td style={{ ...tdStyle("center"), borderLeft: "2px solid var(--c-neutral-200)", borderTop: "2px solid var(--c-neutral-200)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: totalReal >= totalPlan ? "var(--c-success-700, #15803d)" : "var(--c-error-700, #b91c1c)" }}>
                {totalReal}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--c-neutral-400)" }}>/{totalPlan}</div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function thStyle(align: "left" | "center" | "right", minWidth: string): React.CSSProperties {
  return {
    padding: "6px 8px",
    background: "var(--c-neutral-50)",
    border: "1px solid var(--c-neutral-200)",
    fontWeight: 600,
    textAlign: align,
    fontSize: "0.75rem",
    color: "var(--c-neutral-500)",
    minWidth,
    whiteSpace: "nowrap",
  };
}

function tdStyle(align: "left" | "center" | "right"): React.CSSProperties {
  return {
    padding: "6px 8px",
    border: "1px solid var(--c-neutral-100)",
    textAlign: align,
    verticalAlign: "middle",
  };
}
