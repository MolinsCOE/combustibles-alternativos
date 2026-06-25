import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, sumaViajes, type LineaDistribucion } from "../store/caStore.js";
import { HorarioLlegadasGrid } from "../components/HorarioLlegadasGrid.js";

const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;
const DIAS_KEYS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"] as const;
type DiaKey = typeof DIAS_KEYS[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function viajesEfectivosLinea(linea: LineaDistribucion, dia: DiaKey): number {
  if (linea.confirmacionProveedor !== "confirmada") return 0;

  const tieneTransportista = linea.transportistaId > 0;

  if (tieneTransportista && linea.confirmacionTransportista !== "confirmada") return 0;

  const cantProv =
    linea.cantidadesProveedor?.[dia] !== undefined
      ? linea.cantidadesProveedor[dia]
      : linea[dia];

  if (!tieneTransportista) return cantProv;

  const cantTrans =
    linea.cantidadesTransportista?.[dia] !== undefined
      ? linea.cantidadesTransportista[dia]
      : linea[dia];

  return Math.min(cantProv, cantTrans);
}

function hayDiscrepancia(linea: LineaDistribucion): boolean {
  if (linea.confirmacionProveedor !== "confirmada") return false;
  if (linea.transportistaId <= 0) return false;
  if (linea.confirmacionTransportista !== "confirmada") return false;

  return DIAS_KEYS.some((dia) => {
    const cantProv =
      linea.cantidadesProveedor?.[dia] !== undefined
        ? linea.cantidadesProveedor[dia]
        : linea[dia];
    const cantTrans =
      linea.cantidadesTransportista?.[dia] !== undefined
        ? linea.cantidadesTransportista[dia]
        : linea[dia];
    return cantProv !== cantTrans;
  });
}

function getFechaCorta(ini: string, diaIndex: number): string {
  const [y, m, d] = ini.split("-").map(Number);
  const date = new Date(y as number, (m as number) - 1, (d as number) + diaIndex);
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${String(date.getDate()).padStart(2, "0")} ${meses[date.getMonth()]}`;
}

export function EstadoSuministroPage() {
  const { t } = useTranslation("combustibles");
  const { state } = useCaStore();

  // Todas las solicitudes ya enviadas, de más reciente a más antigua
  const solicitudesDisponibles = useMemo(
    () =>
      state.solicitudes
        .filter((s) =>
          ["enviada", "en_distribucion", "confirmada", "cerrada"].includes(s.estado)
        )
        .sort((a, b) => new Date(b.ini).getTime() - new Date(a.ini).getTime()),
    [state.solicitudes]
  );

  const [solicitudId, setSolicitudId] = useState<number | null>(null);

  // Auto-selecciona la semana siguiente si existe; si no, la más reciente
  useEffect(() => {
    if (solicitudesDisponibles.length === 0) return;
    if (solicitudId !== null && solicitudesDisponibles.some((s) => s.id === solicitudId)) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const daysToNextMonday = dow === 0 ? 1 : 8 - dow;
    const nextMondayMs = today.getTime() + daysToNextMonday * 86400000;

    const proxSemana = solicitudesDisponibles.find((s) => {
      if (!s.ini) return false;
      const iniMs = new Date(s.ini + "T00:00:00").getTime();
      return iniMs >= nextMondayMs && iniMs < nextMondayMs + 7 * 86400000;
    });

    setSolicitudId(proxSemana?.id ?? solicitudesDisponibles[0]?.id ?? null);
  }, [solicitudesDisponibles, solicitudId]);

  const solicitudActiva = useMemo(
    () => solicitudesDisponibles.find((s) => s.id === solicitudId) ?? null,
    [solicitudesDisponibles, solicitudId]
  );

  const cerrada = solicitudActiva?.estado === "cerrada";

  const lineasDist = solicitudActiva
    ? state.distribucion.filter((l) => l.solicitudId === solicitudActiva.id)
    : [];

  // Día de hoy como DiaKey dentro de la semana activa (null si no estamos en esa semana)
  const todayDiaKey: DiaKey | null = (() => {
    if (!solicitudActiva?.ini) return null;
    const todayIso = new Date().toISOString().slice(0, 10);
    const [y, m, d] = solicitudActiva.ini.split("-").map(Number);
    for (let i = 0; i < 7; i++) {
      const date = new Date(y as number, (m as number) - 1, (d as number) + i);
      if (date.toISOString().slice(0, 10) === todayIso) return DIAS_KEYS[i] as DiaKey;
    }
    return null;
  })();

  function viajesRealesLinea(materialId: number): number {
    if (!solicitudActiva) return 0;
    return state.entradasReales
      .filter((e) => e.solicitudId === solicitudActiva.id && e.materialId === materialId)
      .reduce((s, e) => s + e.viajes, 0);
  }

  function viajesEfectivosLinea_id(lineaId: number, dia: DiaKey): number {
    return lineasDist
      .filter((l) => l.lineaSolicitudId === lineaId)
      .reduce((sum, l) => sum + viajesEfectivosLinea(l, dia), 0);
  }

  function hayDiscrepanciaLinea(lineaId: number): boolean {
    return lineasDist
      .filter((l) => l.lineaSolicitudId === lineaId)
      .some(hayDiscrepancia);
  }

  // ¿Alguna línea de distribución para este lineaSolicitudId tiene confirmación efectiva?
  function tieneConfirmacion(lineaId: number): boolean {
    return lineasDist
      .filter((l) => l.lineaSolicitudId === lineaId)
      .some((l) => l.confirmacionProveedor === "confirmada" || l.confirmacionProveedor === "rechazada");
  }

  // Líneas con viajes planificados (ocultar filas con totalPedido = 0)
  const lineasConViajes = solicitudActiva
    ? solicitudActiva.lineas.filter((l) => sumaViajes(l) > 0)
    : [];

  // Resumen de la semana
  const resumen = lineasConViajes.reduce(
    (acc, linea) => {
      const totalPedido = sumaViajes(linea);
      const totalConfirmado = DIAS_KEYS.reduce(
        (s, k) => s + viajesEfectivosLinea_id(linea.id, k),
        0
      );
      const hayConf = tieneConfirmacion(linea.id);
      acc.totalPedido += totalPedido;
      if (hayConf) acc.totalConfirmado += totalConfirmado;
      if (!hayConf) acc.sinConfirmar++;
      if (hayConf && totalConfirmado < totalPedido) acc.conDeficit++;
      return acc;
    },
    { totalPedido: 0, totalConfirmado: 0, sinConfirmar: 0, conDeficit: 0 }
  );

  return (
    <div className="combustibles-page">
      <DemoBanner />
      <section className="page">
        <header className="page__header">
          <div>
            <h2>{t("seguimiento.title")}</h2>
            <p className="page__subtitle">
              {t("seguimiento.subtitle")}
            </p>
          </div>
          {solicitudActiva && cerrada && (
            <span className="pill pill--muted">{t("estados.cerrada")}</span>
          )}
        </header>

        {/* Selector de semana */}
        {solicitudesDisponibles.length > 0 && (() => {
          const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--c-neutral-500)" }}>
                Semana:
              </span>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <select
                  value={solicitudId ?? ""}
                  onChange={(e) => setSolicitudId(Number(e.target.value))}
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    padding: "0.45rem 2.5rem 0.45rem 0.9rem",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    border: "none",
                    borderRadius: "8px",
                    background: "var(--c-primary-500, #003e39)",
                    color: "white",
                    cursor: "pointer",
                    outline: "none",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  }}
                >
                  {solicitudesDisponibles.map((s) => {
                    const ini = s.ini ? new Date(s.ini + "T00:00:00") : null;
                    const fi = s.fi ? new Date(s.fi + "T00:00:00") : null;
                    const rango = ini && fi
                      ? `${String(ini.getDate()).padStart(2,"0")} ${meses[ini.getMonth()]} – ${String(fi.getDate()).padStart(2,"0")} ${meses[fi.getMonth()]}`
                      : "";
                    return (
                      <option key={s.id} value={s.id}>
                        {s.semana}{rango ? `  ·  ${rango}` : ""}
                      </option>
                    );
                  })}
                </select>
                {/* Chevron */}
                <svg
                  style={{ position: "absolute", right: "0.6rem", pointerEvents: "none", color: "white" }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {solicitudActiva && (
                <span className={
                  solicitudActiva.estado === "cerrada" ? "pill pill--muted"
                  : solicitudActiva.estado === "confirmada" ? "pill pill--success"
                  : solicitudActiva.estado === "en_distribucion" ? "pill pill--primary"
                  : "pill pill--warning"
                }>
                  {solicitudActiva.estado === "cerrada" ? t("estados.cerrada")
                  : solicitudActiva.estado === "confirmada" ? "Confirmada"
                  : solicitudActiva.estado === "en_distribucion" ? "En distribución"
                  : "Enviada"}
                </span>
              )}
            </div>
          );
        })()}

        {!solicitudActiva && solicitudesDisponibles.length === 0 && (
          <p className="empty-state">{t("dashboard.sinPlanificacion")}</p>
        )}

        {solicitudActiva && (
          <>
            {/* Aviso de modificaciones */}
            {(solicitudActiva.historial ?? []).length > 0 && (
              <div
                style={{
                  background: "var(--c-neutral-50)",
                  border: "1px solid var(--c-neutral-200)",
                  borderRadius: "8px",
                  padding: "0.6rem 1rem",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                  color: "var(--c-neutral-700)",
                }}
              >
                Esta planificación ha sido modificada{" "}
                <strong>
                  {(solicitudActiva.historial ?? []).length}{" "}
                  {(solicitudActiva.historial ?? []).length === 1 ? "vez" : "veces"}
                </strong>
                . Último cambio:{" "}
                {new Date(
                  [...(solicitudActiva.historial ?? [])].sort(
                    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
                  )[0]?.ts ?? ""
                ).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                .
              </div>
            )}

            {/* Aviso cerrada */}
            {cerrada && (
              <div
                style={{
                  background: "var(--c-neutral-50)",
                  border: "1px solid var(--c-neutral-200)",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                  color: "var(--c-neutral-600)",
                }}
              >
                Compras ha cerrado esta planificación. Los viajes confirmados son el suministro definitivo para esta semana.
              </div>
            )}

            {/* Comentario general y mantenimientos */}
            {(solicitudActiva.comentarioGeneral || solicitudActiva.mantenimientosProgramados) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                {solicitudActiva.comentarioGeneral && (
                  <div style={{ flex: "1 1 240px", background: "var(--c-neutral-50)", border: "1px solid var(--c-neutral-200)", borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--c-neutral-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Comentario</span>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--c-neutral-700)", fontStyle: "italic" }}>{solicitudActiva.comentarioGeneral}</p>
                  </div>
                )}
                {solicitudActiva.mantenimientosProgramados && (
                  <div style={{ flex: "1 1 240px", background: "var(--c-warning-50, #fffbeb)", border: "1px solid var(--c-warning-200, #fde68a)", borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.85rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--c-warning-700, #b45309)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mantenimientos programados</span>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--c-neutral-700)", fontStyle: "italic" }}>{solicitudActiva.mantenimientosProgramados}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tarjetas resumen de la semana */}
            {lineasConViajes.length > 0 && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <div style={{ background: "var(--c-neutral-50)", border: "1px solid var(--c-neutral-200)", borderRadius: "8px", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px" }}>
                  <span style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1 }}>{resumen.totalPedido}</span>
                  <span style={{ fontSize: "0.73rem", color: "var(--c-neutral-500)", marginTop: "2px" }}>Viajes pedidos</span>
                </div>
                {resumen.totalConfirmado > 0 && (
                  <div style={{
                    background: resumen.totalConfirmado >= resumen.totalPedido ? "var(--c-success-50, #f0fdf4)" : "var(--c-warning-50, #fffbeb)",
                    border: `1px solid ${resumen.totalConfirmado >= resumen.totalPedido ? "var(--c-success-200, #bbf7d0)" : "var(--c-warning-200, #fde68a)"}`,
                    borderRadius: "8px", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px",
                  }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1, color: resumen.totalConfirmado >= resumen.totalPedido ? "var(--c-success-700, #15803d)" : "var(--c-warning-700, #b45309)" }}>
                      {resumen.totalConfirmado}
                    </span>
                    <span style={{ fontSize: "0.73rem", color: "var(--c-neutral-500)", marginTop: "2px" }}>Confirmados</span>
                  </div>
                )}
                {resumen.sinConfirmar > 0 && (
                  <div style={{ background: "var(--c-neutral-50)", border: "1px solid var(--c-neutral-200)", borderRadius: "8px", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1, color: "var(--c-neutral-500)" }}>{resumen.sinConfirmar}</span>
                    <span style={{ fontSize: "0.73rem", color: "var(--c-neutral-500)", marginTop: "2px" }}>Sin confirmar</span>
                  </div>
                )}
                {resumen.conDeficit > 0 && (
                  <div style={{ background: "var(--c-danger-50, #fef2f2)", border: "1px solid var(--c-danger-200, #fecaca)", borderRadius: "8px", padding: "0.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 700, lineHeight: 1, color: "var(--c-danger-700, #b91c1c)" }}>{resumen.conDeficit}</span>
                    <span style={{ fontSize: "0.73rem", color: "var(--c-neutral-500)", marginTop: "2px" }}>Con déficit</span>
                  </div>
                )}
              </div>
            )}

            {/* Leyenda */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem 1.25rem",
              marginBottom: "0.75rem",
              padding: "0.6rem 0.9rem",
              background: "var(--c-neutral-0)",
              border: "1px solid var(--c-neutral-150)",
              borderRadius: "8px",
              fontSize: "0.78rem",
              color: "var(--c-neutral-600)",
              alignItems: "center",
            }}>
              <span style={{ fontWeight: 700, color: "var(--c-neutral-800)", marginRight: "0.25rem" }}>Leyenda celda:</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ color: "var(--c-neutral-400)", fontSize: "0.85rem" }}>4</span>
                <span>Pedido</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--c-neutral-900)" }}>3</span>
                <span>Confirmado</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ fontWeight: 600, color: "var(--c-success-600, #16a34a)", fontSize: "0.78rem" }}>+1</span>
                <span>Exceso</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ fontWeight: 600, color: "var(--c-danger-600, #dc2626)", fontSize: "0.78rem" }}>−1</span>
                <span>Déficit</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ fontWeight: 600, color: "var(--c-brand-600, #2563eb)", fontSize: "0.78rem" }}>Hoy</span>
                <span>columna del día actual</span>
              </span>
            </div>

            {lineasConViajes.length === 0 && (
              <p style={{ color: "var(--c-neutral-500)", fontStyle: "italic" }}>
                No hay viajes planificados para esta semana.
              </p>
            )}

            {lineasConViajes.length > 0 && (
              <div className="table-wrapper">
                <table className="table combustibles-solicitud-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("solicitud.columns.material")}</th>
                      <th scope="col">{t("solicitud.columns.destino")}</th>
                      {DIAS_KEYS.map((k, i) => {
                        const esHoy = k === todayDiaKey;
                        const fecha = solicitudActiva.ini ? getFechaCorta(solicitudActiva.ini, i) : "";
                        return (
                          <th
                            key={k}
                            scope="col"
                            className="table__col--numeric combustibles-dia-col"
                            style={{
                              background: esHoy ? "var(--c-brand-100, #dbeafe)" : undefined,
                              color: esHoy ? "var(--c-brand-700, #1d4ed8)" : undefined,
                              fontWeight: esHoy ? 700 : undefined,
                            }}
                          >
                            {DIAS_ABR[i]}
                            {fecha && (
                              <span style={{ display: "block", fontSize: "0.65rem", fontWeight: 400, opacity: esHoy ? 0.85 : 0.7 }}>
                                {fecha}
                              </span>
                            )}
                          </th>
                        );
                      })}
                      <th scope="col" className="table__col--numeric">Total</th>
                      <th scope="col">{t("solicitudesRecibidas.detalle.estado")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineasConViajes.map((linea) => {
                      const totalPedido = sumaViajes(linea);
                      const hayConf = tieneConfirmacion(linea.id);
                      const totalConfirmado = hayConf
                        ? DIAS_KEYS.reduce((sum, k) => sum + viajesEfectivosLinea_id(linea.id, k), 0)
                        : null;
                      const discrepancia = hayDiscrepanciaLinea(linea.id);
                      const totalReal = viajesRealesLinea(linea.materialId);
                      const desvTotal = totalConfirmado !== null ? totalConfirmado - totalPedido : null;

                      const pct =
                        totalPedido === 0 || totalConfirmado === null
                          ? null
                          : Math.round((totalConfirmado / totalPedido) * 100);

                      const estadoClass =
                        pct === null
                          ? "pill pill--muted"
                          : pct >= 100
                          ? "pill pill--success"
                          : pct > 0
                          ? "pill pill--warning"
                          : cerrada
                          ? "pill pill--danger"
                          : "pill pill--muted";

                      const estadoLbl =
                        pct === null
                          ? "Pendiente"
                          : pct >= 100
                          ? "Completo"
                          : pct > 0
                          ? cerrada
                            ? `Parcial (${pct}%)`
                            : `Parcial (${pct}%)`
                          : cerrada
                          ? "Sin suministro"
                          : "Pendiente";

                      return (
                        <tr key={linea.id}>
                          <td className="combustibles-material-cell">
                            <span>{linea.materialNom}</span>
                            {discrepancia && (
                              <span
                                title="Hay discrepancia entre lo confirmado por el proveedor y el transportista"
                                style={{ marginLeft: "0.4rem", fontSize: "0.72rem", color: "var(--c-warning-600, #d97706)", fontWeight: 600 }}
                              >
                                Discrepancia
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: "0.82rem", color: linea.destino ? "var(--c-neutral-700)" : "var(--c-neutral-400)", fontStyle: linea.destino ? undefined : "italic" }}>
                              {linea.destino || "—"}
                            </span>
                          </td>
                          {DIAS_KEYS.map((k, i) => {
                            const pedido = linea[k];
                            const confirmado = hayConf ? viajesEfectivosLinea_id(linea.id, k) : null;
                            const desviacion = confirmado !== null ? confirmado - pedido : null;
                            const hayDatos = pedido > 0;
                            const esHoy = k === todayDiaKey;
                            const bgColor = esHoy
                              ? "rgba(219,234,254,0.35)"
                              : undefined;

                            return (
                              <td
                                key={k}
                                className="table__col--numeric combustibles-dia-col"
                                style={{
                                  verticalAlign: "middle",
                                  background: bgColor,
                                  borderLeft: esHoy ? "2px solid var(--c-brand-200, #bfdbfe)" : undefined,
                                  borderRight: esHoy ? "2px solid var(--c-brand-200, #bfdbfe)" : undefined,
                                }}
                              >
                                {hayDatos ? (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.25, gap: "1px" }}>
                                    {/* Pedido */}
                                    <span style={{ fontSize: "0.82rem", color: "var(--c-neutral-400)" }}>{pedido}</span>
                                    {/* Confirmado — solo si hay confirmación */}
                                    {confirmado !== null && (
                                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{confirmado}</span>
                                    )}
                                    {/* Desviación */}
                                    {desviacion !== null && (
                                      <span style={{
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        color: desviacion > 0
                                          ? "var(--c-success-600, #16a34a)"
                                          : desviacion < 0
                                            ? "var(--c-danger-600, #dc2626)"
                                            : "var(--c-neutral-400)",
                                      }}>
                                        {desviacion > 0 ? `+${desviacion}` : desviacion === 0 ? "=" : desviacion}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: "var(--c-neutral-200)" }}>—</span>
                                )}
                              </td>
                            );
                          })}
                          {/* Total */}
                          <td className="table__col--numeric" style={{ verticalAlign: "middle" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.25, gap: "1px" }}>
                              <span style={{ fontSize: "0.82rem", color: "var(--c-neutral-400)" }}>{totalPedido}</span>
                              {totalConfirmado !== null && (
                                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{totalConfirmado}</span>
                              )}
                              {totalReal > 0 && (
                                <span style={{ textDecoration: "underline", fontSize: "0.9rem" }}>{totalReal}</span>
                              )}
                              {desvTotal !== null && (
                                <span style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  color: desvTotal > 0
                                    ? "var(--c-success-600, #16a34a)"
                                    : desvTotal < 0
                                      ? "var(--c-danger-600, #dc2626)"
                                      : "var(--c-neutral-400)",
                                }}>
                                  {desvTotal > 0 ? `+${desvTotal}` : desvTotal === 0 ? "=" : desvTotal}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={estadoClass}>{estadoLbl}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.8rem",
                color: "var(--c-neutral-500)",
              }}
            >
              {cerrada
                ? "Planificación cerrada por Compras. Los números en negrita son los viajes confirmados definitivamente."
                : "Los números en gris son los viajes pedidos. Los números en negrita aparecen cuando el proveedor confirma. El estado «Pendiente» desaparece en cuanto confirman."}
            </p>

            {/* Horario de llegadas — solo lectura */}
            {solicitudActiva && (
              <div style={{ marginTop: "2rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--c-neutral-700)" }}>
                  Horario de llegadas
                </h4>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "var(--c-neutral-500)" }}>
                  Franjas de descarga asignadas por Compras para la semana {solicitudActiva.semana}.
                </p>
                <HorarioLlegadasGrid
                  solicitudId={solicitudActiva.id}
                  horario={state.horarioLlegadas}
                  materiales={[]}
                  editable={false}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
