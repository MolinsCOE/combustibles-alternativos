import { useEffect, useMemo, useRef, useState } from "react";
import { useRole } from "../auth/useRole.js";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, type EstadoConfirmacion } from "../store/caStore.js";

type ModalState =
  | { open: false }
  | { open: true; mode: "confirmar" | "rechazar"; lineaId: number; motivo: string; comentario: string };

const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;
const DIAS_KEYS = [
  "dl", "dt", "dc", "dj", "dv", "ds", "dg"
] as const;

function estadoPillClass(estado: EstadoConfirmacion): string {
  switch (estado) {
    case "confirmada": return "pill pill--success";
    case "rechazada":  return "pill pill--danger";
    default:           return "pill pill--muted";
  }
}

function estadoLabel(estado: EstadoConfirmacion): string {
  const labels: Record<EstadoConfirmacion, string> = {
    pendiente:  "Pendiente",
    confirmada: "Confirmada",
    rechazada:  "Rechazada",
  };
  return labels[estado];
}

export function PlanificacionProveedorPage() {
  const { session } = useRole();
  const { state, dispatch } = useCaStore();

  const proveedorIdNum = session?.proveedorId != null ? Number(session.proveedorId) : null;

  // DEBUG — ayuda a verificar que el filtro funciona correctamente
  console.log("[PlanificacionProveedorPage] session:", session);
  console.log("[PlanificacionProveedorPage] proveedorIdNum:", proveedorIdNum);
  console.log("[PlanificacionProveedorPage] total líneas en store:", state.distribucion.length);

  // Filtrar líneas donde este proveedor aparece como proveedor O como transportista
  const lineas = state.distribucion.filter((l) => {
    if (proveedorIdNum === null) {
      // Sin sesión: mostrar todas (no debería ocurrir en producción)
      return true;
    }
    const match = l.proveedorId === proveedorIdNum || l.transportistaId === proveedorIdNum;
    console.log(
      `[PlanificacionProveedorPage] línea ${l.id}: proveedorId=${l.proveedorId}, transportistaId=${l.transportistaId} → match=${match}`
    );
    return match;
  });

  console.log("[PlanificacionProveedorPage] líneas filtradas para este proveedor:", lineas.length);

  const [semanaFiltro, setSemanaFiltro] = useState<string>("todas");
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [motivoError, setMotivoError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const motivoRef = useRef<HTMLTextAreaElement>(null);

  // Semanas disponibles para filtrar, ordenadas por número de semana
  const semanasDisponibles = useMemo(() => {
    const semanasMap = new Map<string, string>();
    for (const linea of lineas) {
      const sol = state.solicitudes.find((s) => s.id === linea.solicitudId);
      if (sol) semanasMap.set(sol.semana, sol.semana);
    }
    return Array.from(semanasMap.keys()).sort((a, b) => {
      const na = parseInt(a.replace("S", ""), 10);
      const nb = parseInt(b.replace("S", ""), 10);
      return na - nb;
    });
  }, [lineas, state.solicitudes]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (modal.open) {
      window.setTimeout(() => motivoRef.current?.focus(), 50);
    }
  }, [modal.open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modal.open) setModal({ open: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal.open]);

  const handleAbrirConfirmacion = (lineaId: number) => {
    setModal({ open: true, mode: "confirmar", lineaId, motivo: "", comentario: "" });
    setMotivoError(false);
  };

  const handleAbrirRechazo = (lineaId: number) => {
    setModal({ open: true, mode: "rechazar", lineaId, motivo: "", comentario: "" });
    setMotivoError(false);
  };

  const handleSubmitModal = () => {
    if (!modal.open) return;
    if (modal.mode === "rechazar" && !modal.motivo.trim()) {
      setMotivoError(true);
      return;
    }
    if (modal.mode === "confirmar") {
      dispatch({
        type: "CONFIRMAR_LINEA_PROVEEDOR",
        lineaId: modal.lineaId,
        proveedorId: proveedorIdNum ?? 0,
        comentario: modal.comentario || null,
      });
      showToast("Línea confirmada correctamente.");
    } else {
      dispatch({
        type: "RECHAZAR_LINEA_PROVEEDOR",
        lineaId: modal.lineaId,
        proveedorId: proveedorIdNum ?? 0,
        motivo: modal.motivo,
      });
      showToast("Línea rechazada. Compras recibirá el motivo.");
    }
    setModal({ open: false });
  };

  // Semana desde la solicitud
  const getSemana = (solicitudId: number) =>
    state.solicitudes.find((s) => s.id === solicitudId)?.semana ?? "—";

  const semanaNum = (solicitudId: number) => {
    const s = getSemana(solicitudId);
    return parseInt(s.replace("S", ""), 10) || 0;
  };

  // Timestamp de la última confirmación/rechazo del proveedor para una línea
  const getTsConfirmacion = (lineaId: number): string | null =>
    state.confirmaciones
      .filter((c) => c.lineaDistribucionId === lineaId && c.parte === "proveedor")
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0]?.ts ?? null;

  const fmtFechaHora = (ts: string) =>
    new Date(ts).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

  const lineasFiltradas = semanaFiltro === "todas"
    ? lineas
    : lineas.filter((l) => getSemana(l.solicitudId) === semanaFiltro);

  const sorted = [...lineasFiltradas].sort((a, b) => semanaNum(a.solicitudId) - semanaNum(b.solicitudId));

  // Pendientes: sin respuesta — orden ascendente (semana más próxima primero)
  const pendientes = sorted.filter((l) => l.confirmacionProveedor === "pendiente");
  // Respondidas: orden descendente (más reciente primero)
  const respondidas = [...sorted]
    .filter((l) => l.confirmacionProveedor !== "pendiente")
    .sort((a, b) => {
      const tsA = getTsConfirmacion(a.id) ?? "";
      const tsB = getTsConfirmacion(b.id) ?? "";
      return tsB.localeCompare(tsA);
    });

  return (
    <div className="combustibles-page">
      <DemoBanner />

      {/* Sección: pendientes de confirmar */}
      <section className="page">
        <header className="page__header">
          <div>
            <h2>
              Pendientes de confirmar
              {pendientes.length > 0 && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 400,
                    color: "var(--c-neutral-500)",
                  }}
                >
                  ({pendientes.length})
                </span>
              )}
            </h2>
            <p className="page__subtitle">
              Líneas de distribución que necesitan tu confirmación.
              {session?.nombre && <> &mdash; {session.nombre}</>}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {semanasDisponibles.length > 0 && (
              <div className="form__field" style={{ marginBottom: 0 }}>
                <label htmlFor="semana-filtro" style={{ fontSize: "0.8rem" }}>
                  Semana
                </label>
                <select
                  id="semana-filtro"
                  value={semanaFiltro}
                  style={{ maxWidth: "120px" }}
                  onChange={(e) => setSemanaFiltro(e.target.value)}
                >
                  <option value="todas">Todas</option>
                  {semanasDisponibles.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {pendientes.length > 0 && (
              <span className="pill pill--warning">
                {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </header>

        {toast && (
          <div className="toast toast--success" role="status">
            {toast}
          </div>
        )}

        {pendientes.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <p className="empty-state">No tienes confirmaciones pendientes.</p>
          </div>
        )}

        {pendientes.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Material</th>
                  <th scope="col">Semana</th>
                  <th scope="col">Proveedor</th>
                  <th scope="col">Transportista</th>
                  {DIAS_ABR.map((d) => (
                    <th key={d} scope="col" className="table__col--numeric combustibles-dia-col">{d}</th>
                  ))}
                  <th scope="col" className="table__col--numeric">Total</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="table__col--actions">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((linea) => {
                  const total = DIAS_KEYS.reduce((s, k) => s + linea[k], 0);
                  return (
                    <tr key={linea.id}>
                      <td className="combustibles-material-cell">{linea.materialNom}</td>
                      <td>{getSemana(linea.solicitudId)}</td>
                      <td>{linea.proveedorNom}</td>
                      <td className="table__col--muted">{linea.transportistaNom}</td>
                      {DIAS_KEYS.map((k) => (
                        <td key={k} className="table__col--numeric combustibles-dia-col">
                          {linea[k]}
                        </td>
                      ))}
                      <td className="table__col--numeric" style={{ fontWeight: 700 }}>{total}</td>
                      <td>
                        <span className={estadoPillClass(linea.confirmacionProveedor)}>
                          {estadoLabel(linea.confirmacionProveedor)}
                        </span>
                      </td>
                      <td className="table__col--actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => handleAbrirConfirmacion(linea.id)}
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm btn--danger-ghost"
                          onClick={() => handleAbrirRechazo(linea.id)}
                        >
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sección: historial (ya respondidas) */}
      {respondidas.length > 0 && (
        <section className="page">
          <header className="page__header">
            <div>
              <h2 style={{ fontSize: "1.05rem" }}>Historial de confirmaciones</h2>
              <p className="page__subtitle">
                Líneas que ya has respondido anteriormente.
              </p>
            </div>
          </header>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Material</th>
                  <th scope="col">Semana</th>
                  <th scope="col">Proveedor</th>
                  <th scope="col">Transportista</th>
                  {DIAS_ABR.map((d) => (
                    <th key={d} scope="col" className="table__col--numeric combustibles-dia-col">{d}</th>
                  ))}
                  <th scope="col" className="table__col--numeric">Total</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Fecha respuesta</th>
                </tr>
              </thead>
              <tbody>
                {respondidas.map((linea) => {
                  const total = DIAS_KEYS.reduce((s, k) => s + linea[k], 0);
                  const tsConf = getTsConfirmacion(linea.id);
                  return (
                    <tr key={linea.id}>
                      <td className="combustibles-material-cell">{linea.materialNom}</td>
                      <td>{getSemana(linea.solicitudId)}</td>
                      <td>{linea.proveedorNom}</td>
                      <td className="table__col--muted">{linea.transportistaNom}</td>
                      {DIAS_KEYS.map((k) => (
                        <td key={k} className="table__col--numeric combustibles-dia-col">
                          {linea[k]}
                        </td>
                      ))}
                      <td className="table__col--numeric" style={{ fontWeight: 700 }}>{total}</td>
                      <td>
                        <span className={estadoPillClass(linea.confirmacionProveedor)}>
                          {estadoLabel(linea.confirmacionProveedor)}
                        </span>
                        {linea.motivoRechazoProveedor && (
                          <p
                            className="combustibles-motivo-rechazo"
                            title={linea.motivoRechazoProveedor}
                            style={{ marginTop: "0.2rem" }}
                          >
                            &ldquo;{linea.motivoRechazoProveedor}&rdquo;
                          </p>
                        )}
                      </td>
                      <td className="table__col--muted" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {tsConf ? fmtFechaHora(tsConf) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sin líneas en absoluto */}
      {lineas.length === 0 && (
        <section className="page">
          <p className="empty-state">
            No hay líneas de distribución asignadas a tu cuenta en este momento.
          </p>
        </section>
      )}

      {/* Modal de confirmación / rechazo */}
      {modal.open && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-prov-title"
          onClick={() => setModal({ open: false })}
        >
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <header className="dialog__header">
              <h2 id="modal-prov-title">
                {modal.mode === "confirmar" ? "Confirmar línea" : "Rechazar línea"}
              </h2>
              <button
                type="button"
                className="btn-icon"
                aria-label="Cerrar"
                onClick={() => setModal({ open: false })}
              >
                &times;
              </button>
            </header>
            <div className="form" style={{ padding: "1rem 1.25rem" }}>
              {modal.mode === "confirmar" ? (
                <div className="form__field">
                  <label htmlFor="comentario-confirmacion">
                    Comentario <span style={{ fontWeight: 400, color: "var(--c-neutral-500)" }}>(opcional)</span>
                  </label>
                  <textarea
                    ref={motivoRef}
                    id="comentario-confirmacion"
                    rows={3}
                    placeholder="Añade cualquier observación si es necesario..."
                    value={modal.comentario}
                    onChange={(e) =>
                      setModal((prev) => prev.open ? { ...prev, comentario: e.target.value } : prev)
                    }
                  />
                </div>
              ) : (
                <div className="form__field">
                  <label htmlFor="motivo-rechazo-prov">
                    Motivo del rechazo <span aria-hidden="true">(obligatorio)</span>
                  </label>
                  <textarea
                    ref={motivoRef}
                    id="motivo-rechazo-prov"
                    rows={4}
                    placeholder="Explica el motivo del rechazo..."
                    value={modal.motivo}
                    aria-invalid={motivoError}
                    aria-describedby={motivoError ? "motivo-prov-error" : undefined}
                    onChange={(e) => {
                      setMotivoError(false);
                      setModal((prev) =>
                        prev.open ? { ...prev, motivo: e.target.value } : prev
                      );
                    }}
                  />
                  {motivoError && (
                    <p id="motivo-prov-error" className="form__error" role="alert">
                      El motivo es obligatorio para rechazar una línea.
                    </p>
                  )}
                </div>
              )}
            </div>
            <footer className="dialog__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setModal({ open: false })}>
                Cancelar
              </button>
              <button
                type="button"
                className={modal.mode === "confirmar" ? "btn btn--primary" : "btn btn--danger"}
                onClick={handleSubmitModal}
              >
                {modal.mode === "confirmar" ? "Confirmar" : "Confirmar rechazo"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
