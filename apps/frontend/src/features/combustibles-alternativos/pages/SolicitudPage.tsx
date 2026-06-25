import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trash2, Pencil, Lock } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog.js";
import { useCaStore, type DiaKey, type LineaSolicitud } from "../store/caStore.js";
import { useRole } from "../auth/useRole.js";

// ---------------------------------------------------------------------------
// Tipos locales del formulario agrupado
// ---------------------------------------------------------------------------

type LineaFormulario = {
  id: string;
  lineaSolicitudId?: number;
  materialId: number;
  materialNom: string;
  dl: number; dt: number; dc: number; dj: number; dv: number; ds: number; dg: number;
  obs: string;
};

type GrupoDestino = {
  id: string;
  destino: string;
  materiales: LineaFormulario[];
};

// ---------------------------------------------------------------------------
// Constantes de días
// ---------------------------------------------------------------------------

const DIAS: { key: DiaKey; labelKey: string }[] = [
  { key: "dl", labelKey: "dias.lunes" },
  { key: "dt", labelKey: "dias.martes" },
  { key: "dc", labelKey: "dias.miercoles" },
  { key: "dj", labelKey: "dias.jueves" },
  { key: "dv", labelKey: "dias.viernes" },
  { key: "ds", labelKey: "dias.sabado" },
  { key: "dg", labelKey: "dias.domingo" },
];

// ---------------------------------------------------------------------------
// Helpers de semana
// ---------------------------------------------------------------------------

function isoWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

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
  return generateWeeks().find((w) => w.value === semana)?.label ?? semana;
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

// ---------------------------------------------------------------------------
// Conversiones plano ↔ agrupado
// ---------------------------------------------------------------------------

function lineasToGrupos(lineas: LineaSolicitud[]): GrupoDestino[] {
  const mapaDestino = new Map<string, GrupoDestino>();
  for (const l of lineas) {
    const destino = l.destino ?? "";
    if (!mapaDestino.has(destino)) {
      mapaDestino.set(destino, {
        id: `grupo-${destino}-${Math.random().toString(36).slice(2)}`,
        destino,
        materiales: [],
      });
    }
    mapaDestino.get(destino)!.materiales.push({
      id: `linea-${l.id}-${Math.random().toString(36).slice(2)}`,
      lineaSolicitudId: l.id > 0 ? l.id : undefined,
      materialId: l.materialId,
      materialNom: l.materialNom,
      dl: l.dl, dt: l.dt, dc: l.dc, dj: l.dj, dv: l.dv, ds: l.ds, dg: l.dg,
      obs: l.obs,
    });
  }
  return [...mapaDestino.values()];
}

function gruposToLineas(grupos: GrupoDestino[]): LineaSolicitud[] {
  let tmpId = -1;
  return grupos.flatMap((g) =>
    g.materiales.map((m) => ({
      id: m.lineaSolicitudId ?? tmpId--,
      materialId: m.materialId,
      materialNom: m.materialNom,
      dl: m.dl, dt: m.dt, dc: m.dc, dj: m.dj, dv: m.dv, ds: m.ds, dg: m.dg,
      destino: g.destino,
      obs: m.obs,
    }))
  );
}

