import { useState, useMemo } from "react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, type EstadoConfirmacion } from "../store/caStore.js";

const DIAS_KEYS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"] as const;

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

export function ConfirmacionesProveedoresPage() {
  const { state } = useCaStore();
  const [toast, setToast] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleRecordatorio = (lineaId: number) => {
    showToast(`Recordatorio enviado para la línea #${lineaId}.`);
  };

  // Obtener nombre del proveedor desde el store
  const getNombreProveedor = (id: number) =>
    state.proveedores.find((p) => p.id === id)?.nom ?? String(id);

  // Semana desde la solicitud
  const getSemana = (solicitudId: number) =>
    state.solicitudes.find((s) => s.id === solicitudId)?.semana ?? "—";

  const semanaNum = (solicitudId: number) => {
    const s = getSemana(solicitudId);
    return parseInt(s.replace("S", ""), 10) || 0;
  };

  // Timestamp de confirmación/rechazo del proveedor para una línea
  const getTsConfirmacion = (lineaId: number): string | null =>
    state.confirmaciones
      .filter((c) => c.lineaDistribucionId === lineaId && c.parte === "proveedor")
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0]?.ts ?? null;

  const fmtFechaHora = (ts: string) =>
    new Date(ts).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

  // Distribución ordenada por semana de mayor a menor
  const distribucionOrdenada = useMemo(
    () => [...state.distribucion].sort((a, b) => semanaNum(b.solicitudId) - semanaNum(a.solicitudId)),
    [state.distribucion, state.solicitudes]
  );

  return (
    <div className="combustibles-page">
      <DemoBanner />
      <section className="page">
        <header className="page__header">
          <div>
            <h2>Confirmación de proveedores</h2>
            <p className="page__subtitle">
              Estado de las confirmaciones de todos los proveedores para la semana en curso.
            </p>
          </div>
        </header>

        {toast && (
          <div className="toast toast--success" role="status">
            {toast}
          </div>
        )}

        {state.distribucion.length === 0 && (
          <p className="empty-state">
            No hay líneas de distribución creadas todavía. Ve a Planificación de viajes para crearlas.
          </p>
        )}

        {state.distribucion.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Material</th>
                  <th scope="col">Proveedor</th>
                  <th scope="col">Transportista</th>
                  <th scope="col">Semana</th>
                  <th scope="col" className="table__col--numeric">Total viajes</th>
                  <th scope="col">Estado proveedor</th>
                  <th scope="col">Confirmado</th>
                  <th scope="col">Estado transportista</th>
                  <th scope="col" className="table__col--actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {distribucionOrdenada.map((linea) => {
                  const total = DIAS_KEYS.reduce((s, k) => s + linea[k], 0);
                  const proveedorPendiente = linea.confirmacionProveedor === "pendiente";
                  const tsConf = getTsConfirmacion(linea.id);
                  return (
                    <>
                      <tr
                        key={linea.id}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setExpandedId(expandedId === linea.id ? null : linea.id)
                        }
                      >
                        <td className="combustibles-material-cell">{linea.materialNom}</td>
                        <td>{getNombreProveedor(linea.proveedorId)}</td>
                        <td>{linea.transportistaNom}</td>
                        <td>{getSemana(linea.solicitudId)}</td>
                        <td className="table__col--numeric">{total}</td>
                        <td>
                          <span className={estadoPillClass(linea.confirmacionProveedor)}>
                            {estadoLabel(linea.confirmacionProveedor)}
                          </span>
                          {linea.motivoRechazoProveedor && (
                            <p
                              className="combustibles-motivo-rechazo"
                              style={{ marginTop: "0.25rem", cursor: "pointer" }}
                              title={linea.motivoRechazoProveedor}
                            >
                              &ldquo;{linea.motivoRechazoProveedor}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="table__col--muted" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                          {tsConf ? fmtFechaHora(tsConf) : "—"}
                        </td>
                        <td>
                          <span className={estadoPillClass(linea.confirmacionTransportista)}>
                            {estadoLabel(linea.confirmacionTransportista)}
                          </span>
                          {linea.motivoRechazoTransportista && (
                            <p
                              className="combustibles-motivo-rechazo"
                              style={{ marginTop: "0.25rem" }}
                              title={linea.motivoRechazoTransportista}
                            >
                              &ldquo;{linea.motivoRechazoTransportista}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="table__col--actions">
                          {proveedorPendiente && (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecordatorio(linea.id);
                              }}
                            >
                              Recordatorio
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Detalle con viajes por día al expandir */}
                      {expandedId === linea.id && (
                        <tr key={`${linea.id}-detail`}>
                          <td
                            colSpan={9}
                            style={{ background: "var(--c-neutral-50)", padding: "0.75rem 1rem" }}
                          >
                            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                              {DIAS_KEYS.map((k, i) => {
                                const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
                                return (
                                  <div key={k} style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "0.75rem", color: "var(--c-neutral-500)" }}>
                                      {dias[i]}
                                    </div>
                                    <div style={{ fontWeight: 700 }}>{linea[k]}</div>
                                  </div>
                                );
                              })}
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
        )}

        {/* Enviar recordatorios masivos a pendientes */}
        {state.distribucion.some((l) => l.confirmacionProveedor === "pendiente") && (
          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                const pendientes = state.distribucion.filter(
                  (l) => l.confirmacionProveedor === "pendiente"
                ).length;
                showToast(`Recordatorio enviado a ${pendientes} proveedor(es) pendientes.`);
              }}
            >
              Enviar recordatorio a todos los pendientes
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
