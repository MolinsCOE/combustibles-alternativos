import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, sumaViajes, type Solicitud, type LineaSolicitud, type CambioHistorial } from "../store/caStore.js";

const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;
const DIAS_KEYS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"] as const;

const ESTADOS_CON_DISTRIBUCION = new Set(["en_distribucion", "confirmada", "cerrada"]);

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

function estadoPillClass(estado: string, correoEnviado: boolean): string {
  switch (estado) {
    case "enviada":         return "pill pill--warning";
    case "en_distribucion": return correoEnviado ? "pill pill--primary" : "pill pill--warning";
    case "confirmada":      return "pill pill--success";
    case "cerrada":         return "pill pill--muted";
    default:                return "pill pill--muted";
  }
}

function estadoLabelCompras(estado: string, correoEnviado: boolean): string {
  switch (estado) {
    case "enviada":         return "Pendiente planificación";
    case "en_distribucion": return correoEnviado ? "Pendiente confirmación" : "Pendiente planificación";
    case "confirmada":      return "Confirmada";
    case "cerrada":         return "Cerrada";
    default:                return estado;
  }
}

function confirmacionPillClass(estado: string): string {
  switch (estado) {
    case "confirmada": return "pill pill--success";
    case "rechazada":  return "pill pill--danger";
    case "enviada":    return "pill pill--warning";
    default:           return "pill pill--warning";
  }
}

function confirmacionLabel(estado: string): string {
  switch (estado) {
    case "confirmada": return "Confirmada";
    case "rechazada":  return "Rechazada";
    case "enviada":    return "Enviada";
    default:           return "Pendiente";
  }
}

