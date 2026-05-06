import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Send } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import {
  useCaStore,
  sumaViajes,
  type LineaSolicitud,
  type LineaDistribucion,
  type EstadoLineaDistribucion,
} from "../store/caStore.js";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

type DiaKey = "dl" | "dt" | "dc" | "dj" | "dv" | "ds" | "dg";

const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;
const DIAS_KEYS: DiaKey[] = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function totalLinea(l: Pick<LineaDistribucion, DiaKey>): number {
  return DIAS_KEYS.reduce((s, k) => s + l[k], 0);
}

function estadoLineaPill(estado: EstadoLineaDistribucion) {
  switch (estado) {
    case "enviada":
      return <span className="pill pill--success">Enviado</span>;
    case "confirmada":
      return <span className="pill pill--success">Confirmado</span>;
    case "rechazada":
      return <span className="pill pill--danger">Rechazado</span>;
    default:
      return <span className="pill pill--muted">Pendiente</span>;
  }
}

// ---------------------------------------------------------------------------
// Tipos locales del formulario
// ---------------------------------------------------------------------------

type FormLinea = {
  proveedorId: string;
  transportistaId: string;
  dl: string; dt: string; dc: string; dj: string; dv: string; ds: string; dg: string;
};

const FORM_EMPTY: FormLinea = {
  proveedorId: "", transportistaId: "",
  dl: "0", dt: "0", dc: "0", dj: "0", dv: "0", ds: "0", dg: "0",
};

// ---------------------------------------------------------------------------
// Modal "Asignar proveedor"
// ---------------------------------------------------------------------------

type ModalAsignarProps = {
  lineaSolicitud: LineaSolicitud;
  lineasDistExistentes: LineaDistribucion[]; // para calcular lo ya distribuido por día
  initialForm?: FormLinea; // pre-rellena el modal al editar una línea existente
  fechaIni: string;
  proveedores: { id: number; nom: string }[];
  transportistas: { id: number; nom: string }[];
  asignaciones: { materialId: number; proveedorId: number; transportistaId: number; pct: number }[];
  onGuardar: (form: FormLinea) => void;
  onClose: () => void;
};

