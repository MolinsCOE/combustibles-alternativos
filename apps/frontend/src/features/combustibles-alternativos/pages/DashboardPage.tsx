import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle, BarChart2, Flame, Inbox } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, sumaViajes } from "../store/caStore.js";
import {
  DASHBOARD_KPIS_MOCK,
  PLANIFICACION_ACTIVA_MOCK
} from "../data/mock.js";

function estadoLabel(estado: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    borrador: t("estados.borrador"),
    pendiente_distribucion: t("estados.pendiente_distribucion"),
    en_distribucion: t("estados.en_distribucion"),
    enviada: t("estados.enviada"),
    confirmada: t("estados.confirmada"),
    cerrada: t("estados.cerrada")
  };
  return map[estado] ?? estado;
}

function estadoPillClass(estado: string): string {
  switch (estado) {
    case "confirmada": return "pill pill--success";
    case "cerrada": return "pill pill--muted";
    case "enviada": return "pill pill--warning";
    default: return "pill pill--muted";
  }
}

function confirmacionPillClass(estado: string): string {
  switch (estado) {
    case "confirmada": return "pill pill--success";
    case "rechazada":  return "pill pill--danger";
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

export function DashboardPage() {
  const { t } = useTranslation("combustibles");
  const { state } = useCaStore();
  const kpis = DASHBOARD_KPIS_MOCK;
  const planActiva = PLANIFICACION_ACTIVA_MOCK;

  // Solicitudes pendientes de distribución (estado enviada)
  const solicitudesPendientes = state.solicitudes
    .filter((s) => s.estado === "enviada")
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  // Solicitud activa: la más reciente con estado en_distribucion, confirmada o cerrada
  const ESTADOS_ACTIVOS = new Set(["en_distribucion", "confirmada", "cerrada"]);
  const solicitudActiva = state.solicitudes
    .filter((s) => ESTADOS_ACTIVOS.has(s.estado))
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0] ?? null;

  // Líneas de distribución de la solicitud activa
  const lineasDist = solicitudActiva
    ? state.distribucion.filter((l) => l.solicitudId === solicitudActiva.id)
    : [];

  return (
    <div className="combustibles-dashboard">
      <DemoBanner />

      {/* Alerta: solicitudes pendientes de iniciar distribución */}
      {solicitudesPendientes.length > 0 && (
        <section className="page" style={{ borderLeft: "4px solid var(--c-warning)", background: "var(--c-warning-bg, #fffbeb)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <Inbox size={22} style={{ color: "var(--c-warning)", flexShrink: 0, marginTop: "0.1rem" }} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
                {solicitudesPendientes.length === 1
                  ? "Hay 1 solicitud enviada por Producción pendiente de distribución"
                  : `Hay ${solicitudesPendientes.length} solicitudes enviadas por Producción pendientes de distribución`}
              </p>
              <ul style={{ margin: "0.25rem 0 0.75rem 1rem", padding: 0, fontSize: "0.88rem", color: "var(--c-neutral-700)" }}>
                {solicitudesPendientes.map((s) => (
                  <li key={s.id}>
                    <strong>{s.semana}</strong>
                    {" · "}
                    {s.creadaPor}
                    {" · "}
                    {new Date(s.ts).toLocaleDateString("es-ES")}
                    {" · "}
                    {s.lineas.reduce((sum, l) => sum + sumaViajes(l), 0)} viajes
                  </li>
                ))}
              </ul>
              <Link to="/combustibles/solicitudes-recibidas" className="btn btn--primary btn--sm">
                Ir a Solicitudes recibidas
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="page">
        <header className="page__header">
          <div>
            <h2>{t("dashboard.title")}</h2>
            <p className="page__subtitle">{t("dashboard.subtitle")}</p>
            <p className="page__subtitle" style={{ marginTop: "0.2rem", fontSize: "0.8rem" }}>
              {t("dashboard.semana", { semana: kpis.semana, anyo: kpis.anyo })}
              {" · "}
              <span className={estadoPillClass(planActiva.estado)}>
                {estadoLabel(planActiva.estado, t)}
              </span>
            </p>
          </div>
          <Link to="/combustibles/solicitudes-recibidas" className="btn btn--primary">
            Solicitudes recibidas
          </Link>
        </header>

        {/* KPIs */}
        <div className="combustibles-kpis">
          <div className="combustibles-kpi">
            <div className="combustibles-kpi__icon combustibles-kpi__icon--primary">
              <Flame size={22} aria-hidden="true" />
            </div>
            <div className="combustibles-kpi__body">
              <span className="combustibles-kpi__value">{kpis.viajesHoy}</span>
              <span className="combustibles-kpi__label">{t("dashboard.kpis.viajesHoy")}</span>
            </div>
          </div>

          <div className="combustibles-kpi">
            <div className="combustibles-kpi__icon combustibles-kpi__icon--muted">
              <BarChart2 size={22} aria-hidden="true" />
            </div>
            <div className="combustibles-kpi__body">
              <span className="combustibles-kpi__value">{kpis.viajesPlanHoy}</span>
              <span className="combustibles-kpi__label">{t("dashboard.kpis.viajesPlanHoy")}</span>
            </div>
          </div>

          <div className={`combustibles-kpi ${kpis.desviacionHoy < 0 ? "combustibles-kpi--danger" : ""}`}>
            <div className={`combustibles-kpi__icon ${kpis.desviacionHoy < 0 ? "combustibles-kpi__icon--danger" : "combustibles-kpi__icon--success"}`}>
              {kpis.desviacionHoy < 0
                ? <TrendingDown size={22} aria-hidden="true" />
                : <TrendingUp size={22} aria-hidden="true" />}
            </div>
            <div className="combustibles-kpi__body">
              <span className={`combustibles-kpi__value ${kpis.desviacionHoy < 0 ? "combustibles-kpi__value--danger" : ""}`}>
                {kpis.desviacionHoy > 0 ? `+${kpis.desviacionHoy}` : kpis.desviacionHoy}
              </span>
              <span className="combustibles-kpi__label">{t("dashboard.kpis.desviacion")}</span>
            </div>
          </div>

          <div className={`combustibles-kpi ${kpis.incidenciasActivas > 0 ? "combustibles-kpi--danger" : ""}`}>
            <div className={`combustibles-kpi__icon ${kpis.incidenciasActivas > 0 ? "combustibles-kpi__icon--danger" : "combustibles-kpi__icon--success"}`}>
              <AlertTriangle size={22} aria-hidden="true" />
            </div>
            <div className="combustibles-kpi__body">
              <span className={`combustibles-kpi__value ${kpis.incidenciasActivas > 0 ? "combustibles-kpi__value--danger" : ""}`}>
                {kpis.incidenciasActivas}
              </span>
              <span className="combustibles-kpi__label">{t("dashboard.kpis.incidenciasActivas")}</span>
            </div>
          </div>

          <div className={`combustibles-kpi ${kpis.lineasPendientesConfirmacion > 0 ? "combustibles-kpi--warning" : ""}`}>
            <div className={`combustibles-kpi__icon ${kpis.lineasPendientesConfirmacion > 0 ? "combustibles-kpi__icon--warning" : "combustibles-kpi__icon--success"}`}>
              <Clock size={22} aria-hidden="true" />
            </div>
            <div className="combustibles-kpi__body">
              <span className="combustibles-kpi__value">{kpis.lineasPendientesConfirmacion}</span>
              <span className="combustibles-kpi__label">{t("dashboard.kpis.lineasPendientesConfirmacion")}</span>
            </div>
          </div>

          <div className="combustibles-kpi">
            <div className="combustibles-kpi__icon combustibles-kpi__icon--success">
              <CheckCircle size={22} aria-hidden="true" />
            </div>
            <div className="combustibles-kpi__body">
              <span className="combustibles-kpi__value">{kpis.cumplimientoSemana}%</span>
              <span className="combustibles-kpi__label">{t("dashboard.kpis.cumplimiento")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Resumen semana */}
      <section className="page">
        <header className="page__header">
          <h2 style={{ fontSize: "1.1rem" }}>{t("dashboard.tablaSemana.title")}</h2>
        </header>

        {solicitudActiva === null ? (
          <p className="empty-state">No hay planificación activa esta semana.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table table--dense">
              <thead>
                <tr>
                  <th scope="col">Material</th>
                  <th scope="col" className="table__col--numeric">Viajes</th>
                  <th scope="col" className="table__col--numeric">Confirmados</th>
                  <th scope="col" className="table__col--numeric">Reales</th>
                  <th scope="col" className="table__col--numeric">Desviación</th>
                </tr>
              </thead>
              <tbody>
                {solicitudActiva.lineas.map((lineaSolicitud) => {
                  const planificados = sumaViajes(lineaSolicitud);
                  const lineasDistMaterial = lineasDist.filter((l) => l.lineaSolicitudId === lineaSolicitud.id);
                  const confirmados = lineasDistMaterial
                    .filter((l) => l.confirmacionProveedor === "confirmada")
                    .reduce((sum, l) => sum + sumaViajes(l), 0);
                  const realesEntradas = state.entradasReales.filter(
                    (e) => e.materialId === lineaSolicitud.materialId && e.solicitudId === solicitudActiva.id
                  );
                  const reales = realesEntradas.length > 0 ? realesEntradas.reduce((sum, e) => sum + e.viajes, 0) : null;
                  const desviacion = reales !== null ? reales - confirmados : null;

                  return (
                    <>
                      {/* Fila material */}
                      <tr key={lineaSolicitud.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{lineaSolicitud.materialNom}</div>
                          {/* Proveedores inline con desglose por día */}
                          {lineasDistMaterial.length > 0 && (
                            <div style={{ marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                              {lineasDistMaterial.map((ld) => (
                                <div key={ld.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.76rem", color: "var(--c-neutral-600)", flexWrap: "wrap" }}>
                                  <span style={{ color: "var(--c-neutral-300)" }}>↳</span>
                                  <span style={{ fontWeight: 600, color: "var(--c-neutral-700)" }}>{ld.proveedorNom}</span>
                                  <span style={{ color: "var(--c-neutral-400)" }}>·</span>
                                  <span style={{ color: "var(--c-neutral-500)" }}>{ld.transportistaNom}</span>
                                  <span style={{ color: "var(--c-neutral-300)" }}>|</span>
                                  {(["dl","dt","dc","dj","dv","ds","dg"] as const).map((k, i) => (
                                    ld[k] > 0
                                      ? <span key={k} style={{ color: "var(--c-neutral-600)" }}>
                                          <span style={{ color: "var(--c-neutral-400)", fontSize: "0.68rem" }}>{"LMXJVSD"[i]}</span>{ld[k]}
                                        </span>
                                      : null
                                  ))}
                                  <span style={{ color: "var(--c-neutral-400)", fontSize: "0.72rem" }}>({sumaViajes(ld)}v)</span>
                                  <span className={confirmacionPillClass(ld.confirmacionProveedor)} style={{ fontSize: "0.65rem", padding: "0 5px" }}>
                                    {confirmacionLabel(ld.confirmacionProveedor)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="table__col--numeric">{planificados}</td>
                        <td className="table__col--numeric">{confirmados || "—"}</td>
                        <td className="table__col--numeric">{reales ?? "—"}</td>
                        <td className={`table__col--numeric ${desviacion !== null && desviacion < 0 ? "combustibles__cell--danger" : desviacion !== null && desviacion > 0 ? "combustibles__cell--warning" : ""}`}>
                          {desviacion !== null ? (desviacion > 0 ? `+${desviacion}` : desviacion) : "—"}
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Accesos rápidos */}
      <section className="page">
        <header className="page__header">
          <h2 style={{ fontSize: "1.1rem" }}>{t("dashboard.accesosRapidos.title")}</h2>
        </header>
        <div className="combustibles-quick-grid">
          <Link to="/combustibles/solicitudes-recibidas" className="combustibles-quick-card">
            <div className="combustibles-quick-icon">
              <Inbox size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="combustibles-quick-title">Solicitudes recibidas</p>
              <p className="combustibles-quick-desc">Ver y gestionar las solicitudes enviadas por Producción</p>
            </div>
          </Link>
          <Link to="/combustibles/distribucion" className="combustibles-quick-card">
            <div className="combustibles-quick-icon">
              <TrendingUp size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="combustibles-quick-title">{t("dashboard.accesosRapidos.distribuir")}</p>
              <p className="combustibles-quick-desc">{t("dashboard.accesosRapidos.distribuirDesc")}</p>
            </div>
          </Link>
          <Link to="/combustibles/seguimiento" className="combustibles-quick-card">
            <div className="combustibles-quick-icon">
              <AlertTriangle size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="combustibles-quick-title">{t("dashboard.accesosRapidos.seguimiento")}</p>
              <p className="combustibles-quick-desc">{t("dashboard.accesosRapidos.seguimientoDesc")}</p>
            </div>
          </Link>
          <Link to="/combustibles/maestros" className="combustibles-quick-card">
            <div className="combustibles-quick-icon">
              <CheckCircle size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="combustibles-quick-title">{t("dashboard.accesosRapidos.maestros")}</p>
              <p className="combustibles-quick-desc">{t("dashboard.accesosRapidos.maestrosDesc")}</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
