import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, sumaViajes, type Solicitud, type LineaSolicitud } from "../store/caStore.js";

const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;
const DIAS_KEYS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"] as const;

type DestinoGrupo = {
  destino: string;
  lineas: LineaSolicitud[];
};

function agruparPorDestino(lineas: LineaSolicitud[]): DestinoGrupo[] {
  const mapa = new Map<string, LineaSolicitud[]>();
  for (const l of lineas) {
    const key = l.destino ?? "";
    const arr = mapa.get(key) ?? [];
    arr.push(l);
    mapa.set(key, arr);
  }
  return [...mapa.entries()].map(([destino, ls]) => ({ destino, lineas: ls }));
}

function totalViajes(s: Solicitud): number {
  return s.lineas.reduce((sum, l) => sum + sumaViajes(l), 0);
}

function estadoPillClass(estado: string): string {
  switch (estado) {
    case "borrador":        return "pill pill--muted";
    case "enviada":         return "pill pill--primary";
    case "en_distribucion": return "pill pill--warning";
    case "confirmada":      return "pill pill--success";
    case "cerrada":         return "pill pill--success";
    default:                return "pill pill--muted";
  }
}

export function MisSolicitudesPage() {
  const { t } = useTranslation("combustibles");
  const { state } = useCaStore();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmarEditarCerrada, setConfirmarEditarCerrada] = useState<{ semana: string } | null>(null);

  const solicitudes = [...state.solicitudes].sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
  );

  return (
    <div className="combustibles-page">
      <DemoBanner />
      <section className="page">
        <header className="page__header">
          <div>
            <h2>{t("misSolicitudes.title")}</h2>
            <p className="page__subtitle">{t("misSolicitudes.subtitle")}</p>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => { void navigate("/combustibles/solicitud/nueva"); }}
          >
            {t("misSolicitudes.nuevaSolicitud")}
          </button>
        </header>

        {solicitudes.length === 0 && (
          <p className="empty-state">{t("misSolicitudes.sinSolicitudes")}</p>
        )}

        {solicitudes.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t("misSolicitudes.columns.semana")}</th>
                  <th scope="col">{t("misSolicitudes.columns.fechas")}</th>
                  <th scope="col">{t("misSolicitudes.columns.estado")}</th>
                  <th scope="col" className="table__col--numeric">{t("misSolicitudes.columns.totalViajes")}</th>
                  <th scope="col">{t("misSolicitudes.columns.creada")}</th>
                  <th scope="col" className="table__col--actions">{t("misSolicitudes.columns.acciones")}</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setExpandedId(expandedId === s.id ? null : s.id)
                      }
                    >
                      <td style={{ fontWeight: 600 }}>{s.semana}</td>
                      <td className="table__col--muted" style={{ whiteSpace: "nowrap" }}>
                        {s.ini} — {s.fi}
                      </td>
                      <td>
                        <span className={estadoPillClass(s.estado)}>
                          {t(`estados.${s.estado}`)}
                        </span>
                      </td>
                      <td className="table__col--numeric">{totalViajes(s)}</td>
                      <td className="table__col--muted">
                        {new Date(s.ts).toLocaleDateString("es-ES")}
                      </td>
                      <td className="table__col--actions">
                        {s.estado === "borrador" && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void navigate("/combustibles/solicitud/nueva");
                            }}
                          >
                            {t("misSolicitudes.acciones.continuarEditando")}
                          </button>
                        )}
                        {(s.estado === "enviada" || s.estado === "en_distribucion" || s.estado === "confirmada") && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void navigate(`/combustibles/solicitud/nueva?semana=${s.semana}&editar=1`);
                            }}
                          >
                            {t("misSolicitudes.acciones.editarPlanificacion")}
                          </button>
                        )}
                        {s.estado === "cerrada" && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmarEditarCerrada({ semana: s.semana });
                            }}
                          >
                            {t("misSolicitudes.acciones.editarPlanificacion")}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(expandedId === s.id ? null : s.id);
                          }}
                        >
                          {expandedId === s.id
                            ? t("misSolicitudes.acciones.cerrar")
                            : t("misSolicitudes.acciones.verDetalle")}
                        </button>
                      </td>
                    </tr>

                    {/* Detalle expandido — agrupado por destino */}
                    {expandedId === s.id && (
                      <tr key={`${s.id}-detail`}>
                        <td colSpan={6} style={{ background: "var(--c-neutral-50)", padding: "1rem" }}>
                          {s.comentarioGeneral && (
                            <p
                              style={{
                                marginBottom: "0.75rem",
                                color: "var(--c-neutral-700)",
                                fontStyle: "italic",
                              }}
                            >
                              {s.comentarioGeneral}
                            </p>
                          )}
                          {agruparPorDestino(s.lineas).filter((grupo) => grupo.lineas.some((l) => sumaViajes(l) > 0)).map((grupo) => (
                            <div key={grupo.destino} style={{ marginBottom: "1rem" }}>
                              {/* Subencabezado de destino */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  marginBottom: "0.4rem",
                                  paddingBottom: "0.25rem",
                                  borderBottom: "1px solid var(--c-neutral-200)",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    color: "var(--c-neutral-500)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  {t("misSolicitudes.detalle.destino")}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                                  {grupo.destino || "—"}
                                </span>
                              </div>
                              <div className="table-wrapper">
                                <table className="table" style={{ fontSize: "0.85rem", tableLayout: "fixed", width: "100%" }}>
                                  <colgroup>
                                    <col />
                                    {DIAS_ABR.map((d) => <col key={d} style={{ width: "52px" }} />)}
                                    <col style={{ width: "62px" }} />
                                    <col style={{ width: "140px" }} />
                                  </colgroup>
                                  <thead>
                                    <tr>
                                      <th scope="col">{t("misSolicitudes.detalle.material")}</th>
                                      {DIAS_ABR.map((d) => (
                                        <th
                                          key={d}
                                          scope="col"
                                          className="table__col--numeric combustibles-dia-col"
                                        >
                                          {d}
                                        </th>
                                      ))}
                                      <th scope="col" className="table__col--numeric">
                                        {t("misSolicitudes.detalle.total")}
                                      </th>
                                      <th scope="col">{t("misSolicitudes.detalle.obs")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {grupo.lineas.filter((l) => sumaViajes(l) > 0).map((l) => (
                                      <tr key={l.id}>
                                        <td>{l.materialNom}</td>
                                        {DIAS_KEYS.map((k) => (
                                          <td
                                            key={k}
                                            className="table__col--numeric combustibles-dia-col"
                                          >
                                            {l[k]}
                                          </td>
                                        ))}
                                        <td
                                          className="table__col--numeric"
                                          style={{ fontWeight: 700 }}
                                        >
                                          {sumaViajes(l)}
                                        </td>
                                        <td className="table__col--muted">{l.obs || "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmarEditarCerrada && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setConfirmarEditarCerrada(null)}
        >
          <div
            style={{
              background: "white", borderRadius: "12px",
              padding: "1.5rem", maxWidth: "420px", width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Editar planificación cerrada</h3>
            <div style={{
              background: "var(--c-warning-50, #fffbeb)",
              border: "1px solid var(--c-warning-300, #fcd34d)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              fontSize: "0.88rem",
              color: "var(--c-warning-800, #92400e)",
            }}>
              Ten en cuenta que Compras ya ha cerrado esta planificación. Los cambios quedarán registrados, pero Compras deberá revisar y reajustar la distribución si aplica.
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmarEditarCerrada(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  void navigate(`/combustibles/solicitud/nueva?semana=${confirmarEditarCerrada.semana}&editar=1`);
                  setConfirmarEditarCerrada(null);
                }}
              >
                Continuar y editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