function fechaDia(fechaIni: string, offsetDias: number): string {
  const d = new Date(fechaIni);
  d.setDate(d.getDate() + offsetDias);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

function ModalAsignarProveedor({
  lineaSolicitud,
  lineasDistExistentes,
  initialForm,
  fechaIni,
  proveedores,
  transportistas,
  asignaciones,
  onGuardar,
  onClose,
}: ModalAsignarProps) {
  const [form, setForm] = useState<FormLinea>(initialForm ?? FORM_EMPTY);

  const totalForm = DIAS_KEYS.reduce((s, k) => s + (parseInt(form[k], 10) || 0), 0);

  // Por cada día: cuántos viajes ya están distribuidos en otras líneas
  const yaDist = useMemo(
    () =>
      DIAS_KEYS.reduce<Record<DiaKey, number>>(
        (acc, k) => ({
          ...acc,
          [k]: lineasDistExistentes.reduce((s, l) => s + l[k], 0),
        }),
        {} as Record<DiaKey, number>
      ),
    [lineasDistExistentes]
  );

  // Viajes restantes para este formulario (pedido - ya distribuido - lo que estás poniendo ahora)
  const restante = useMemo(
    () =>
      DIAS_KEYS.reduce<Record<DiaKey, number>>(
        (acc, k) => ({
          ...acc,
          [k]: lineaSolicitud[k] - yaDist[k] - (parseInt(form[k], 10) || 0),
        }),
        {} as Record<DiaKey, number>
      ),
    [lineaSolicitud, yaDist, form]
  );

  const totalRestante =
    DIAS_KEYS.reduce((s, k) => s + lineaSolicitud[k], 0) -
    DIAS_KEYS.reduce((s, k) => s + yaDist[k], 0) -
    totalForm;

  const handleAplicarMaestro = () => {
    const asig = asignaciones.filter((a) => a.materialId === lineaSolicitud.materialId);
    if (asig.length === 0) return;
    const primera = asig[0];
    if (!primera) return;
    const factor = primera.pct / 100;
    setForm({
      proveedorId: String(primera.proveedorId),
      transportistaId: String(primera.transportistaId),
      dl: String(Math.round(lineaSolicitud.dl * factor)),
      dt: String(Math.round(lineaSolicitud.dt * factor)),
      dc: String(Math.round(lineaSolicitud.dc * factor)),
      dj: String(Math.round(lineaSolicitud.dj * factor)),
      dv: String(Math.round(lineaSolicitud.dv * factor)),
      ds: String(Math.round(lineaSolicitud.ds * factor)),
      dg: String(Math.round(lineaSolicitud.dg * factor)),
    });
  };

  const canGuardar = form.proveedorId !== "" && form.transportistaId !== "";

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-asignar-title"
      onClick={onClose}
    >
      <div
        className="dialog"
        style={{ maxWidth: "640px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dialog__header">
          <h2 id="modal-asignar-title">
            {initialForm ? "Editar línea" : "Asignar proveedor"} &mdash; {lineaSolicitud.materialNom}
          </h2>
          <button
            type="button"
            className="btn-icon"
            aria-label="Cerrar"
            onClick={onClose}
          >
            &times;
          </button>
        </header>

        <div className="form" style={{ padding: "1rem 1.25rem" }}>
          {/* Sugerencia automática */}
          {asignaciones.some((a) => a.materialId === lineaSolicitud.materialId) && (
            <div
              style={{
                background: "var(--c-neutral-50)",
                border: "1px solid var(--c-neutral-200)",
                borderRadius: "6px",
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--c-neutral-600)",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                Sugerencia automática
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--c-neutral-500)", marginBottom: "0.5rem" }}>
                Aplica los porcentajes del maestro de asignaciones y rellena los campos automáticamente.
              </p>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={handleAplicarMaestro}
              >
                Aplicar % del maestro
              </button>
            </div>
          )}

          {/* Proveedor y transportista */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div className="form__field" style={{ marginBottom: 0 }}>
              <label htmlFor="modal-proveedor">Proveedor</label>
              <select
                id="modal-proveedor"
                value={form.proveedorId}
                onChange={(e) => setForm((f) => ({ ...f, proveedorId: e.target.value }))}
              >
                <option value="">— Seleccionar —</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="form__field" style={{ marginBottom: 0 }}>
              <label htmlFor="modal-transportista">Transportista</label>
              <select
                id="modal-transportista"
                value={form.transportistaId}
                onChange={(e) => setForm((f) => ({ ...f, transportistaId: e.target.value }))}
              >
                <option value="">— Seleccionar —</option>
                {transportistas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pedido de referencia */}
          <div
            style={{
              background: "var(--c-neutral-50)",
              border: "1px solid var(--c-neutral-200)",
              borderRadius: "6px",
              padding: "0.5rem 0.75rem",
              marginBottom: "0.75rem",
              fontSize: "0.8rem",
              color: "var(--c-neutral-600)",
            }}
          >
            <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>Pedido total:</span>
            {DIAS_KEYS.map((k, i) => (
              <span key={k} style={{ marginRight: "0.4rem" }}>
                {DIAS_ABR[i]}<strong>{lineaSolicitud[k]}</strong>
              </span>
            ))}
            <span style={{ marginLeft: "0.5rem", fontWeight: 600 }}>
              = {DIAS_KEYS.reduce((s, k) => s + lineaSolicitud[k], 0)} viajes
            </span>
          </div>

          {/* Inputs de días */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            {DIAS_KEYS.map((k, i) => {
              const r = restante[k];
              const faltaColor =
                r === 0
                  ? "var(--c-success-600, #16a34a)"
                  : r < 0
                  ? "var(--c-danger-600, #dc2626)"
                  : "var(--c-neutral-500)";
              const faltaLabel =
                r === 0 ? "✓ Completo" : r < 0 ? `Exceso: ${Math.abs(r)}` : `Faltan: ${r}`;
              return (
                <div key={k} className="form__field" style={{ marginBottom: 0, textAlign: "center" }}>
                  <label
                    htmlFor={`modal-${k}`}
                    style={{ display: "block", fontWeight: 600, marginBottom: "2px" }}
                  >
                    {DIAS_ABR[i]}
                  </label>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--c-neutral-400)",
                      marginBottom: "4px",
                    }}
                  >
                    {fechaDia(fechaIni, i)}
                  </div>
                  <input
                    id={`modal-${k}`}
                    type="number"
                    min={0}
                    className="combustibles-num-input"
                    value={form[k]}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  />
                  {/* Helper: pedido del día */}
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--c-neutral-400)",
                      marginTop: "3px",
                    }}
                  >
                    Ped: {lineaSolicitud[k]}
                    {yaDist[k] > 0 && <> · Ya: {yaDist[k]}</>}
                  </div>
                  {/* Helper: faltan / exceso */}
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: faltaColor,
                      marginTop: "2px",
                    }}
                  >
                    {faltaLabel}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total calculado + restante global */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "1rem",
              fontSize: "0.9rem",
              color: "var(--c-neutral-600)",
            }}
          >
            <span>
              Esta línea:{" "}
              <strong style={{ color: "var(--c-neutral-900)" }}>
                {totalForm} viajes
              </strong>
            </span>
            <span
              style={{
                fontWeight: 600,
                color:
                  totalRestante === 0
                    ? "var(--c-success-600, #16a34a)"
                    : totalRestante < 0
                    ? "var(--c-danger-600, #dc2626)"
                    : "var(--c-neutral-600)",
              }}
            >
              {totalRestante === 0
                ? "✓ Pedido completo"
                : totalRestante < 0
                ? `Exceso global: ${Math.abs(totalRestante)}`
                : `Faltan por asignar: ${totalRestante}`}
            </span>
          </div>
        </div>

        <footer className="dialog__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canGuardar}
            onClick={() => onGuardar(form)}
          >
            Guardar
          </button>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente tarjeta expandible por material