function sumaGrupo(linea: LineaFormulario): number {
  return linea.dl + linea.dt + linea.dc + linea.dj + linea.dv + linea.ds + linea.dg;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function SolicitudPage() {
  const { t } = useTranslation("combustibles");
  const { t: tCommon } = useTranslation("common");
  const { state, dispatch } = useCaStore();
  const { session } = useRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const semanaActual = `S${isoWeek(new Date())}`;
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(
    searchParams.get("semana") ?? semanaActual
  );

  // Lista completa de destinos: catálogo del store (activos) + cualquier destino configurado en plantilla
  const todosLosDestinos = useMemo(() => {
    const set = new Set<string>(
      state.destinos.filter((d) => d.activo).map((d) => d.nom)
    );
    for (const p of state.plantillaDistribucion) {
      if (p.activo && p.destino) set.add(p.destino);
    }
    return [...set].sort();
  }, [state.destinos, state.plantillaDistribucion]);

  const buildGruposDefault = (): GrupoDestino[] => {
    const mapaDestino = new Map<string, GrupoDestino>();
    const vistos = new Set<string>();
    for (const p of state.plantillaDistribucion) {
      if (!p.activo || !p.destino) continue;
      const clave = `${p.destino}||${p.materialId}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      if (!mapaDestino.has(p.destino)) {
        mapaDestino.set(p.destino, {
          id: `grupo-plantilla-${p.destino}-${Date.now()}`,
          destino: p.destino,
          materiales: [],
        });
      }
      mapaDestino.get(p.destino)!.materiales.push({
        id: `linea-plantilla-${p.id}-${Date.now()}`,
        materialId: p.materialId,
        materialNom: p.materialNom,
        dl: 0, dt: 0, dc: 0, dj: 0, dv: 0, ds: 0, dg: 0,
        obs: "",
      });
    }
    return [...mapaDestino.values()];
  };

  const solicitudExistente = useMemo(
    () => state.solicitudes.find((s) => s.semana === semanaSeleccionada),
    [state.solicitudes, semanaSeleccionada]
  );

  const gruposIniciales = useMemo((): GrupoDestino[] => {
    if (solicitudExistente) return lineasToGrupos(solicitudExistente.lineas);
    return buildGruposDefault();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitudExistente, state.plantillaDistribucion]);

  const [grupos, setGrupos] = useState<GrupoDestino[]>(gruposIniciales);

  // Sync cuando la plantilla llega después del primer render (estado de carga inicial)
  useEffect(() => {
    if (!solicitudExistente) {
      setGrupos(buildGruposDefault());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.plantillaDistribucion]);
  const [comentarioGeneral, setComentarioGeneral] = useState(
    solicitudExistente?.comentarioGeneral ?? ""
  );
  const [mantenimientosProgramados, setMantenimientosProgramados] = useState(
    solicitudExistente?.mantenimientosProgramados ?? ""
  );
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [showConfirmEnvio, setShowConfirmEnvio] = useState(false);

  // Modo edición de planificación ya enviada
  const [modoEdicion, setModoEdicion] = useState(false);
  const [gruposEdicion, setGruposEdicion] = useState<GrupoDestino[]>([]);
  const [motivoEdicion, setMotivoEdicion] = useState("");

  const modoLectura =
    solicitudExistente !== undefined &&
    solicitudExistente.estado !== "borrador";

  const puedeEditar =
    solicitudExistente !== undefined &&
    (
      solicitudExistente.estado === "enviada" ||
      solicitudExistente.estado === "en_distribucion" ||
      solicitudExistente.estado === "confirmada" ||
      solicitudExistente.estado === "cerrada"
    );

  useEffect(() => {
    if (searchParams.get("editar") === "1" && puedeEditar && !modoEdicion) {
      setGruposEdicion(lineasToGrupos((solicitudExistente ?? { lineas: [] }).lineas));
      setModoEdicion(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeEditar]);

  const hayConfirmacionesHechas = useMemo(() => {
    if (!solicitudExistente) return false;
    return state.distribucion
      .filter((l) => l.solicitudId === solicitudExistente.id)
      .some(
        (l) =>
          l.confirmacionProveedor !== "pendiente" ||
          l.confirmacionTransportista !== "pendiente"
      );
  }, [state.distribucion, solicitudExistente]);

  const showToast = (msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  };

  // ---------------------------------------------------------------------------
  // Handlers de grupos
  // ---------------------------------------------------------------------------

  const setterGrupos = modoEdicion ? setGruposEdicion : setGrupos;

  const handleSeleccionarSemana = (semana: string) => {
    setSemanaSeleccionada(semana);
    const sol = state.solicitudes.find((s) => s.semana === semana);
    setGrupos(sol ? lineasToGrupos(sol.lineas) : buildGruposDefault());
    setComentarioGeneral(sol?.comentarioGeneral ?? "");
    setMantenimientosProgramados(sol?.mantenimientosProgramados ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAñadirGrupo = () => {
    setterGrupos((prev) => [
      ...prev,
      {
        id: `grupo-new-${Date.now()}`,
        destino: "",
        materiales: [],
      },
    ]);
  };

  const handleEliminarGrupo = (grupoId: string) => {
    setterGrupos((prev) => prev.filter((g) => g.id !== grupoId));
  };

  const handleDestinoGrupoChange = (grupoId: string, value: string) => {
    setterGrupos((prev) =>
      prev.map((g) => (g.id === grupoId ? { ...g, destino: value } : g))
    );
  };

  const handleAñadirMaterial = (grupoId: string) => {
    setterGrupos((prev) =>
      prev.map((g) => {
        if (g.id !== grupoId) return g;
        const nuevaLinea: LineaFormulario = {
          id: `linea-new-${Date.now()}`,
          materialId: 0,
          materialNom: "",
          dl: 0, dt: 0, dc: 0, dj: 0, dv: 0, ds: 0, dg: 0,
          obs: "",
        };
        return { ...g, materiales: [...g.materiales, nuevaLinea] };
      })
    );
  };

  const handleEliminarMaterial = (grupoId: string, lineaId: string) => {
    setterGrupos((prev) =>
      prev.map((g) =>
        g.id !== grupoId
          ? g
          : { ...g, materiales: g.materiales.filter((m) => m.id !== lineaId) }
      )
    );
  };

  const handleMaterialChange = (grupoId: string, lineaId: string, materialId: number) => {
    const mat = state.materiales.find((m) => m.id === materialId);
    if (!mat) return;
    setterGrupos((prev) =>
      prev.map((g) =>
        g.id !== grupoId
          ? g
          : {
              ...g,
              materiales: g.materiales.map((m) =>
                m.id !== lineaId
                  ? m
                  : { ...m, materialId: mat.id, materialNom: mat.nom }
              ),
            }
      )
    );
  };

  const handleCeldaChange = (grupoId: string, lineaId: string, dia: DiaKey, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setterGrupos((prev) =>
      prev.map((g) =>
        g.id !== grupoId
          ? g
          : {
              ...g,
              materiales: g.materiales.map((m) =>
                m.id !== lineaId ? m : { ...m, [dia]: num }
              ),
            }
      )
    );
  };

  const handleObsChange = (grupoId: string, lineaId: string, value: string) => {
    setterGrupos((prev) =>
      prev.map((g) =>
        g.id !== grupoId
          ? g
          : {
              ...g,
              materiales: g.materiales.map((m) =>
                m.id !== lineaId ? m : { ...m, obs: value }
              ),
            }
      )
    );
  };

  // ---------------------------------------------------------------------------
  // Edición
  // ---------------------------------------------------------------------------

  const handleIniciarEdicion = () => {
    if (!solicitudExistente) return;
    setGruposEdicion(lineasToGrupos(solicitudExistente.lineas));
    setMotivoEdicion("");
    setModoEdicion(true);
  };

  const handleCancelarEdicion = () => {
    setModoEdicion(false);
    setGruposEdicion([]);
    setMotivoEdicion("");
  };

  const handleGuardarEdicion = () => {
    if (!solicitudExistente || !motivoEdicion.trim()) return;
    const lineas = gruposToLineas(gruposEdicion);
    dispatch({
      type: "EDITAR_SOLICITUD",
      solicitudId: solicitudExistente.id,
      lineas: lineas.map((l) => ({
        id: l.id,
        dl: l.dl, dt: l.dt, dc: l.dc, dj: l.dj, dv: l.dv, ds: l.ds, dg: l.dg,
        destino: l.destino,
      })),
      motivo: motivoEdicion.trim(),
      comentarioGeneral,
      mantenimientosProgramados,
    });
    setGrupos(gruposEdicion.map((g) => ({ ...g, materiales: g.materiales.map((m) => ({ ...m })) })));
    setModoEdicion(false);
    setGruposEdicion([]);
    setMotivoEdicion("");
    showToast(t("solicitud.toast.guardado"));
  };

  // ---------------------------------------------------------------------------
  // Guardar / enviar
  // ---------------------------------------------------------------------------

  const handleGuardarBorrador = () => {
    if (modoLectura) return;
    const lineas = gruposToLineas(grupos);
    dispatch({
      type: "GUARDAR_BORRADOR",
      solicitud: {
        id: solicitudExistente?.id,
        semana: semanaSeleccionada,
        ...semanaToRange(semanaSeleccionada),
        creadaPor: session?.nombre ?? "produccion",
        comentarioGeneral,
        mantenimientosProgramados,
        lineas,
        historial: solicitudExistente?.historial ?? [],
      },
    });
    showToast(t("solicitud.toast.guardado"));
  };

  const handleEnviarCompras = () => {
    setShowConfirmEnvio(false);
    const lineas = gruposToLineas(grupos);
    if (solicitudExistente?.estado === "borrador") {
      dispatch({
        type: "GUARDAR_Y_ENVIAR",
        solicitud: {
          id: solicitudExistente.id,
          semana: semanaSeleccionada,
          ...semanaToRange(semanaSeleccionada),
          creadaPor: session?.nombre ?? "produccion",
          comentarioGeneral,
          mantenimientosProgramados,
          lineas,
          historial: solicitudExistente.historial ?? [],
        },
      });
    } else {
      dispatch({
        type: "GUARDAR_Y_ENVIAR",
        solicitud: {
          semana: semanaSeleccionada,
          ...semanaToRange(semanaSeleccionada),
          creadaPor: session?.nombre ?? "produccion",
          comentarioGeneral,
          mantenimientosProgramados,
          lineas,
          historial: [],
        },
      });
    }
    showToast(t("solicitud.toast.enviado"));
    window.setTimeout(() => {
      void navigate("/combustibles/solicitud/mis-solicitudes");
    }, 1200);
  };

  const semanas = generateWeeks();

  // ---------------------------------------------------------------------------
  // Render del formulario agrupado
  // ---------------------------------------------------------------------------

  const renderGruposFormulario = (
    gruposData: GrupoDestino[],
    soloLectura: boolean
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {gruposData.map((grupo) => {
        const materialesUsadosEnGrupo = new Set(grupo.materiales.map((m) => m.materialId));
        return (
          <div key={grupo.id} className="solicitud-grupo">
            {/* Cabecera del grupo destino */}
            <div className="solicitud-grupo__header">
              <span className="solicitud-grupo__header-label">
                {t("solicitud.grupos.destinoLabel")}
              </span>
              {soloLectura ? (
                <span className="solicitud-grupo__header-value">{grupo.destino || "—"}</span>
              ) : (
                <select
                  value={grupo.destino}
                  aria-label={t("solicitud.grupos.destinoLabel")}
                  onChange={(e) => handleDestinoGrupoChange(grupo.id, e.target.value)}
                >
                  <option value="">{t("solicitud.grupos.destinoPlaceholder")}</option>
                  {todosLosDestinos.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
              {!soloLectura && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  aria-label={t("solicitud.grupos.eliminarDestino")}
                  style={{ marginLeft: "auto", color: "var(--c-neutral-0)", borderColor: "rgba(255,255,255,0.3)" }}
                  onClick={() => handleEliminarGrupo(grupo.id)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  {" "}{t("solicitud.grupos.eliminarDestino")}
                </button>
              )}
            </div>

            {/* Tabla de materiales dentro del grupo */}
            <div className="solicitud-grupo__body">
              {grupo.materiales.length > 0 && (
                <div className="table-wrapper">
                  <table className="table solicitud-tabla" style={{ fontSize: "0.88rem", tableLayout: "fixed", width: "100%" }}>
                    <colgroup>
                      <col style={{ minWidth: "140px" }} />
                      {DIAS.map((d) => <col key={d.key} style={{ width: "52px" }} />)}
                      <col style={{ width: "62px" }} />
                      <col />
                      {!soloLectura && <col style={{ width: "48px" }} />}
                    </colgroup>
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
                        {!soloLectura && (
                          <th scope="col" className="table__col--actions" aria-label="Acciones" />
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.materiales.map((linea) => (
                        <tr key={linea.id}>
                          <td className="combustibles-material-cell">
                            {soloLectura ? (
                              <span>{linea.materialNom}</span>
                            ) : (
                              <select
                                value={linea.materialId || ""}
                                aria-label={t("solicitud.columns.material")}
                                style={{ minWidth: "140px", fontSize: "0.85rem" }}
                                onChange={(e) =>
                                  handleMaterialChange(grupo.id, linea.id, Number(e.target.value))
                                }
                              >
                                <option value="">{t("solicitud.grupos.materialPlaceholder")}</option>
                                {state.materiales
                                  .filter(
                                    (m) =>
                                      m.activo &&
                                      (!materialesUsadosEnGrupo.has(m.id) || m.id === linea.materialId)
                                  )
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>{m.nom}</option>
                                  ))}
                              </select>
                            )}
                          </td>
                          {DIAS.map((d) => (
                            <td
                              key={d.key}
                              className="table__col--numeric combustibles-dia-col"
                              data-label={t(d.labelKey)}
                            >
                              {soloLectura ? (
                                linea[d.key]
                              ) : (
                                <input
                                  type="number"
                                  min={0}
                                  className="combustibles-num-input"
                                  value={linea[d.key] === 0 ? "" : linea[d.key]}
                                  aria-label={`${linea.materialNom} ${t(d.labelKey)}`}
                                  onChange={(e) =>
                                    handleCeldaChange(grupo.id, linea.id, d.key, e.target.value)
                                  }
                                />
                              )}
                            </td>
                          ))}
                          <td className="table__col--numeric col-total" style={{ fontWeight: 700 }}>
                            {sumaGrupo(linea)}
                          </td>
                          <td className="col-nota">
                            {soloLectura ? (
                              <span className="table__col--muted">{linea.obs}</span>
                            ) : (
                              <input
                                type="text"
                                className="combustibles-comment-input"
                                placeholder={t("solicitud.comentarioLinea")}
                                value={linea.obs}
                                aria-label={`Nota ${linea.materialNom}`}
                                onChange={(e) => handleObsChange(grupo.id, linea.id, e.target.value)}
                              />
                            )}
                          </td>
                          {!soloLectura && (
                            <td className="table__col--actions col-actions">
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm btn--danger-ghost"
                                aria-label={t("solicitud.grupos.eliminarMaterial")}
                                onClick={() => handleEliminarMaterial(grupo.id, linea.id)}
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!soloLectura && (
                <div style={{ padding: "0.5rem 1rem" }}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleAñadirMaterial(grupo.id)}
                  >
                    {t("solicitud.grupos.añadirMaterial")}
                  </button>
                </div>
              )}
              {soloLectura && grupo.materiales.length === 0 && (
                <p
                  style={{
                    padding: "0.5rem 1rem",
                    color: "var(--c-neutral-400)",
                    fontStyle: "italic",
                    fontSize: "0.85rem",
                  }}
                >
                  —
                </p>
              )}
            </div>
          </div>
        );
      })}

      {!soloLectura && (
        <div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={handleAñadirGrupo}
          >
            {t("solicitud.grupos.añadirDestino")}
          </button>
        </div>
      )}

      {soloLectura && gruposData.length === 0 && (
        <p style={{ color: "var(--c-neutral-400)", fontStyle: "italic" }}>—</p>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // JSX principal
  // ---------------------------------------------------------------------------

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

        {/* Banner modo lectura con botón editar */}
        {modoLectura && !modoEdicion && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              background: "var(--c-neutral-50)",
              border: "1px solid var(--c-neutral-200)",
              borderRadius: "8px",
              padding: "0.85rem 1.1rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Lock size={15} style={{ color: "var(--c-neutral-400)", flexShrink: 0 }} aria-hidden="true" />
              <span style={{ fontSize: "0.875rem", color: "var(--c-neutral-600)" }}>
                Esta planificación ya ha sido enviada. Está en modo solo lectura.
              </span>
            </div>
            {puedeEditar && (
              <button
                type="button"
                onClick={handleIniciarEdicion}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "white",
                  background: "var(--c-primary-500, #003e39)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Pencil size={14} aria-hidden="true" />
                Editar planificación
              </button>
            )}
          </div>
        )}

        {/* Aviso invalidación de confirmaciones */}
        {modoEdicion && hayConfirmacionesHechas && (
          <div
            className="toast toast--warning"
            role="status"
            style={{ marginBottom: "1rem" }}
          >
            {t("solicitud.modoLectura.avisoConfirmaciones")}
          </div>
        )}

        {/* Grupos destino→material */}
        {modoEdicion
          ? renderGruposFormulario(gruposEdicion, false)
          : renderGruposFormulario(grupos, modoLectura)}

        {/* Panel motivo y acciones en modo edición */}
        {modoEdicion && (
          <div
            style={{
              background: "var(--c-neutral-50)",
              border: "1px solid var(--c-neutral-200)",
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              marginTop: "1rem",
            }}
          >
            <div className="form__field">
              <label htmlFor="motivo-edicion">
                {t("solicitud.grupos.motivoEdicion")}
              </label>
              <textarea
                id="motivo-edicion"
                rows={3}
                value={motivoEdicion}
                placeholder={t("solicitud.grupos.motivoEdicionPlaceholder")}
                onChange={(e) => setMotivoEdicion(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!motivoEdicion.trim()}
                onClick={handleGuardarEdicion}
              >
                {t("solicitud.grupos.guardarCambios")}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleCancelarEdicion}
              >
                {t("solicitud.grupos.cancelar")}
              </button>
            </div>
          </div>
        )}

        {/* Comentario general */}
        <div className="form__field" style={{ marginTop: "1rem" }}>
          <label htmlFor="comentario-general">
            {t("solicitud.comentarioGeneral")}
          </label>
          {modoLectura && !modoEdicion ? (
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

        {/* Mantenimientos programados */}
        <div className="form__field" style={{ marginTop: "0.75rem" }}>
          <label htmlFor="mantenimientos-programados">
            Mantenimientos programados
          </label>
          {modoLectura && !modoEdicion ? (
            <p style={{ color: "var(--c-neutral-600)" }}>{mantenimientosProgramados || "—"}</p>
          ) : (
            <textarea
              id="mantenimientos-programados"
              rows={3}
              value={mantenimientosProgramados}
              placeholder="Indica aquí los mantenimientos previstos que puedan afectar al suministro esta semana…"
              onChange={(e) => setMantenimientosProgramados(e.target.value)}
            />
          )}
        </div>

        {/* Historial de cambios */}
        {solicitudExistente && (solicitudExistente.historial ?? []).length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--c-neutral-700)", marginBottom: "0.75rem" }}>
              {t("solicitudesRecibidas.detalle.historialCambios")}
            </h3>
            <div className="table-wrapper">
              <table className="table table--dense" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th scope="col">{t("solicitudesRecibidas.detalle.historial.fecha")}</th>
                    <th scope="col">{t("solicitudesRecibidas.detalle.historial.autor")}</th>
                    <th scope="col">{t("solicitudesRecibidas.detalle.historial.motivo")}</th>
                    <th scope="col">{t("solicitudesRecibidas.detalle.historial.descripcion")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(solicitudExistente.historial ?? [])]
                    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                    .map((entrada) => (
                      <tr key={entrada.id}>
                        <td style={{ whiteSpace: "nowrap", color: "var(--c-neutral-500)" }}>
                          {new Date(entrada.ts).toLocaleString("es-ES", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td>
                          <span
                            className={entrada.autor === "produccion" ? "pill pill--primary" : "pill pill--danger"}
                            style={{ fontSize: "0.75rem" }}
                          >
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
          </div>
        )}
      </section>

      {/* Historial de semanas */}
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
                <th scope="col">{t("solicitudesRecibidas.columns.fecha")}</th>
                <th scope="col">{t("estados.confirmada")}</th>
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
                            {t("misSolicitudes.acciones.continuarEditando")}
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

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className="toast toast--success">{t.msg}</div>
        ))}
      </div>

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
