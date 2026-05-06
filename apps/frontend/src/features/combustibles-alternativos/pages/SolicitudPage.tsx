import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog.js";
import { useCaStore, sumaViajes, type DiaKey, type LineaSolicitud } from "../store/caStore.js";
import { useRole } from "../auth/useRole.js";

const DIAS: { key: DiaKey; labelKey: string }[] = [
  { key: "dl", labelKey: "dias.lunes" },
  { key: "dt", labelKey: "dias.martes" },
  { key: "dc", labelKey: "dias.miercoles" },
  { key: "dj", labelKey: "dias.jueves" },
  { key: "dv", labelKey: "dias.viernes" },
  { key: "ds", labelKey: "dias.sabado" },
  { key: "dg", labelKey: "dias.domingo" },
];

/** Calcula el número de semana ISO a partir de una fecha */
function isoWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/** Devuelve el lunes de la semana ISO n del año dado */
function mondayOfIsoWeek(week: number, year: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const mon1 = new Date(jan4);
  mon1.setUTCDate(jan4.getUTCDate() - dow + 1);
  const result = new Date(mon1);
  result.setUTCDate(mon1.getUTCDate() + (week - 1) * 7);
  return result;
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** Devuelve { ini, fi } en formato YYYY-MM-DD para el código "S{n}" */
function semanaToRange(semana: string): { ini: string; fi: string } {
  const n = parseInt(semana.replace("S", ""), 10);
  const year = new Date().getFullYear();
  const mon = mondayOfIsoWeek(n, year);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  return {
    ini: mon.toISOString().slice(0, 10),
    fi: sun.toISOString().slice(0, 10),
  };
}

/** Genera las semanas desde (actual - 2) hasta (actual + 8) con rango de fechas */
function generateWeeks(): { value: string; label: string }[] {
  const now = new Date();
  const currentWeek = isoWeek(now);
  const currentYear = now.getFullYear();
  const weeks: { value: string; label: string }[] = [];
  for (let offset = -2; offset <= 8; offset++) {
    let w = currentWeek + offset;
    let y = currentYear;
    if (w < 1) { w += 52; y -= 1; }
    if (w > 52) { w -= 52; y += 1; }
    const mon = mondayOfIsoWeek(w, y);
    const sun = new Date(mon);
    sun.setUTCDate(mon.getUTCDate() + 6);
    const rangoLabel = `${p2(mon.getUTCDate())}/${p2(mon.getUTCMonth() + 1)} – ${p2(sun.getUTCDate())}/${p2(sun.getUTCMonth() + 1)}/${sun.getUTCFullYear()}`;
    weeks.push({ value: `S${w}`, label: `S${w} · ${rangoLabel}` });
  }
  return weeks;
}

function weekLabel(semana: string): string {
  const weeks = generateWeeks();
  return weeks.find((w) => w.value === semana)?.label ?? semana;
}

function estadoPillClass(estado: string): string {
  switch (estado) {
    case "borrador":        return "pill pill--muted";
    case "enviada":         return "pill pill--primary";
    case "en_distribucion": return "pill pill--warning";
    case "confirmada":      return "pill pill--success";
    case "cerrada":         return "pill pill--muted";
    default:                return "pill pill--muted";
  }
}

export function SolicitudPage() {
  const { t } = useTranslation("combustibles");
  const { t: tCommon } = useTranslation("common");
  const { state, dispatch } = useCaStore();
  const { session } = useRole();
  const navigate = useNavigate();

  // Semana actual en formato "S{n}"
  const semanaActual = `S${isoWeek(new Date())}`;
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(semanaActual);

  // Buscar solicitud existente para la semana seleccionada
  const solicitudExistente = useMemo(
    () => state.solicitudes.find((s) => s.semana === semanaSeleccionada),
    [state.solicitudes, semanaSeleccionada]
  );

  // Construir líneas editables iniciales desde el store o desde los materiales activos
  const lineasIniciales = useMemo((): LineaSolicitud[] => {
    if (solicitudExistente) return solicitudExistente.lineas;
    return state.materiales
      .filter((m) => m.activo)
      .map((m, i) => ({
        id: i + 1,
        materialId: m.id,
        materialNom: m.nom,
        dl: 0, dt: 0, dc: 0, dj: 0, dv: 0, ds: 0, dg: 0,
        obs: "",
      }));
  }, [solicitudExistente, state.materiales]);

  const [lineas, setLineas] = useState<LineaSolicitud[]>(lineasIniciales);
  const [comentarioGeneral, setComentarioGeneral] = useState(
    solicitudExistente?.comentarioGeneral ?? ""
  );
  const [toast, setToast] = useState<string | null>(null);
  const [showConfirmEnvio, setShowConfirmEnvio] = useState(false);

  const modoLectura =
    solicitudExistente !== undefined &&
    solicitudExistente.estado !== "borrador";

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleSeleccionarSemana = (semana: string) => {
    setSemanaSeleccionada(semana);
    const sol = state.solicitudes.find((s) => s.semana === semana);
    setLineas(
      sol
        ? sol.lineas
        : state.materiales
            .filter((m) => m.activo)
            .map((m, i) => ({
              id: i + 1,
              materialId: m.id,
              materialNom: m.nom,
              dl: 0, dt: 0, dc: 0, dj: 0, dv: 0, ds: 0, dg: 0,
              obs: "",
            }))
    );
    setComentarioGeneral(sol?.comentarioGeneral ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCeldaChange = (lineaId: number, dia: DiaKey, value: string) => {
    if (modoLectura) return;
    const num = Math.max(0, parseInt(value, 10) || 0);
    setLineas((prev) =>
      prev.map((l) => (l.id === lineaId ? { ...l, [dia]: num } : l))
    );
  };

  const handleObsChange = (lineaId: number, value: string) => {
    if (modoLectura) return;
    setLineas((prev) =>
      prev.map((l) => (l.id === lineaId ? { ...l, obs: value } : l))
    );
  };

  const handleGuardarBorrador = () => {
    if (modoLectura) return;
    dispatch({
      type: "GUARDAR_BORRADOR",
      solicitud: {
        id: solicitudExistente?.id,
        semana: semanaSeleccionada,
        ...semanaToRange(semanaSeleccionada),
        creadaPor: session?.nombre ?? "produccion",
        comentarioGeneral,
        lineas,
      },
    });
    showToast(t("solicitud.toast.guardado"));
  };

  const handleEnviarCompras = () => {
    setShowConfirmEnvio(false);
    if (solicitudExistente?.estado === "borrador") {
      // Ya existe como borrador — la marcamos enviada en un solo dispatch
      dispatch({
        type: "GUARDAR_Y_ENVIAR",
        solicitud: {
          id: solicitudExistente.id,
          semana: semanaSeleccionada,
          ...semanaToRange(semanaSeleccionada),
          creadaPor: session?.nombre ?? "produccion",
          comentarioGeneral,
          lineas,
        },
      });
    } else {
      // Nueva solicitud — crea y envía en un solo dispatch
      dispatch({
        type: "GUARDAR_Y_ENVIAR",
        solicitud: {
          semana: semanaSeleccionada,
          ...semanaToRange(semanaSeleccionada),
          creadaPor: session?.nombre ?? "produccion",
          comentarioGeneral,
          lineas,
        },
      });
    }
    showToast(t("solicitud.toast.enviado"));
    window.setTimeout(() => {
      void navigate("/combustibles/solicitud/mis-solicitudes");
    }, 1200);
  };

  const semanas = generateWeeks();

  return (
    <div className="combustibles-page">
      <DemoBanner />

      <section className="page">
        <header className="page__header">
          <div>
            <h2>{t("solicitud.title")}</h2>
            <p className="page__subtitle">{t("solicitud.subtitle")}</p>
          </div>
          {!modoLectura && (
            <div className="combustibles-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleGuardarBorrador}
              >
                {t("solicitud.guardarBorrador")}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setShowConfirmEnvio(true)}
              >
                {t("solicitud.enviarCompras")}
              </button>
            </div>
          )}
        </header>

        {toast && (
          <div className="toast toast--success" role="status">
            {toast}
          </div>
        )}

        {/* Selector de semana */}
        <div className="combustibles-semana-bar">
          <div className="form__field" style={{ marginBottom: 0 }}>
            <label htmlFor="semana-selector">{t("solicitud.semanaLabel")}</label>
            <select
              id="semana-selector"
              value={semanaSeleccionada}
              style={{ maxWidth: "200px" }}
              onChange={(e) => handleSeleccionarSemana(e.target.value)}
            >
              {semanas.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          {solicitudExistente && (
            <span className={estadoPillClass(solicitudExistente.estado)}>
              {t(`estados.${solicitudExistente.estado}`)}
            </span>
          )}
        </div>

        {/* Aviso si ya existe solicitud en estado superior */}
        {modoLectura && (
          <div
            className="toast toast--warning"
            role="status"
            style={{ marginBottom: "1rem" }}
          >
            Ya existe una solicitud enviada para esta semana. Vista en modo solo lectura.
          </div>
        )}

        {/* Tabla de viajes */}
        <div className="table-wrapper">
          <table className="table combustibles-solicitud-table">
            <thead>
              <tr>
                <th scope="col">{t("solicitud.columns.material")}</th>
                {DIAS.map((d) => (
                  <th
                    key={d.key}
                    scope="col"
                    className="table__col--numeric combustibles-dia-col"
                  >
                    {t(d.labelKey)}
                  </th>
                ))}
                <th scope="col" className="table__col--numeric">
                  {t("solicitud.columns.total")}
                </th>
                <th scope="col">{t("solicitud.columns.comentario")}</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea) => (
                <tr key={linea.id}>
                  <td className="combustibles-material-cell">{linea.materialNom}</td>
                  {DIAS.map((d) => (
                    <td
                      key={d.key}
                      className="table__col--numeric combustibles-dia-col"
                    >
                      {modoLectura ? (
                        linea[d.key]
                      ) : (
                        <input
                          type="number"
                          min={0}
                          className="combustibles-num-input"
                          value={linea[d.key]}
                          aria-label={`${linea.materialNom} ${t(d.labelKey)}`}
                          onChange={(e) =>
                            handleCeldaChange(linea.id, d.key, e.target.value)
                          }
                        />
                      )}
                    </td>
                  ))}
                  <td
                    className="table__col--numeric"
                    style={{ fontWeight: 700 }}
                  >
                    {sumaViajes(linea)}
                  </td>
                  <td>
                    {modoLectura ? (
                      <span className="table__col--muted">{linea.obs}</span>
                    ) : (
                      <input
                        type="text"
                        className="combustibles-comment-input"
                        placeholder={t("solicitud.comentarioLinea")}
                        value={linea.obs}
                        aria-label={`Nota ${linea.materialNom}`}
                        onChange={(e) =>
                          handleObsChange(linea.id, e.target.value)
                        }
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comentario general */}
        <div className="form__field">
          <label htmlFor="comentario-general">
            {t("solicitud.comentarioGeneral")}
          </label>
          {modoLectura ? (
            <p style={{ color: "var(--c-neutral-600)" }}>{comentarioGeneral || "—"}</p>
          ) : (
            <textarea
              id="comentario-general"
              rows={3}
              value={comentarioGeneral}
              placeholder={t("solicitud.comentarioGeneralPlaceholder")}
              onChange={(e) => setComentarioGeneral(e.target.value)}
            />
          )}
        </div>
      </section>

      {/* Historial */}
      <section className="page">
        <header className="page__header">
          <h2 style={{ fontSize: "1.1rem" }}>{t("solicitud.historial.title")}</h2>
        </header>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t("solicitud.historial.semana")}</th>
                <th scope="col">{t("solicitud.historial.estado")}</th>
                <th scope="col">Enviada</th>
                <th scope="col">Confirmada</th>
                <th scope="col" className="table__col--actions">
                  {t("solicitud.historial.acciones")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...state.solicitudes]
                .sort((a, b) => {
                  const na = parseInt(a.semana.replace("S", ""), 10);
                  const nb = parseInt(b.semana.replace("S", ""), 10);
                  return nb - na;
                })
                .map((s) => {
                  // Fecha de confirmación: última confirmación de las líneas de esta solicitud
                  const lineaIds = state.distribucion
                    .filter((l) => l.solicitudId === s.id)
                    .map((l) => l.id);
                  const tsConfirmacion = state.confirmaciones
                    .filter((c) => lineaIds.includes(c.lineaDistribucionId))
                    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0]?.ts ?? null;

                  const fmtFecha = (iso: string) =>
                    new Date(iso).toLocaleString("es-ES", {
                      day: "2-digit", month: "2-digit", year: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    });

                  return (
                    <tr key={s.id}>
                      <td>{weekLabel(s.semana)}</td>
                      <td>
                        <span className={estadoPillClass(s.estado)}>
                          {t(`estados.${s.estado}`)}
                        </span>
                      </td>
                      <td className="table__col--muted" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                        {s.estado !== "borrador" ? fmtFecha(s.ts) : "—"}
                      </td>
                      <td className="table__col--muted" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                        {s.estado === "confirmada" && tsConfirmacion ? fmtFecha(tsConfirmacion) : "—"}
                      </td>
                      <td className="table__col--actions">
                        {s.estado === "borrador" ? (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleSeleccionarSemana(s.semana)}
                          >
                            Continuar editando
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleSeleccionarSemana(s.semana)}
                          >
                            {tCommon("actions.view")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={showConfirmEnvio}
        title={t("solicitud.confirm.enviarTitle")}
        description={t("solicitud.confirm.enviar")}
        confirmLabel={t("solicitud.enviarCompras")}
        cancelLabel={tCommon("actions.cancel")}
        tone="default"
        onConfirm={handleEnviarCompras}
        onCancel={() => setShowConfirmEnvio(false)}
      />
    </div>
  );
}