// ---------------------------------------------------------------------------

type TarjetaMaterialProps = {
  lineaSolicitud: LineaSolicitud;
  lineasDist: LineaDistribucion[];
  fechaIni: string;
  proveedores: { id: number; nom: string }[];
  transportistas: { id: number; nom: string }[];
  asignaciones: { materialId: number; proveedorId: number; transportistaId: number; pct: number }[];
  onAsignarProveedor: (lineaSolicitudId: number) => void;
  onEnviarLinea: (lineaId: number, provNom: string) => void;
  onEditarLinea: (lineaId: number) => void;
  onEliminarLinea: (lineaId: number) => void;
};

function TarjetaMaterial({
  lineaSolicitud,
  lineasDist,
  onAsignarProveedor,
  onEnviarLinea,
  onEditarLinea,
}: TarjetaMaterialProps) {
  const [expandida, setExpandida] = useState(true);

  const pedidoTotal = sumaViajes(lineaSolicitud);
  const distribuidoTotal = lineasDist.reduce((s, l) => s + totalLinea(l), 0);

  const pedidoResumen = DIAS_KEYS.map(
    (k) => `${DIAS_ABR[DIAS_KEYS.indexOf(k)]}${lineaSolicitud[k]}`
  ).join(" ");

  // Color del resumen de totales
  const colorTotales =
    distribuidoTotal === pedidoTotal
      ? "var(--c-success-600, #16a34a)"
      : distribuidoTotal > pedidoTotal
      ? "var(--c-warning-600, #d97706)"
      : "var(--c-danger-600, #dc2626)";

  return (
    <div
      style={{
        border: "1px solid var(--c-neutral-200)",
        borderRadius: "8px",
        marginBottom: "0.75rem",
        overflow: "hidden",
      }}
    >
      {/* Cabecera de tarjeta */}
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
        <button
          type="button"
          className="btn-icon"
          aria-label={expandida ? "Contraer" : "Expandir"}
          onClick={(e) => {
            e.stopPropagation();
            setExpandida((v) => !v);
          }}
        >
          {expandida ? (
            <ChevronDown size={16} aria-hidden="true" />
          ) : (
            <ChevronRight size={16} aria-hidden="true" />
          )}
        </button>

        <span style={{ fontWeight: 700, minWidth: "150px" }}>
          {lineaSolicitud.materialNom}
        </span>

        <span style={{ fontSize: "0.8rem", color: "var(--c-neutral-500)", flex: 1 }}>
          Pedido: {pedidoResumen} &middot; Total: {pedidoTotal} viajes
        </span>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={(e) => {
            e.stopPropagation();
            onAsignarProveedor(lineaSolicitud.id);
          }}
        >
          + Asignar proveedor
        </button>
      </div>

      {/* Cuerpo expandido */}
      {expandida && (
        <div style={{ padding: "0.75rem 1rem" }}>
          {lineasDist.length === 0 ? (
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--c-neutral-400)",
                textAlign: "center",
                padding: "0.5rem 0",
              }}
            >
              Sin líneas de distribución. Usa &ldquo;+ Asignar proveedor&rdquo; para crear una.
            </p>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="table" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th scope="col">Proveedor</th>
                      <th scope="col">Transportista</th>
                      {DIAS_ABR.map((d) => (
                        <th
                          key={d}
                          scope="col"
                          className="table__col--numeric combustibles-dia-col"
                        >
                          {d}
                        </th>
                      ))}
                      <th scope="col" className="table__col--numeric">Total</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Enviado</th>
                      <th scope="col" className="table__col--actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineasDist.map((linea) => {
                      const total = totalLinea(linea);
                      return (
                        <tr key={linea.id}>
                          <td>{linea.proveedorNom}</td>
                          <td>{linea.transportistaNom}</td>
                          {DIAS_KEYS.map((k) => (
                            <td
                              key={k}
                              className="table__col--numeric combustibles-dia-col"
                            >
                              {linea[k]}
                            </td>
                          ))}
                          <td
                            className="table__col--numeric"
                            style={{ fontWeight: 700 }}
                          >
                            {total}
                          </td>
                          <td>{estadoLineaPill(linea.estado)}</td>
                          <td className="table__col--muted" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                            {linea.correoEnviadoEn
                              ? new Date(linea.correoEnviadoEn).toLocaleString("es-ES", {
                                  day: "2-digit", month: "2-digit", year: "2-digit",
                                  hour: "2-digit", minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="table__col--actions">
                            {linea.estado === "pendiente" && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => onEditarLinea(linea.id)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => onEnviarLinea(linea.id, linea.proveedorNom)}
                                >
                                  <Send size={13} aria-hidden="true" />
                                  {" "}Enviar
                                </button>
                              </>
                            )}
                            {linea.estado === "enviada" && (
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                onClick={() => onEnviarLinea(linea.id, linea.proveedorNom)}
                              >
                                Reenviar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Fila de totales distribuidos vs pedido */}
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.82rem",
                  color: colorTotales,
                  fontWeight: 600,
                }}
              >
                Distribuido:{" "}
                {DIAS_KEYS.map((k, i) => {
                  const dist = lineasDist.reduce((s, l) => s + l[k], 0);
                  return (
                    <span key={k}>
                      {DIAS_ABR[i]}
                      {dist}{" "}
                    </span>
                  );
                })}
                ={" "}{distribuidoTotal} / Pedido: {pedidoTotal}
              </div>
            </>
          )}

          {/* Botón al pie de la tabla */}
          <div style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onAsignarProveedor(lineaSolicitud.id)}
            >
              + Asignar proveedor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export function DistribucionPage() {
  const { state, dispatch } = useCaStore();
  const [toast, setToast] = useState<string | null>(null);
  const [modalLineaSolicitudId, setModalLineaSolicitudId] = useState<number | null>(null);
  // Cuando se edita una línea existente, guardamos su id para saber que es UPDATE en vez de ADD
  const [editandoLineaDistId, setEditandoLineaDistId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  // Solicitudes disponibles: enviadas o en distribución
  const solicitudesDisponibles = useMemo(
    () =>
      state.solicitudes
        .filter((s) => s.estado === "enviada" || s.estado === "en_distribucion")
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()),
    [state.solicitudes]
  );

  const [solicitudId, setSolicitudId] = useState<number | null>(
    solicitudesDisponibles[0]?.id ?? null
  );

  const solicitudActiva = useMemo(
    () => state.solicitudes.find((s) => s.id === solicitudId) ?? null,
    [state.solicitudes, solicitudId]
  );

  const lineasDist = useMemo(
    () =>
      solicitudId
        ? state.distribucion.filter((l) => l.solicitudId === solicitudId)
        : [],
    [state.distribucion, solicitudId]
  );

  // Líneas pendientes de enviar (para el badge del botón global)
  const lineasPendientes = lineasDist.filter((l) => l.estado === "pendiente");

  const proveedores = state.proveedores.filter(
    (p) => p.activo && (p.tipus === "proveedor" || p.tipus === "ambos")
  );
  const transportistas = state.proveedores.filter(
    (p) => p.activo && (p.tipus === "transportista" || p.tipus === "ambos")
  );

  const handleGuardarLinea = (lineaSolicitudId: number, form: FormLinea) => {
    if (!solicitudActiva) return;
    const lsol = solicitudActiva.lineas.find((l) => l.id === lineaSolicitudId);
    if (!lsol) return;
    const prov = state.proveedores.find((p) => p.id === Number(form.proveedorId));
    const trans = state.proveedores.find((p) => p.id === Number(form.transportistaId));
    if (!prov || !trans) return;

    if (editandoLineaDistId !== null) {
      // Modo edición — actualiza la línea existente
      dispatch({
        type: "UPDATE_LINEA_DISTRIBUCION",
        lineaId: editandoLineaDistId,
        changes: {
          proveedorId: prov.id,
          proveedorNom: prov.nom,
          transportistaId: trans.id,
          transportistaNom: trans.nom,
          dl: Number(form.dl),
          dt: Number(form.dt),
          dc: Number(form.dc),
          dj: Number(form.dj),
          dv: Number(form.dv),
          ds: Number(form.ds),
          dg: Number(form.dg),
        },
      });
      showToast("Línea actualizada correctamente.");
    } else {
      // Modo creación — añade nueva línea
      dispatch({
        type: "ADD_LINEA_DISTRIBUCION",
        linea: {
          solicitudId: solicitudActiva.id,
          lineaSolicitudId,
          materialId: lsol.materialId,
          materialNom: lsol.materialNom,
          proveedorId: prov.id,
          proveedorNom: prov.nom,
          transportistaId: trans.id,
          transportistaNom: trans.nom,
          dl: Number(form.dl),
          dt: Number(form.dt),
          dc: Number(form.dc),
          dj: Number(form.dj),
          dv: Number(form.dv),
          ds: Number(form.ds),
          dg: Number(form.dg),
          estado: "pendiente",
          correoEnviadoEn: null,
          confirmacionProveedor: "pendiente",
          confirmacionTransportista: "pendiente",
          motivoRechazoProveedor: null,
          motivoRechazoTransportista: null,
        },
      });
      showToast("Línea de distribución guardada.");
    }
    setModalLineaSolicitudId(null);
    setEditandoLineaDistId(null);
  };

  const handleEditarLinea = (lineaDistId: number) => {
    const linea = state.distribucion.find((l) => l.id === lineaDistId);
    if (!linea) return;
    setEditandoLineaDistId(lineaDistId);
    setModalLineaSolicitudId(linea.lineaSolicitudId);
  };

  const sendEmailApi = async (lineaId: number): Promise<void> => {
    const linea = state.distribucion.find((l) => l.id === lineaId);
    if (!linea || !solicitudActiva) return;
    const prov = state.proveedores.find((p) => p.id === linea.proveedorId);
    if (!prov) return;
    const confirmUrl = `${window.location.origin}/combustibles/confirmar?id=${lineaId}&prov=${linea.proveedorId}`;
    const dias = {
      l: linea.dl,
      m: linea.dt,
      x: linea.dc,
      j: linea.dj,
      v: linea.dv,
      s: linea.ds,
      d: linea.dg,
    };
    await fetch("http://localhost:3000/api/combustibles/enviar-correo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: prov.email,
        proveedorNom: linea.proveedorNom,
        materialNom: linea.materialNom,
        semana: solicitudActiva.semana,
        transportistaNom: linea.transportistaNom,
        viajes: dias,
        confirmUrl,
      }),
    });
  };

  const handleEnviarLinea = (lineaId: number, provNom: string) => {
    dispatch({ type: "ENVIAR_CORREO_LINEA", lineaId });
    void sendEmailApi(lineaId);
    showToast(`Correo enviado a ${provNom}.`);
  };

  const handleEnviarTodos = () => {
    if (!solicitudId) return;
    lineasPendientes.forEach((l) => {
      void sendEmailApi(l.id);
    });
    dispatch({ type: "ENVIAR_TODOS_CORREOS", solicitudId });
    showToast("Correos enviados a todos los proveedores pendientes.");
  };

  const lineaModalData = useMemo(() => {
    if (modalLineaSolicitudId === null || !solicitudActiva) return null;
    return solicitudActiva.lineas.find((l) => l.id === modalLineaSolicitudId) ?? null;
  }, [modalLineaSolicitudId, solicitudActiva]);

  // Etiqueta del selector de solicitud
  const etiquetaSolicitud = (s: (typeof solicitudesDisponibles)[number]) => {
    const ini = new Date(s.ini).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
    const fi = new Date(s.fi).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
    const estadoLabel =
      s.estado === "enviada" ? "Enviada" : "En distribución";
    return `${s.semana} · ${ini}–${fi}  [${estadoLabel}]`;
  };

  return (
    <div className="combustibles-page">
      <DemoBanner />

      <section className="page">
        <header className="page__header">
          <div>
            <h2>Planificación de viajes</h2>
            <p className="page__subtitle">
              Distribuye los viajes por proveedor y transportista para cada material.
            </p>
          </div>

          {/* Botón global enviar todos */}
          {solicitudActiva && (
            <button
              type="button"
              className="btn btn--primary"
              disabled={lineasPendientes.length === 0}
              onClick={handleEnviarTodos}
              style={{ position: "relative" }}
            >
              <Send size={16} aria-hidden="true" style={{ marginRight: "0.4rem" }} />
              Enviar todos los correos pendientes
              {lineasPendientes.length > 0 && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    background: "rgba(255,255,255,0.3)",
                    borderRadius: "999px",
                    padding: "0 6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {lineasPendientes.length}
                </span>
              )}
            </button>
          )}
        </header>

        {toast && (
          <div className="toast toast--success" role="status">
            {toast}
          </div>
        )}

        {/* Selector de semana / solicitud */}
        {solicitudesDisponibles.length === 0 ? (
          <p className="empty-state">
            No hay solicitudes disponibles para distribuir. Ve a{" "}
            <strong>Solicitudes recibidas</strong> para iniciar la distribución de una solicitud.
          </p>
        ) : (
          <div className="form__field" style={{ maxWidth: "380px" }}>
            <label htmlFor="solicitud-selector">Seleccionar semana</label>
            <select
              id="solicitud-selector"
              value={solicitudId ?? ""}
              onChange={(e) => setSolicitudId(Number(e.target.value))}
            >
              <option value="">— Selecciona una solicitud —</option>
              {solicitudesDisponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {etiquetaSolicitud(s)}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Estado vacío cuando no hay solicitud seleccionada */}
      {solicitudesDisponibles.length > 0 && solicitudActiva === null && (
        <section className="page">
          <p className="empty-state">
            Selecciona una solicitud para empezar a distribuir.
          </p>
        </section>
      )}

      {/* Tarjetas por material */}
      {solicitudActiva !== null && (
        <section className="page">
          <header className="page__header" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem" }}>
              {solicitudActiva.semana} &mdash; Distribución por material
            </h2>
          </header>

          {solicitudActiva.lineas.map((ls) => {
            const lineasDelMaterial = lineasDist.filter(
              (l) => l.lineaSolicitudId === ls.id
            );
            return (
              <TarjetaMaterial
                key={ls.id}
                lineaSolicitud={ls}
                lineasDist={lineasDelMaterial}
                fechaIni={solicitudActiva.ini}
                proveedores={proveedores}
                transportistas={transportistas}
                asignaciones={state.asignaciones}
                onAsignarProveedor={(lsId) => setModalLineaSolicitudId(lsId)}
                onEnviarLinea={handleEnviarLinea}
                onEditarLinea={handleEditarLinea}
                onEliminarLinea={() => {}}
              />
            );
          })}
        </section>
      )}

      {/* Modal asignar / editar proveedor */}
      {lineaModalData && solicitudActiva && (() => {
        const lineaEditando = editandoLineaDistId !== null
          ? state.distribucion.find((l) => l.id === editandoLineaDistId)
          : null;
        const initialForm: FormLinea | undefined = lineaEditando
          ? {
              proveedorId: String(lineaEditando.proveedorId),
              transportistaId: String(lineaEditando.transportistaId),
              dl: String(lineaEditando.dl),
              dt: String(lineaEditando.dt),
              dc: String(lineaEditando.dc),
              dj: String(lineaEditando.dj),
              dv: String(lineaEditando.dv),
              ds: String(lineaEditando.ds),
              dg: String(lineaEditando.dg),
            }
          : undefined;
        // Excluir la propia línea editada para no contar doble
        const existentes = lineasDist.filter(
          (l) =>
            l.lineaSolicitudId === lineaModalData.id &&
            l.id !== editandoLineaDistId
        );
        return (
          <ModalAsignarProveedor
            lineaSolicitud={lineaModalData}
            lineasDistExistentes={existentes}
            initialForm={initialForm}
            fechaIni={solicitudActiva.ini}
            proveedores={proveedores}
            transportistas={transportistas}
            asignaciones={state.asignaciones}
            onGuardar={(form) => handleGuardarLinea(lineaModalData.id, form)}
            onClose={() => {
              setModalLineaSolicitudId(null);
              setEditandoLineaDistId(null);
            }}
          />
        );
      })()}
    </div>
  );
}