export function SolicitudesRecibidasPage() {
  const { t } = useTranslation("combustibles");
  const { state, dispatch } = useCaStore();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const showToast = (msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  };

  const solicitudes = state.solicitudes
    .filter((s) => s.estado !== "borrador")
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  const handleIniciarDistribucion = (s: Solicitud) => {
    dispatch({ type: "INICIAR_DISTRIBUCION", solicitudId: s.id });
    showToast(`Solicitud ${s.semana} marcada en distribución.`);
    window.setTimeout(() => { void navigate("/combustibles/distribucion"); }, 800);
  };

  return (
    <div className="combustibles-page">
      <DemoBanner />
      <section className="page">
        <header className="page__header">
          <div>
            <h2>
              {t("solicitudesRecibidas.title")}
              {solicitudes.length > 0 && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 400,
                    color: "var(--c-neutral-500)",
                  }}
                >
                  ({solicitudes.length})
                </span>
              )}
            </h2>
            <p className="page__subtitle">{t("solicitudesRecibidas.subtitle")}</p>
          </div>
        </header>

        {solicitudes.length === 0 && (
          <p className="empty-state">{t("solicitudesRecibidas.sinSolicitudes")}</p>
        )}

        {solicitudes.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t("solicitudesRecibidas.columns.semana")}</th>
                  <th scope="col">{t("solicitudesRecibidas.columns.creadaPor")}</th>
                  <th scope="col">{t("solicitudesRecibidas.columns.fecha")}</th>
                  <th scope="col">{t("solicitudesRecibidas.columns.estado")}</th>
                  <th scope="col" className="table__col--numeric">{t("solicitudesRecibidas.columns.totalViajes")}</th>
                  <th scope="col" className="table__col--actions">{t("solicitudesRecibidas.columns.acciones")}</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => {
                  const lineasDistSolicitud = state.distribucion.filter(
                    (l) => l.solicitudId === s.id
                  );
                  const tieneDistribucion = ESTADOS_CON_DISTRIBUCION.has(s.estado);
                  const correoEnviado = lineasDistSolicitud.some(
                    (l) => l.correoEnviadoEn !== null || l.correoTransportistaEnviadoEn !== null
                  );
                  const grupos = agruparPorDestino(s.lineas);

                  return (
                    <>
                      <tr
                        key={s.id}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setExpandedId(expandedId === s.id ? null : s.id)
                        }
                      >
                        <td style={{ fontWeight: 600 }}>{s.semana}</td>
                        <td className="table__col--muted">{s.creadaPor}</td>
                        <td className="table__col--muted">
                          {new Date(s.ts).toLocaleDateString("es-ES")}
                        </td>
                        <td>
                          <span className={estadoPillClass(s.estado, correoEnviado)}>
                            {estadoLabelCompras(s.estado, correoEnviado)}
                          </span>
                        </td>
                        <td className="table__col--numeric">{totalViajes(s)}</td>
                        <td className="table__col--actions">
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === s.id ? null : s.id);
                            }}
                          >
                            {t("solicitudesRecibidas.acciones.verDetalle")}
                          </button>
                          {s.estado === "enviada" && (
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIniciarDistribucion(s);
                              }}
                            >
                              {t("solicitudesRecibidas.acciones.iniciarDistribucion")}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Detalle expandido — agrupado por destino */}
                      {expandedId === s.id && (
                        <tr key={`${s.id}-detail`}>
                          <td colSpan={6} style={{ background: "var(--c-neutral-50)", padding: "0.5rem 0.75rem" }}>
                            {s.comentarioGeneral && (
                              <div style={{ marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--c-neutral-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Comentario</span>
                                <p style={{ margin: "0.15rem 0 0", color: "var(--c-neutral-600)", fontStyle: "italic", fontSize: "0.83rem" }}>
                                  {s.comentarioGeneral}
                                </p>
                              </div>
                            )}
                            {s.mantenimientosProgramados && (
                              <div style={{ marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--c-neutral-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mantenimientos programados</span>
                                <p style={{ margin: "0.15rem 0 0", color: "var(--c-neutral-600)", fontStyle: "italic", fontSize: "0.83rem" }}>
                                  {s.mantenimientosProgramados}
                                </p>
                              </div>
                            )}

                            {grupos.map((grupo) => (
                              <div key={grupo.destino} style={{ marginBottom: "1rem" }}>
                                {/* Subencabezado destino */}
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
                                    {t("solicitudesRecibidas.detalle.destino")}
                                  </span>
                                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                                    {grupo.destino || "—"}
                                  </span>
                                </div>

                                <div className="table-wrapper">
                                  <table className="table table--dense" style={{ tableLayout: "fixed", width: "100%" }}>
                                    <colgroup>
                                      <col />
                                      {DIAS_ABR.map((d) => <col key={d} style={{ width: "52px" }} />)}
                                      <col style={{ width: "62px" }} />
                                      <col style={{ width: "110px" }} />
                                    </colgroup>
                                    <thead>
                                      <tr>
                                        <th scope="col">{t("solicitudesRecibidas.detalle.material")}</th>
                                        {DIAS_ABR.map((d) => (
                                          <th key={d} scope="col" className="table__col--numeric combustibles-dia-col">{d}</th>
                                        ))}
                                        <th scope="col" className="table__col--numeric">{t("solicitudesRecibidas.detalle.total")}</th>
                                        <th scope="col">{t("solicitudesRecibidas.detalle.estado")}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {grupo.lineas.map((l) => {
                                        const lineasDistLinea = lineasDistSolicitud.filter(
                                          (ld) => ld.lineaSolicitudId === l.id
                                        );
                                        return (
                                          <>
                                            {/* Fila material */}
                                            <tr key={l.id} style={{ background: "var(--c-neutral-100)" }}>
                                              <td style={{ fontWeight: 700 }}>{l.materialNom}</td>
                                              {DIAS_KEYS.map((k) => (
                                                <td key={k} className="table__col--numeric combustibles-dia-col">{l[k]}</td>
                                              ))}
                                              <td className="table__col--numeric" style={{ fontWeight: 700 }}>{sumaViajes(l)}</td>
                                              <td />
                                            </tr>

                                            {/* Filas proveedor con desglose por día */}
                                            {tieneDistribucion && lineasDistLinea.length === 0 && (
                                              <tr key={`${l.id}-empty`}>
                                                <td colSpan={10} style={{ paddingLeft: "1.5rem", color: "var(--c-neutral-400)", fontStyle: "italic", fontSize: "0.8rem" }}>
                                                  {t("solicitudesRecibidas.detalle.sinProveedor")}
                                                </td>
                                              </tr>
                                            )}
                                            {tieneDistribucion && lineasDistLinea.map((ld) => (
                                              <tr key={ld.id} style={{ fontSize: "0.82rem", color: "var(--c-neutral-700)" }}>
                                                <td style={{ paddingLeft: "1.5rem" }}>
                                                  <span style={{ color: "var(--c-neutral-400)", marginRight: "0.3rem" }}>↳</span>
                                                  <strong>{ld.proveedorNom}</strong>
                                                  <span style={{ color: "var(--c-neutral-400)", margin: "0 0.25rem" }}>·</span>
                                                  <span style={{ color: "var(--c-neutral-500)" }}>{ld.transportistaNom}</span>
                                                </td>
                                                {DIAS_KEYS.map((k) => (
                                                  <td key={k} className="table__col--numeric combustibles-dia-col" style={{ color: ld[k] > 0 ? "var(--c-neutral-800)" : "var(--c-neutral-300)" }}>
                                                    {ld[k] > 0 ? ld[k] : "·"}
                                                  </td>
                                                ))}
                                                <td className="table__col--numeric">{sumaViajes(ld)}</td>
                                                <td>
                                                  <span className={confirmacionPillClass(ld.confirmacionProveedor)} style={{ fontSize: "0.72rem" }}>
                                                    {confirmacionLabel(ld.confirmacionProveedor)}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}

                            {/* Historial de cambios */}
                            {(s.historial ?? []).length > 0 && (
                              <div style={{ marginTop: "1rem" }}>
                                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--c-neutral-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                                  {t("solicitudesRecibidas.detalle.historialCambios")}
                                </p>
                                <table className="table table--dense" style={{ fontSize: "0.82rem" }}>
                                  <thead>
                                    <tr>
                                      <th scope="col">{t("solicitudesRecibidas.detalle.historial.fecha")}</th>
                                      <th scope="col">{t("solicitudesRecibidas.detalle.historial.autor")}</th>
                                      <th scope="col">{t("solicitudesRecibidas.detalle.historial.motivo")}</th>
                                      <th scope="col">{t("solicitudesRecibidas.detalle.historial.descripcion")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[...(s.historial ?? [])]
                                      .sort((a: CambioHistorial, b: CambioHistorial) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                                      .map((entrada: CambioHistorial) => (
                                        <tr key={entrada.id}>
                                          <td style={{ whiteSpace: "nowrap", color: "var(--c-neutral-500)" }}>
                                            {new Date(entrada.ts).toLocaleString("es-ES", {
                                              day: "2-digit", month: "2-digit", year: "2-digit",
                                              hour: "2-digit", minute: "2-digit",
                                            })}
                                          </td>
                                          <td>
                                            <span className={entrada.autor === "produccion" ? "pill pill--primary" : "pill pill--danger"} style={{ fontSize: "0.72rem" }}>
                                              {entrada.autor === "produccion" ? "Producción" : "Compras"}
                                            </span>
                                          </td>
                                          <td style={{ color: "var(--c-neutral-700)" }}>{entrada.motivo}</td>
                                          <td style={{ color: "var(--c-neutral-600)", fontStyle: "italic" }}>{entrada.descripcion}</td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className="toast toast--success">{t.msg}</div>
        ))}
      </div>
    </div>
  );
}
