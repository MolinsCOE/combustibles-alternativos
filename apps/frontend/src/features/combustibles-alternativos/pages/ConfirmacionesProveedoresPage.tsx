import { useState, useMemo } from "react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, type DiaKey, type EstadoConfirmacion, type LineaDistribucion } from "../store/caStore.js";

const DIAS_KEYS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"] as const;
const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;

type PestanaConf = "proveedores" | "transportistas";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function estadoPillClass(estado: EstadoConfirmacion): string {
  switch (estado) {
    case "confirmada": return "pill pill--success";
    case "rechazada":  return "pill pill--danger";
    default:           return "pill pill--warning";
  }
}

function estadoLabel(estado: EstadoConfirmacion): string {
  const map: Record<EstadoConfirmacion, string> = {
    pendiente:  "Pendiente",
    confirmada: "Confirmado",
    rechazada:  "Rechazado",
  };
  return map[estado];
}

function rowBg(estado: EstadoConfirmacion): string {
  switch (estado) {
    case "confirmada": return "var(--c-success-50, #f0fdf4)";
    case "rechazada":  return "var(--c-danger-50, #fef2f2)";
    default:           return "";
  }
}

function fmtFechaHora(ts: string): string {
  return new Date(ts).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Pill estado de material (resumen)
// ---------------------------------------------------------------------------

type EstadoMaterial = "completo" | "con_rechazos" | "en_curso";

function estadoMaterialPill(estado: EstadoMaterial) {
  switch (estado) {
    case "completo":
      return <span className="pill pill--success">Completo</span>;
    case "con_rechazos":
      return <span className="pill pill--danger">Con rechazos</span>;
    default:
      return <span className="pill pill--warning">En curso</span>;
  }
}

function calcEstadoMaterialProv(lineas: LineaDistribucion[]): EstadoMaterial {
  if (lineas.length === 0) return "en_curso";
  const hayPendiente = lineas.some((l) => l.confirmacionProveedor === "pendiente");
  const hayRechazada = lineas.some((l) => l.confirmacionProveedor === "rechazada");
  if (!hayPendiente && !hayRechazada) return "completo";
  if (hayRechazada && !hayPendiente) return "con_rechazos";
  return "en_curso";
}

function calcEstadoMaterialTrans(lineas: LineaDistribucion[]): EstadoMaterial {
  const lineasConTrans = lineas.filter((l) => l.transportistaId > 0);
  if (lineasConTrans.length === 0) return "en_curso";
  const hayPendiente = lineasConTrans.some((l) => l.confirmacionTransportista === "pendiente");
  const hayRechazada = lineasConTrans.some((l) => l.confirmacionTransportista === "rechazada");
  if (!hayPendiente && !hayRechazada) return "completo";
  if (hayRechazada && !hayPendiente) return "con_rechazos";
  return "en_curso";
}

// ---------------------------------------------------------------------------
// Tarjeta por material — Proveedores
// ---------------------------------------------------------------------------

type TarjetaProvProps = {
  materialNom: string;
  lineas: LineaDistribucion[];
  getTsConfirmacion: (lineaId: number, parte: "proveedor" | "transportista") => string | null;
  onRecordatorio: (linea: LineaDistribucion) => void;
};

function TarjetaMaterialProv({ materialNom, lineas, getTsConfirmacion, onRecordatorio }: TarjetaProvProps) {
  const [enviando, setEnviando] = useState<Set<number>>(new Set());
  const [expandida, setExpandida] = useState(true);

  const confirmadas = lineas.filter((l) => l.confirmacionProveedor === "confirmada").length;
  const total = lineas.length;
  const estadoMat = calcEstadoMaterialProv(lineas);

  return (
    <div
      style={{
        border: "1px solid var(--c-neutral-200)",
        borderRadius: "8px",
        marginBottom: "0.75rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: "var(--c-neutral-50)",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpandida((v) => !v)}
      >
        <span style={{ fontWeight: 700, minWidth: "160px" }}>{materialNom}</span>
        {estadoMaterialPill(estadoMat)}
        <span style={{ fontSize: "0.82rem", color: "var(--c-neutral-500)", flex: 1, marginLeft: "0.5rem" }}>
          {confirmadas} / {total} confirmados
        </span>
      </div>

      {expandida && (
        <div style={{ padding: "0.75rem 1rem" }}>
          {lineas.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--c-neutral-400)", textAlign: "center" }}>
              Sin líneas de distribución para este material.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th scope="col">Proveedor</th>
                    <th scope="col">Destino</th>
                    <th scope="col">Transportista</th>
                    {DIAS_ABR.map((d) => (
                      <th key={d} scope="col" className="table__col--numeric combustibles-dia-col">{d}</th>
                    ))}
                    <th scope="col" className="table__col--numeric">Total</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Fecha respuesta</th>
                    <th scope="col">Motivo rechazo</th>
                    <th scope="col" className="table__col--actions">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea) => {
                    const cantProv = (k: DiaKey) =>
                      linea.confirmacionProveedor === "confirmada" && linea.cantidadesProveedor?.[k] !== undefined
                        ? (linea.cantidadesProveedor[k] ?? linea[k])
                        : linea[k];
                    const totalViajes = DIAS_KEYS.reduce((s, k) => s + cantProv(k), 0);
                    const tsConf = getTsConfirmacion(linea.id, "proveedor");
                    const esPendiente = linea.confirmacionProveedor === "pendiente";
                    return (
                      <tr
                        key={linea.id}
                        style={{ background: rowBg(linea.confirmacionProveedor) }}
                      >
                        <td>{linea.proveedorNom}</td>
                        <td>{linea.destino || "—"}</td>
                        <td>{linea.transportistaNom}</td>
                        {DIAS_KEYS.map((k) => {
                          const conf = cantProv(k);
                          const reducida = conf < linea[k];
                          return (
                            <td key={k} className="table__col--numeric combustibles-dia-col"
                              style={reducida ? { background: "var(--c-warning-100, #fef3c7)", color: "var(--c-warning-700, #b45309)", fontWeight: 700, padding: "2px" } : undefined}
                            >
                              {reducida ? (
                                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                                  <span style={{ fontSize: "1em" }}>{conf}</span>
                                  <span style={{ fontSize: "0.78em", color: "var(--c-neutral-400)", textDecoration: "line-through" }}>{linea[k]}</span>
                                </span>
                              ) : conf}
                            </td>
                          );
                        })}
                        <td className="table__col--numeric" style={{ fontWeight: 700, ...(totalViajes < DIAS_KEYS.reduce((s,k) => s + linea[k], 0) ? { color: "var(--c-warning-700, #b45309)" } : {}) }}>{totalViajes}</td>
                        <td>
                          <span className={estadoPillClass(linea.confirmacionProveedor)}>
                            {estadoLabel(linea.confirmacionProveedor)}
                          </span>
                        </td>
                        <td className="table__col--muted" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                          {tsConf ? fmtFechaHora(tsConf) : "—"}
                        </td>
                        <td style={{ fontStyle: "italic", fontSize: "0.82rem", color: "var(--c-danger-600, #dc2626)" }}>
                          {linea.motivoRechazoProveedor ?? ""}
                        </td>
                        <td className="table__col--actions">
                          {esPendiente && (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              disabled={enviando.has(linea.id)}
                              onClick={() => {
                                setEnviando((prev) => new Set(prev).add(linea.id));
                                onRecordatorio(linea);
                                setTimeout(() => setEnviando((prev) => { const s = new Set(prev); s.delete(linea.id); return s; }), 3000);
                              }}
                            >
                              {enviando.has(linea.id) ? "Enviando..." : "Recordatorio"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tarjeta por material — Transportistas
// ---------------------------------------------------------------------------

type TarjetaTransProps = {
  materialNom: string;
  lineas: LineaDistribucion[];
  getTsConfirmacion: (lineaId: number, parte: "proveedor" | "transportista") => string | null;
  onRecordatorio: (linea: LineaDistribucion) => void;
};

function TarjetaMaterialTrans({ materialNom, lineas, getTsConfirmacion, onRecordatorio }: TarjetaTransProps) {
  const [expandida, setExpandida] = useState(true);
  const [enviando, setEnviando] = useState<Set<number>>(new Set());

  const lineasConTrans = lineas.filter((l) => l.transportistaId > 0);
  const confirmadas = lineasConTrans.filter((l) => l.confirmacionTransportista === "confirmada").length;
  const total = lineasConTrans.length;
  const estadoMat = calcEstadoMaterialTrans(lineas);

  return (
    <div
      style={{
        border: "1px solid var(--c-neutral-200)",
        borderRadius: "8px",
        marginBottom: "0.75rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: "var(--c-neutral-50)",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpandida((v) => !v)}
      >
        <span style={{ fontWeight: 700, minWidth: "160px" }}>{materialNom}</span>
        {estadoMaterialPill(estadoMat)}
        <span style={{ fontSize: "0.82rem", color: "var(--c-neutral-500)", flex: 1, marginLeft: "0.5rem" }}>
          {confirmadas} / {total} confirmados
        </span>
      </div>

      {expandida && (
        <div style={{ padding: "0.75rem 1rem" }}>
          {lineasConTrans.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--c-neutral-400)", textAlign: "center" }}>
              No hay líneas con transportista asignado para este material.
            </p>
          ) : (
            <div className="table-wrapper">
              <table className="table" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th scope="col">Transportista</th>
                    <th scope="col">Destino</th>
                    <th scope="col">Proveedor</th>
                    {DIAS_ABR.map((d) => (
                      <th key={d} scope="col" className="table__col--numeric combustibles-dia-col">{d}</th>
                    ))}
                    <th scope="col" className="table__col--numeric">Total</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Fecha respuesta</th>
                    <th scope="col">Motivo rechazo</th>
                    <th scope="col" className="table__col--actions">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {lineasConTrans.map((linea) => {
                    const cantTrans = (k: DiaKey) =>
                      linea.confirmacionTransportista === "confirmada" && linea.cantidadesTransportista?.[k] !== undefined
                        ? linea.cantidadesTransportista[k] ?? linea[k]
                        : linea[k];
                    const totalViajes = DIAS_KEYS.reduce((s, k) => s + cantTrans(k), 0);
                    const tsConf = getTsConfirmacion(linea.id, "transportista");
                    const esPendiente = linea.confirmacionTransportista === "pendiente";
                    return (
                      <tr
                        key={linea.id}
                        style={{ background: rowBg(linea.confirmacionTransportista) }}
                      >
                        <td>{linea.transportistaNom}</td>
                        <td>{linea.destino || "—"}</td>
                        <td>{linea.proveedorNom}</td>
                        {DIAS_KEYS.map((k) => {
                          const conf = cantTrans(k);
                          const reducida = conf < linea[k];
                          return (
                            <td key={k} className="table__col--numeric combustibles-dia-col"
                              style={reducida ? { background: "var(--c-warning-100, #fef3c7)", color: "var(--c-warning-700, #b45309)", fontWeight: 700, padding: "2px" } : undefined}
                            >
                              {reducida ? (
                                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                                  <span style={{ fontSize: "1em" }}>{conf}</span>
                                  <span style={{ fontSize: "0.78em", color: "var(--c-neutral-400)", textDecoration: "line-through" }}>{linea[k]}</span>
                                </span>
                              ) : conf}
                            </td>
                          );
                        })}
                        <td className="table__col--numeric" style={{ fontWeight: 700, ...(totalViajes < DIAS_KEYS.reduce((s,k) => s + linea[k], 0) ? { color: "var(--c-warning-700, #b45309)" } : {}) }}>{totalViajes}</td>
                        <td>
                          <span className={estadoPillClass(linea.confirmacionTransportista)}>
                            {estadoLabel(linea.confirmacionTransportista)}
                          </span>
                        </td>
                        <td className="table__col--muted" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                          {tsConf ? fmtFechaHora(tsConf) : "—"}
                        </td>
                        <td style={{ fontStyle: "italic", fontSize: "0.82rem", color: "var(--c-danger-600, #dc2626)" }}>
                          {linea.motivoRechazoTransportista ?? ""}
                        </td>
                        <td className="table__col--actions">
                          {esPendiente && (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              disabled={enviando.has(linea.id)}
                              onClick={() => {
                                setEnviando((prev) => new Set(prev).add(linea.id));
                                onRecordatorio(linea);
                                setTimeout(() => setEnviando((prev) => { const s = new Set(prev); s.delete(linea.id); return s; }), 3000);
                              }}
                            >
                              {enviando.has(linea.id) ? "Enviando..." : "Recordatorio"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

async function postEmail(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function ConfirmacionesProveedoresPage() {
  const { state, dispatch } = useCaStore();
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [pestana, setPestana] = useState<PestanaConf>("proveedores");

  const showToast = (msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  };

  // Solicitudes visibles en esta vista (en_distribucion | confirmada | cerrada)
  const solicitudesVisibles = useMemo(
    () =>
      state.solicitudes
        .filter((s) =>
          s.estado === "en_distribucion" || s.estado === "confirmada" || s.estado === "cerrada"
        )
        .sort((a, b) => {
          const na = parseInt(a.semana.replace("S", ""), 10) || 0;
          const nb = parseInt(b.semana.replace("S", ""), 10) || 0;
          return nb - na;
        }),
    [state.solicitudes]
  );

  const [solicitudId, setSolicitudId] = useState<number | null>(
    solicitudesVisibles[0]?.id ?? null
  );

  const solicitudActiva = useMemo(
    () => state.solicitudes.find((s) => s.id === solicitudId) ?? null,
    [state.solicitudes, solicitudId]
  );

  const lineasDeSolicitud = useMemo(
    () => (solicitudId ? state.distribucion.filter((l) => l.solicitudId === solicitudId) : []),
    [state.distribucion, solicitudId]
  );

  // Materiales únicos de la solicitud activa
  const materialesUnicos = useMemo(() => {
    const seen = new Set<number>();
    const result: { id: number; nom: string }[] = [];
    for (const l of lineasDeSolicitud) {
      if (!seen.has(l.materialId)) {
        seen.add(l.materialId);
        result.push({ id: l.materialId, nom: l.materialNom });
      }
    }
    return result;
  }, [lineasDeSolicitud]);

  // Timestamp más reciente de confirmación para una línea y parte
  const getTsConfirmacion = (lineaId: number, parte: "proveedor" | "transportista"): string | null =>
    state.confirmaciones
      .filter((c) => c.lineaDistribucionId === lineaId && c.parte === parte)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0]?.ts ?? null;

  const puedesCerrar =
    solicitudActiva?.estado === "en_distribucion" || solicitudActiva?.estado === "confirmada";

  const estaCerrada = solicitudActiva?.estado === "cerrada";

  const handleCerrar = () => {
    if (!solicitudActiva) return;
    dispatch({ type: "CERRAR_PROGRAMACION", solicitudId: solicitudActiva.id });
    setConfirmandoCierre(false);
    showToast("Programación cerrada.");
  };

  const handleRecordatorioProveedor = async (linea: LineaDistribucion) => {
    if (!solicitudActiva) return;
    const prov = state.proveedores.find((p) => p.id === linea.proveedorId);
    if (!prov || prov.emails.length === 0) { showToast("El proveedor no tiene email configurado."); return; }
    const confirmUrl = `${window.location.origin}/combustibles/confirmar?id=${linea.id}&prov=${linea.proveedorId}`;
    const ok = await postEmail("/api/combustibles/enviar-correo", {
      to: prov.emails,
      bcc: prov.bcc,
      proveedorNom: linea.proveedorNom,
      materialNom: linea.materialNom,
      destino: linea.destino ?? "",
      semana: solicitudActiva.semana,
      transportistaNom: linea.transportistaNom,
      viajes: { l: linea.dl, m: linea.dt, x: linea.dc, j: linea.dj, v: linea.dv, s: linea.ds, d: linea.dg },
      confirmUrl,
    });
    showToast(ok ? `Recordatorio enviado a ${linea.proveedorNom}.` : "Error al enviar el recordatorio.");
  };

  const handleRecordatorioTransportista = async (linea: LineaDistribucion) => {
    if (!solicitudActiva) return;
    const trans = state.proveedores.find((p) => p.id === linea.transportistaId);
    if (!trans || trans.emails.length === 0) { showToast("El transportista no tiene email configurado."); return; }
    const confirmUrl = `${window.location.origin}/combustibles/confirmar?id=${linea.id}&trans=${linea.transportistaId}&tipo=transportista`;
    const ok = await postEmail("/api/combustibles/enviar-correo-transportista", {
      to: trans.emails,
      bcc: trans.bcc,
      transportistaNom: linea.transportistaNom,
      proveedorNom: linea.proveedorNom,
      materialNom: linea.materialNom,
      destino: linea.destino ?? "",
      semana: solicitudActiva.semana,
      viajes: { l: linea.dl, m: linea.dt, x: linea.dc, j: linea.dj, v: linea.dv, s: linea.ds, d: linea.dg },
      confirmUrl,
    });
    showToast(ok ? `Recordatorio enviado a ${linea.transportistaNom}.` : "Error al enviar el recordatorio.");
  };

  const lineasPendientesProv = lineasDeSolicitud.filter(
    (l) => l.confirmacionProveedor === "pendiente"
  );

  const lineasPendientesTrans = lineasDeSolicitud.filter(
    (l) => l.transportistaId > 0 && l.confirmacionTransportista === "pendiente"
  );

  return (
    <div className="combustibles-page">
      <DemoBanner />
      <section className="page">
        <header className="page__header">
          <div>
            <h2>Confirmaciones</h2>
            <p className="page__subtitle">
              Estado de las confirmaciones de proveedores y transportistas para la semana seleccionada.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Selector de semana */}
            {solicitudesVisibles.length > 0 && (
              <select
                value={solicitudId ?? ""}
                onChange={(e) => {
                  setSolicitudId(Number(e.target.value));
                  setConfirmandoCierre(false);
                }}
                style={{ minWidth: "180px" }}
                aria-label="Seleccionar semana"
              >
                {solicitudesVisibles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.semana} — {s.estado === "cerrada" ? "Cerrada" : s.estado === "confirmada" ? "Confirmada" : "En distribución"}
                  </option>
                ))}
              </select>
            )}

            {/* Botón cerrar o pill cerrada */}
            {estaCerrada && (
              <span className="pill pill--muted">Cerrada</span>
            )}
            {puedesCerrar && !confirmandoCierre && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                <p style={{ fontSize: "0.82rem", color: "var(--c-neutral-500)", marginBottom: "0.25rem", textAlign: "right" }}>
                  Puedes cerrar la planificación aunque no todas las confirmaciones estén completas. Los viajes no confirmados quedarán como déficit.
                </p>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmandoCierre(true)}
                >
                  Cerrar programación
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className="toast toast--success" role="status">{t.msg}</div>
          ))}
        </div>

        {/* Confirmación inline de cierre */}
        {confirmandoCierre && (
          <div
            style={{
              background: "var(--c-warning-50, #fffbeb)",
              border: "1px solid var(--c-warning-300, #fcd34d)",
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ flex: 1, fontWeight: 500 }}>
              ¿Confirmas que quieres cerrar esta programación? Esta acción no se puede deshacer.
            </span>
            <button type="button" className="btn btn--primary" onClick={handleCerrar}>
              Si, cerrar
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmandoCierre(false)}>
              Cancelar
            </button>
          </div>
        )}

        {/* Estado vacío */}
        {solicitudesVisibles.length === 0 && (
          <p className="empty-state">
            No hay semanas en distribución todavía. Ve a Solicitudes recibidas para iniciar la distribución.
          </p>
        )}

        {solicitudActiva && solicitudesVisibles.length > 0 && (
          <>
            {/* Pestañas Proveedores / Transportistas */}
            <nav className="tabs" aria-label="Confirmaciones" style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                className={pestana === "proveedores" ? "tabs__tab tabs__tab--active" : "tabs__tab"}
                onClick={() => setPestana("proveedores")}
              >
                Proveedores
                {lineasPendientesProv.length > 0 && (
                  <span
                    style={{
                      marginLeft: "0.4rem",
                      background: "var(--c-warning-500, #f59e0b)",
                      color: "white",
                      borderRadius: "999px",
                      padding: "0 6px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    {lineasPendientesProv.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={pestana === "transportistas" ? "tabs__tab tabs__tab--active" : "tabs__tab"}
                onClick={() => setPestana("transportistas")}
              >
                Transportistas
                {lineasPendientesTrans.length > 0 && (
                  <span
                    style={{
                      marginLeft: "0.4rem",
                      background: "var(--c-warning-500, #f59e0b)",
                      color: "white",
                      borderRadius: "999px",
                      padding: "0 6px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    {lineasPendientesTrans.length}
                  </span>
                )}
              </button>
            </nav>

            {lineasDeSolicitud.length === 0 && (
              <p className="empty-state">
                No hay líneas de distribución para esta semana.
              </p>
            )}

            {/* Contenido por pestaña */}
            {pestana === "proveedores" && (
              <>
                {materialesUnicos.map((mat) => {
                  const lineasMat = lineasDeSolicitud.filter(
                    (l) => l.materialId === mat.id && l.proveedorId > 0
                  );
                  if (lineasMat.length === 0) return null;
                  return (
                    <TarjetaMaterialProv
                      key={mat.id}
                      materialNom={mat.nom}
                      lineas={lineasMat}
                      getTsConfirmacion={getTsConfirmacion}
                      onRecordatorio={handleRecordatorioProveedor}
                    />
                  );
                })}

                {/* Botón recordatorio masivo al pie */}
                {lineasPendientesProv.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        showToast(
                          `Recordatorio enviado a ${lineasPendientesProv.length} proveedor(es) pendientes.`
                        )
                      }
                    >
                      Enviar recordatorio a todos los proveedores pendientes
                    </button>
                  </div>
                )}
              </>
            )}

            {pestana === "transportistas" && (
              <>
                {materialesUnicos.map((mat) => {
                  const lineasMat = lineasDeSolicitud.filter(
                    (l) => l.materialId === mat.id && l.transportistaId > 0
                  );
                  if (lineasMat.length === 0) return null;
                  return (
                    <TarjetaMaterialTrans
                      key={mat.id}
                      materialNom={mat.nom}
                      lineas={lineasMat}
                      getTsConfirmacion={getTsConfirmacion}
                      onRecordatorio={handleRecordatorioTransportista}
                    />
                  );
                })}

                {/* Botón recordatorio masivo al pie */}
                {lineasPendientesTrans.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        showToast(
                          `Recordatorio enviado a ${lineasPendientesTrans.length} transportista(s) pendientes.`
                        )
                      }
                    >
                      Enviar recordatorio a todos los transportistas pendientes
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
