import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle, BarChart2, Flame } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import {
  DASHBOARD_KPIS_MOCK,
  RESUMEN_SEMANA_MOCK,
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

export function DashboardPage() {
  const { t } = useTranslation("combustibles");
  const kpis = DASHBOARD_KPIS_MOCK;
  const resumen = RESUMEN_SEMANA_MOCK;
  const planActiva = PLANIFICACION_ACTIVA_MOCK;

  return (
    <div className="combustibles-dashboard">
      <DemoBanner />

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
          <Link to="/combustibles/solicitud" className="btn btn--primary">
            {t("dashboard.accesosRapidos.nuevaSolicitud")}
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

      {/* Tabla resumen semana */}
      <section className="page">
        <header className="page__header">
          <h2 style={{ fontSize: "1.1rem" }}>{t("dashboard.tablaSemana.title")}</h2>
        </header>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t("dashboard.tablaSemana.material")}</th>
                <th scope="col" className="table__col--numeric">{t("dashboard.tablaSemana.planificados")}</th>
                <th scope="col" className="table__col--numeric">{t("dashboard.tablaSemana.confirmados")}</th>
                <th scope="col" className="table__col--numeric">{t("dashboard.tablaSemana.reales")}</th>
                <th scope="col" className="table__col--numeric">{t("dashboard.tablaSemana.desviacion")}</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((fila) => (
                <tr key={fila.material}>
                  <td>{fila.material}</td>
                  <td className="table__col--numeric">{fila.planificados}</td>
                  <td className="table__col--numeric">{fila.confirmados}</td>
                  <td className="table__col--numeric">{fila.reales}</td>
                  <td className={`table__col--numeric ${fila.desviacion < 0 ? "combustibles__cell--danger" : fila.desviacion > 0 ? "combustibles__cell--warning" : ""}`}>
                    {fila.desviacion > 0 ? `+${fila.desviacion}` : fila.desviacion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="page">
        <header className="page__header">
          <h2 style={{ fontSize: "1.1rem" }}>{t("dashboard.accesosRapidos.title")}</h2>
        </header>
        <div className="combustibles-quick-grid">
          <Link to="/combustibles/solicitud" className="combustibles-quick-card">
            <div className="combustibles-quick-icon">
              <BarChart2 size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="combustibles-quick-title">{t("dashboard.accesosRapidos.nuevaSolicitud")}</p>
              <p className="combustibles-quick-desc">{t("dashboard.accesosRapidos.nuevaSolicitudDesc")}</p>
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
