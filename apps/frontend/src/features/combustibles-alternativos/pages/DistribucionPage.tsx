import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Send, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import {
  useCaStore,
  sumaViajes,
  type LineaSolicitud,
  type LineaDistribucion,
  type EstadoConfirmacion,
  type DiaKey,
} from "../store/caStore.js";
import { HorarioLlegadasGrid } from "../components/HorarioLlegadasGrid.js";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;
const DIAS_KEYS: DiaKey[] = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function totalLinea(l: Pick<LineaDistribucion, DiaKey>): number {
  return DIAS_KEYS.reduce((s, k) => s + l[k], 0);
}

function confirmacionPill(estado: EstadoConfirmacion, label: string) {
  switch (estado) {
    case "confirmada":
      return <span className="pill pill--success" title={label}>✓ {label}</span>;
    case "rechazada":
      return <span className="pill pill--danger" title={label}>✗ {label}</span>;
    default:
      return <span className="pill pill--warning" title={label}>{label}</span>;
  }
}


// ---------------------------------------------------------------------------
// Tipos locales del formulario
// ---------------------------------------------------------------------------

type FormLinea = {
  proveedorId: string;
  transportistaId: string;
  destino: string;
  dl: string; dt: string; dc: string; dj: string; dv: string; ds: string; dg: string;
};

const FORM_EMPTY: FormLinea = {
  proveedorId: "", transportistaId: "", destino: "",
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
  destinos: { id: number; nom: string; activo: boolean }[];
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
  destinos,
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
      destino: "",
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

          {/* Destino */}
          <div className="form__field" style={{ marginBottom: "1rem" }}>
            <label htmlFor="modal-destino">Destino</label>
            <select
              id="modal-destino"
              value={form.destino}
              onChange={(e) => setForm((f) => ({ ...f, destino: e.target.value }))}
            >
              <option value="">— Seleccionar destino —</option>
              {destinos.filter((d) => d.activo).map((d) => (
                <option key={d.id} value={d.nom}>{d.nom}</option>
              ))}
            </select>
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
// Modal reasignación de proveedor/transportista
// ---------------------------------------------------------------------------

type ReasignarState = {
  lineaId: number;
  solicitudId: number;
  proveedorId: string;
  transportistaId: string;
  motivo: string;
  tieneConfirmacion: boolean;
};

type ModalReasignarProps = {
  state: ReasignarState;
  proveedores: { id: number; nom: string }[];
  transportistas: { id: number; nom: string }[];
  onChange: (updates: Partial<ReasignarState>) => void;
  onGuardar: () => void;
  onClose: () => void;
};

function ModalReasignar({
  state: rs,
  proveedores,
  transportistas,
  onChange,
  onGuardar,
  onClose,
}: ModalReasignarProps) {
  const canGuardar =
    !!rs.motivo.trim() &&
    rs.proveedorId !== "" &&
    rs.transportistaId !== "";

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reasignar-title"
      onClick={onClose}
    >
      <div
        className="dialog"
        style={{ maxWidth: "480px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dialog__header">
          <h2 id="modal-reasignar-title">Reasignar proveedor / transportista</h2>
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
          {rs.tieneConfirmacion && (
            <div
              style={{
                background: "var(--c-warning-50, #fffbeb)",
                border: "1px solid var(--c-warning-300, #fcd34d)",
                borderRadius: "6px",
                padding: "0.6rem 0.9rem",
                marginBottom: "1rem",
                fontSize: "0.85rem",
                color: "var(--c-warning-700, #b45309)",
              }}
            >
              Reasignar reseteará la confirmación pendiente.
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div className="form__field" style={{ marginBottom: 0 }}>
              <label htmlFor="reasignar-proveedor">Proveedor</label>
              <select
                id="reasignar-proveedor"
                value={rs.proveedorId}
                onChange={(e) => onChange({ proveedorId: e.target.value })}
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
              <label htmlFor="reasignar-transportista">Transportista</label>
              <select
                id="reasignar-transportista"
                value={rs.transportistaId}
                onChange={(e) => onChange({ transportistaId: e.target.value })}
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

          <div className="form__field">
            <label htmlFor="reasignar-motivo">Motivo del cambio</label>
            <textarea
              id="reasignar-motivo"
              rows={3}
              value={rs.motivo}
              placeholder="Describe el motivo de la reasignación..."
              onChange={(e) => onChange({ motivo: e.target.value })}
            />
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
            onClick={onGuardar}
          >
            Guardar reasignación
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
  onAplicarReparto: (lineaSolicitudId: number) => void;
  onEnviarLinea: (lineaId: number, provNom: string) => void;
  onEnviarLineaTransportista: (lineaId: number, transNom: string) => void;
  isEnviandoLinea: (lineaId: number, parte: "proveedor" | "transportista") => boolean;
  onEditarLinea: (lineaId: number) => void;
  onEliminarLinea: (lineaId: number) => void;
  onReasignarLinea: (lineaId: number) => void;
  modificada?: boolean;
  cambiosDescripcion?: string;
};

function TarjetaMaterial({
  lineaSolicitud,
  lineasDist,
  asignaciones,
  onAsignarProveedor,
  onAplicarReparto,
  onEnviarLinea,
  onEnviarLineaTransportista,
  isEnviandoLinea,
  onEditarLinea,
  onEliminarLinea,
  onReasignarLinea,
  modificada = false,
  cambiosDescripcion,
}: TarjetaMaterialProps) {
  const [expandida, setExpandida] = useState(true);

  const pedidoTotal = sumaViajes(lineaSolicitud);
  const distribuidoTotal = lineasDist.reduce((s, l) => s + totalLinea(l), 0);

  // Total efectivo: suma de cantidades confirmadas (parciales si aplica)
  const cantEfectivaLinea = (l: LineaDistribucion, k: DiaKey): number => {
    const prov = l.confirmacionProveedor === "confirmada" && l.cantidadesProveedor?.[k] !== undefined
      ? (l.cantidadesProveedor[k] ?? l[k]) : l[k];
    const trans = l.confirmacionTransportista === "confirmada" && l.cantidadesTransportista?.[k] !== undefined
      ? (l.cantidadesTransportista[k] ?? l[k]) : l[k];
    return Math.min(prov, trans);
  };
  const confirmadoTotal = lineasDist.reduce((s, l) => s + DIAS_KEYS.reduce((ss, k) => ss + cantEfectivaLinea(l, k), 0), 0);
  const hayConfirmacionParcial = confirmadoTotal < distribuidoTotal;

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

  const tieneAsignacionesConfiguradas = asignaciones.some(
    (a) => a.materialId === lineaSolicitud.materialId
  );
  const mostrarRepartoAutomatico = tieneAsignacionesConfiguradas && lineasDist.length === 0;

  return (
    <div
      style={{
        border: modificada ? "2px solid var(--c-warning-400, #fbbf24)" : "1px solid var(--c-neutral-200)",
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

        <span style={{ fontWeight: 700, minWidth: "150px", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {lineaSolicitud.materialNom}
          {modificada && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "var(--c-warning-700, #b45309)",
              background: "var(--c-warning-100, #fef3c7)",
              border: "1px solid var(--c-warning-300, #fcd34d)",
              borderRadius: "4px",
              padding: "1px 6px",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}>
              <AlertTriangle size={10} aria-hidden="true" />
              Pendiente reconfirmar
              {cambiosDescripcion && (
                <span style={{ fontWeight: 500, opacity: 0.85 }}>
                  &nbsp;·&nbsp;{cambiosDescripcion}
                </span>
              )}
            </span>
          )}
        </span>

        <span style={{ fontSize: "0.8rem", color: "var(--c-neutral-500)", flex: 1 }}>
          Pedido: {pedidoResumen} &middot; Total: {pedidoTotal} viajes
        </span>

        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color:
              distribuidoTotal === pedidoTotal
                ? hayConfirmacionParcial
                  ? "var(--c-warning-600, #d97706)"
                  : "var(--c-success-600, #16a34a)"
                : distribuidoTotal > pedidoTotal
                ? "var(--c-warning-600, #d97706)"
                : "var(--c-danger-600, #dc2626)",
            marginRight: "0.5rem",
          }}
        >
          {distribuidoTotal === pedidoTotal
            ? hayConfirmacionParcial
              ? `⚠ Confirmado: ${confirmadoTotal} / ${pedidoTotal}`
              : "✓ Completo"
            : distribuidoTotal > pedidoTotal
            ? `Exceso: ${distribuidoTotal - pedidoTotal}`
            : `Quedan: ${pedidoTotal - distribuidoTotal}`}
        </span>

        {mostrarRepartoAutomatico && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            title="Aplica los porcentajes configurados en el maestro de asignaciones"
            onClick={(e) => {
              e.stopPropagation();
              onAplicarReparto(lineaSolicitud.id);
            }}
          >
            Aplicar reparto configurado
          </button>
        )}
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
                      <th scope="col">Origen</th>
                      <th scope="col">Destino</th>
                      <th scope="col">Transporte</th>
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
                      <th scope="col">Conf. Prov.</th>
                      <th scope="col">Conf. Trans.</th>
                      <th scope="col" className="table__col--actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineasDist.filter((linea) => totalLinea(linea) > 0 || linea.proveedorId === 0).map((linea) => {
                      const tieneTransportista = linea.transportistaId > 0;
                      const transportistaConfPendiente =
                        tieneTransportista && linea.confirmacionTransportista === "pendiente";
                      // Cantidades confirmadas parcialmente (proveedor o transportista)
                      const cantProv = (k: DiaKey): number =>
                        linea.confirmacionProveedor === "confirmada" && linea.cantidadesProveedor?.[k] !== undefined
                          ? (linea.cantidadesProveedor[k] ?? linea[k])
                          : linea[k];
                      const cantTrans = (k: DiaKey): number =>
                        linea.confirmacionTransportista === "confirmada" && linea.cantidadesTransportista?.[k] !== undefined
                          ? (linea.cantidadesTransportista[k] ?? linea[k])
                          : linea[k];
                      // Valor efectivo: el mínimo entre lo que acepta proveedor y transportista
                      const cantEfectiva = (k: DiaKey) => Math.min(cantProv(k), cantTrans(k));
                      const totalEfectivo = DIAS_KEYS.reduce((s, k) => s + cantEfectiva(k), 0);
                      const hayReduccion = DIAS_KEYS.some((k) => cantEfectiva(k) < linea[k]);
                      return (
                        <tr key={linea.id}>
                          <td>{linea.proveedorNom}</td>
                          <td>{linea.destino || <span style={{ color: "var(--c-neutral-400)", fontStyle: "italic" }}>—</span>}</td>
                          <td>{linea.transportistaNom || "—"}</td>
                          {DIAS_KEYS.map((k) => {
                            const efectiva = cantEfectiva(k);
                            const reducida = efectiva < linea[k];
                            return (
                              <td
                                key={k}
                                className="table__col--numeric combustibles-dia-col"
                                style={reducida ? { background: "var(--c-warning-100, #fef3c7)", color: "var(--c-warning-700, #b45309)", fontWeight: 700, padding: "2px" } : undefined}
                              >
                                {reducida ? (
                                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 }}>
                                    <span style={{ fontSize: "1em" }}>{efectiva}</span>
                                    <span style={{ fontSize: "0.78em", color: "var(--c-neutral-400)", textDecoration: "line-through" }}>{linea[k]}</span>
                                  </span>
                                ) : efectiva}
                              </td>
                            );
                          })}
                          <td
                            className="table__col--numeric"
                            style={{ fontWeight: 700, ...(hayReduccion ? { color: "var(--c-warning-700, #b45309)" } : {}) }}
                          >
                            {totalEfectivo}
                          </td>
                          <td>{confirmacionPill(linea.confirmacionProveedor, "Prov.")}</td>
                          <td>
                            {tieneTransportista
                              ? confirmacionPill(linea.confirmacionTransportista, "Trans.")
                              : <span style={{ color: "var(--c-neutral-400)", fontSize: "0.8rem" }}>—</span>}
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
                                  className={isEnviandoLinea(linea.id, "proveedor") ? "btn btn--muted btn--sm" : "btn btn--ghost btn--sm"}
                                  disabled={isEnviandoLinea(linea.id, "proveedor")}
                                  onClick={() => onEnviarLinea(linea.id, linea.proveedorNom)}
                                >
                                  <Send size={13} aria-hidden="true" />
                                  {" "}{isEnviandoLinea(linea.id, "proveedor") ? "Enviando..." : "Prov."}
                                </button>
                                {tieneTransportista && (
                                  <button
                                    type="button"
                                    className={isEnviandoLinea(linea.id, "transportista") ? "btn btn--muted btn--sm" : "btn btn--ghost btn--sm"}
                                    disabled={isEnviandoLinea(linea.id, "transportista")}
                                    onClick={() => onEnviarLineaTransportista(linea.id, linea.transportistaNom)}
                                  >
                                    <Send size={13} aria-hidden="true" />
                                    {" "}{isEnviandoLinea(linea.id, "transportista") ? "Enviando..." : "Trans."}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  title="Eliminar línea"
                                  onClick={() => onEliminarLinea(linea.id)}
                                >
                                  <Trash2 size={13} aria-hidden="true" />
                                  {" "}Eliminar
                                </button>
                              </>
                            )}
                            {linea.estado === "enviada" && (
                              <>
                                <button
                                  type="button"
                                  className={isEnviandoLinea(linea.id, "proveedor") ? "btn btn--muted btn--sm" : "btn btn--ghost btn--sm"}
                                  disabled={isEnviandoLinea(linea.id, "proveedor")}
                                  onClick={() => onEnviarLinea(linea.id, linea.proveedorNom)}
                                >
                                  {isEnviandoLinea(linea.id, "proveedor") ? "Enviando..." : "Reenviar prov."}
                                </button>
                                {tieneTransportista && transportistaConfPendiente && (
                                  <button
                                    type="button"
                                    className={isEnviandoLinea(linea.id, "transportista") ? "btn btn--muted btn--sm" : "btn btn--ghost btn--sm"}
                                    disabled={isEnviandoLinea(linea.id, "transportista")}
                                    onClick={() => onEnviarLineaTransportista(linea.id, linea.transportistaNom)}
                                  >
                                    {isEnviandoLinea(linea.id, "transportista") ? "Enviando..." : "Enviar trans."}
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              title="Reasignar proveedor o transportista"
                              onClick={() => onReasignarLinea(linea.id)}
                            >
                              <Pencil size={13} aria-hidden="true" />
                              {" "}Reasignar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Fila de totales distribuidos vs pedido */}
              <div style={{ marginTop: "0.5rem", fontSize: "0.82rem", fontWeight: 600, color: colorTotales }}>
                Distribuido:{" "}
                {DIAS_KEYS.map((k, i) => {
                  const dist = lineasDist.reduce((s, l) => s + l[k], 0);
                  const conf = lineasDist.reduce((s, l) => s + cantEfectivaLinea(l, k), 0);
                  const reducido = conf < dist;
                  return (
                    <span key={k} style={reducido ? { color: "var(--c-warning-700, #b45309)" } : undefined}>
                      {DIAS_ABR[i]}
                      {reducido ? `${conf}(${dist})` : dist}{" "}
                    </span>
                  );
                })}
                ={" "}
                {hayConfirmacionParcial
                  ? <><span style={{ color: "var(--c-warning-700, #b45309)" }}>{confirmadoTotal}</span><span style={{ color: "var(--c-neutral-400)", fontWeight: 400 }}>({distribuidoTotal})</span></>
                  : distribuidoTotal
                }{" "}/ Pedido: {pedidoTotal}
              </div>
            </>
          )}

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
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [fallosEnvio, setFallosEnvio] = useState<{ lineaId: number; nombre: string; materialNom: string; parte: "proveedor" | "transportista" }[]>([]);
  const [enviandoTodos, setEnviandoTodos] = useState(false);
  const [enviandoLineas, setEnviandoLineas] = useState<Set<string>>(new Set());

  const setEnviandoLinea = (lineaId: number, parte: "proveedor" | "transportista", valor: boolean) => {
    const key = `${parte}-${lineaId}`;
    setEnviandoLineas((prev) => {
      const next = new Set(prev);
      if (valor) next.add(key); else next.delete(key);
      return next;
    });
  };
  const isEnviandoLinea = (lineaId: number, parte: "proveedor" | "transportista") =>
    enviandoLineas.has(`${parte}-${lineaId}`);
  const [modalLineaSolicitudId, setModalLineaSolicitudId] = useState<number | null>(null);
  // Cuando se edita una línea existente, guardamos su id para saber que es UPDATE en vez de ADD
  const [editandoLineaDistId, setEditandoLineaDistId] = useState<number | null>(null);
  // Estado del modal de reasignación
  const [reasignarState, setReasignarState] = useState<ReasignarState | null>(null);

  const showToast = (msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
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

  // Última modificación realizada por Producción (para alertar a Compras)
  const ultimaModifProduccion = useMemo(() => {
    if (!solicitudActiva?.historial?.length) return null;
    return [...solicitudActiva.historial]
      .filter((h) => h.autor === "produccion" && h.descripcion !== "Sin cambios en cantidades")
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0] ?? null;
  }, [solicitudActiva?.historial]);

  // Map de material → detalle de cambios (ej. "L: 0→2, M: 1→2")
  const cambiosPorMaterial = useMemo((): Map<string, string> => {
    if (!ultimaModifProduccion) return new Map();
    const map = new Map<string, string>();
    for (const parte of ultimaModifProduccion.descripcion.split(" | ")) {
      const idx = parte.indexOf(" (");
      if (idx === -1) continue;
      const nom = parte.slice(0, idx).trim();
      const detalle = parte.slice(idx + 2, parte.endsWith(")") ? parte.length - 1 : undefined).trim();
      map.set(nom, detalle);
    }
    return map;
  }, [ultimaModifProduccion]);

  const materialesModificados = useMemo(() => new Set(cambiosPorMaterial.keys()), [cambiosPorMaterial]);

  // Líneas pendientes de enviar (para el badge del botón global)
  const lineasPendientes = lineasDist.filter(
    (l) => l.estado === "pendiente" && l.proveedorId > 0 && totalLinea(l) > 0
  );

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
          destino: form.destino,
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

  const handleAplicarReparto = (lineaSolicitudId: number) => {
    if (!solicitudActiva) return;
    dispatch({
      type: "APLICAR_REPARTO_AUTOMATICO",
      solicitudId: solicitudActiva.id,
      lineaSolicitudId,
    });
    showToast("Reparto automático aplicado.");
  };

  const handleAbrirReasignar = (lineaId: number) => {
    if (!solicitudActiva) return;
    const linea = state.distribucion.find((l) => l.id === lineaId);
    if (!linea) return;
    const tieneConfirmacion =
      linea.confirmacionProveedor !== "pendiente" ||
      linea.confirmacionTransportista !== "pendiente";
    setReasignarState({
      lineaId,
      solicitudId: solicitudActiva.id,
      proveedorId: String(linea.proveedorId),
      transportistaId: String(linea.transportistaId),
      motivo: "",
      tieneConfirmacion,
    });
  };

  const handleGuardarReasignacion = () => {
    if (!reasignarState) return;
    const { lineaId, solicitudId, proveedorId, transportistaId, motivo } = reasignarState;
    if (!motivo.trim()) return;

    const linea = state.distribucion.find((l) => l.id === lineaId);
    if (!linea) return;

    const nuevoProv = state.proveedores.find((p) => p.id === Number(proveedorId));
    const nuevoTrans = state.proveedores.find((p) => p.id === Number(transportistaId));

    const provCambio = nuevoProv && nuevoProv.id !== linea.proveedorId;
    const transCambio = nuevoTrans && nuevoTrans.id !== linea.transportistaId;

    dispatch({
      type: "REASIGNAR_LINEA_DISTRIBUCION",
      solicitudId,
      lineaId,
      ...(provCambio && nuevoProv ? { proveedorId: nuevoProv.id, proveedorNom: nuevoProv.nom } : {}),
      ...(transCambio && nuevoTrans ? { transportistaId: nuevoTrans.id, transportistaNom: nuevoTrans.nom } : {}),
      motivo: motivo.trim(),
    });
    showToast("Reasignación guardada correctamente.");
    setReasignarState(null);
  };

  const handleEliminarLinea = (lineaDistId: number) => {
    if (!window.confirm("¿Eliminar esta línea de distribución? Esta acción no se puede deshacer.")) {
      return;
    }
    dispatch({ type: "ELIMINAR_LINEA_DISTRIBUCION", lineaId: lineaDistId });
    showToast("Línea eliminada correctamente.");
  };

  const handleEditarLinea = (lineaDistId: number) => {
    const linea = state.distribucion.find((l) => l.id === lineaDistId);
    if (!linea) return;
    setEditandoLineaDistId(lineaDistId);
    setModalLineaSolicitudId(linea.lineaSolicitudId);
  };

  const EMAIL_TIMEOUT_MS = 15_000;

  const postEmail = async (path: string, body: unknown): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const sendEmailApi = (lineaId: number): Promise<boolean> => {
    const linea = state.distribucion.find((l) => l.id === lineaId);
    if (!linea || !solicitudActiva) return Promise.resolve(false);
    const prov = state.proveedores.find((p) => p.id === linea.proveedorId);
    if (!prov || prov.emails.length === 0) return Promise.resolve(false);
    const confirmUrl = `${window.location.origin}/combustibles/confirmar?id=${lineaId}&prov=${linea.proveedorId}`;
    return postEmail("/api/combustibles/enviar-correo", {
      to: prov.emails,
      bcc: prov.bcc,
      proveedorNom: linea.proveedorNom,
      materialNom: linea.materialNom,
      semana: solicitudActiva.semana,
      transportistaNom: linea.transportistaNom,
      viajes: { l: linea.dl, m: linea.dt, x: linea.dc, j: linea.dj, v: linea.dv, s: linea.ds, d: linea.dg },
      confirmUrl,
    });
  };

  const sendEmailApiTransportista = (lineaId: number): Promise<boolean> => {
    const linea = state.distribucion.find((l) => l.id === lineaId);
    if (!linea || !solicitudActiva) return Promise.resolve(false);
    const trans = state.proveedores.find((p) => p.id === linea.transportistaId);
    if (!trans || trans.emails.length === 0) return Promise.resolve(false);
    const confirmUrl = `${window.location.origin}/combustibles/confirmar?id=${lineaId}&trans=${linea.transportistaId}&tipo=transportista`;
    return postEmail("/api/combustibles/enviar-correo-transportista", {
      to: trans.emails,
      bcc: trans.bcc,
      transportistaNom: linea.transportistaNom,
      proveedorNom: linea.proveedorNom,
      materialNom: linea.materialNom,
      semana: solicitudActiva.semana,
      viajes: { l: linea.dl, m: linea.dt, x: linea.dc, j: linea.dj, v: linea.dv, s: linea.ds, d: linea.dg },
      confirmUrl,
    });
  };

  const handleEnviarLinea = async (lineaId: number, provNom: string) => {
    if (isEnviandoLinea(lineaId, "proveedor")) return;
    setEnviandoLinea(lineaId, "proveedor", true);
    setFallosEnvio((prev) => prev.filter((f) => !(f.lineaId === lineaId && f.parte === "proveedor")));
    const ok = await sendEmailApi(lineaId);
    setEnviandoLinea(lineaId, "proveedor", false);
    if (ok) {
      dispatch({ type: "ENVIAR_CORREO_LINEA", lineaId });
      showToast(`Correo enviado a ${provNom}.`);
      return;
    }
    const linea = state.distribucion.find((l) => l.id === lineaId);
    if (linea) {
      setFallosEnvio((prev) => [
        ...prev.filter((f) => !(f.lineaId === lineaId && f.parte === "proveedor")),
        { lineaId, nombre: linea.proveedorNom, materialNom: linea.materialNom, parte: "proveedor" },
      ]);
    }
    showToast(`No se pudo enviar el correo a ${provNom}. Comprueba la conexión.`);
  };

  const handleEnviarLineaTransportista = async (lineaId: number, transNom: string) => {
    if (isEnviandoLinea(lineaId, "transportista")) return;
    setEnviandoLinea(lineaId, "transportista", true);
    setFallosEnvio((prev) => prev.filter((f) => !(f.lineaId === lineaId && f.parte === "transportista")));
    const ok = await sendEmailApiTransportista(lineaId);
    setEnviandoLinea(lineaId, "transportista", false);
    if (ok) {
      dispatch({ type: "ENVIAR_CORREO_TRANSPORTISTA", lineaId });
      showToast(`Correo enviado al transportista ${transNom}.`);
      return;
    }
    const linea = state.distribucion.find((l) => l.id === lineaId);
    if (linea) {
      setFallosEnvio((prev) => [
        ...prev.filter((f) => !(f.lineaId === lineaId && f.parte === "transportista")),
        { lineaId, nombre: transNom, materialNom: linea.materialNom, parte: "transportista" },
      ]);
    }
    showToast(`No se pudo enviar el correo al transportista ${transNom}. Comprueba la conexión.`);
  };

  const handleEnviarTodos = async () => {
    if (!solicitudId || enviandoTodos) return;
    setEnviandoTodos(true);
    setFallosEnvio([]);
    const lineasSnapshot = [...lineasPendientes];
    const resultados = await Promise.all(
      lineasSnapshot.flatMap((l) => {
        const tareas: Promise<{ ok: boolean; lineaId: number; nombre: string; materialNom: string; parte: "proveedor" | "transportista" }>[] = [
          sendEmailApi(l.id).then((ok) => ({ ok, lineaId: l.id, nombre: l.proveedorNom, materialNom: l.materialNom, parte: "proveedor" as const })),
        ];
        if (l.transportistaId > 0) {
          tareas.push(
            sendEmailApiTransportista(l.id).then((ok) => ({ ok, lineaId: l.id, nombre: l.transportistaNom, materialNom: l.materialNom, parte: "transportista" as const }))
          );
        }
        return tareas;
      })
    );

    const exitosos = resultados.filter((r) => r.ok);
    const fallidos = resultados.filter((r) => !r.ok);

    exitosos.forEach((r) => {
      if (r.parte === "proveedor") {
        dispatch({ type: "ENVIAR_CORREO_LINEA", lineaId: r.lineaId });
      } else {
        dispatch({ type: "ENVIAR_CORREO_TRANSPORTISTA", lineaId: r.lineaId });
      }
    });

    if (fallidos.length === 0) {
      showToast(`Correos enviados (${exitosos.length} en total).`);
    } else {
      setFallosEnvio(
        fallidos.map((r) => ({ lineaId: r.lineaId, nombre: r.nombre, materialNom: r.materialNom, parte: r.parte }))
      );
      showToast(
        exitosos.length > 0
          ? `${exitosos.length} correos enviados, ${fallidos.length} fallidos.`
          : `No se pudo enviar ningún correo (${fallidos.length}). Comprueba la conexión.`
      );
    }
    setEnviandoTodos(false);
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
              className={enviandoTodos ? "btn btn--muted" : "btn btn--primary"}
              disabled={lineasPendientes.length === 0 || enviandoTodos}
              onClick={() => void handleEnviarTodos()}
              style={{ position: "relative" }}
            >
              <Send size={16} aria-hidden="true" style={{ marginRight: "0.4rem" }} />
              {enviandoTodos ? "Enviando correos..." : "Enviar todos los correos pendientes"}
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

        <div className="toast-stack">
          {toasts.map((t) => (
            <div key={t.id} className="toast toast--success" role="status">{t.msg}</div>
          ))}
        </div>

        {/* Comentarios de producción */}
        {solicitudActiva && (solicitudActiva.comentarioGeneral || solicitudActiva.mantenimientosProgramados) && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}>
            {solicitudActiva.comentarioGeneral && (
              <div style={{
                flex: "1 1 240px",
                background: "var(--c-neutral-50)",
                border: "1px solid var(--c-neutral-200)",
                borderRadius: "8px",
                padding: "0.6rem 0.9rem",
                fontSize: "0.83rem",
              }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--c-neutral-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Comentario</span>
                <p style={{ margin: "0.15rem 0 0", color: "var(--c-neutral-700)", fontStyle: "italic" }}>{solicitudActiva.comentarioGeneral}</p>
              </div>
            )}
            {solicitudActiva.mantenimientosProgramados && (
              <div style={{
                flex: "1 1 240px",
                background: "var(--c-warning-50, #fffbeb)",
                border: "1px solid var(--c-warning-200, #fde68a)",
                borderRadius: "8px",
                padding: "0.6rem 0.9rem",
                fontSize: "0.83rem",
              }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--c-warning-700, #b45309)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mantenimientos programados</span>
                <p style={{ margin: "0.15rem 0 0", color: "var(--c-warning-800, #92400e)", fontStyle: "italic" }}>{solicitudActiva.mantenimientosProgramados}</p>
              </div>
            )}
          </div>
        )}

        {fallosEnvio.length > 0 && (
          <div
            role="alert"
            style={{
              background: "var(--c-danger-50, #fef2f2)",
              border: "1px solid var(--c-danger-300, #fca5a5)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontWeight: 700, color: "var(--c-danger-700, #b91c1c)", fontSize: "0.9rem", margin: 0 }}>
                {fallosEnvio.length === 1
                  ? "No se pudo enviar 1 correo"
                  : `No se pudieron enviar ${fallosEnvio.length} correos`}
              </p>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setFallosEnvio([])}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {fallosEnvio.map((f) => (
                <li
                  key={`${f.parte}-${f.lineaId}`}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}
                >
                  <span style={{ color: "var(--c-danger-700, #b91c1c)", flex: 1 }}>
                    <strong>{f.nombre}</strong>
                    <span style={{ color: "var(--c-neutral-500)", marginLeft: "0.35rem" }}>
                      — {f.materialNom} ({f.parte === "proveedor" ? "proveedor" : "transportista"})
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      void (f.parte === "proveedor"
                        ? handleEnviarLinea(f.lineaId, f.nombre)
                        : handleEnviarLineaTransportista(f.lineaId, f.nombre))
                    }
                  >
                    <Send size={12} aria-hidden="true" style={{ marginRight: "0.3rem" }} />
                    Reintentar
                  </button>
                </li>
              ))}
            </ul>
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

          {/* Banner de modificación por Producción */}
          {ultimaModifProduccion && (
            <div style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-start",
              background: "var(--c-warning-50, #fffbeb)",
              border: "1px solid var(--c-warning-300, #fcd34d)",
              borderRadius: "8px",
              padding: "0.85rem 1rem",
              marginBottom: "1rem",
            }}>
              <AlertTriangle size={16} style={{ color: "var(--c-warning-600, #d97706)", flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem" }}>
                <span style={{ fontWeight: 700, color: "var(--c-warning-800, #92400e)" }}>
                  Producción ha modificado la planificación
                </span>
                <span style={{ color: "var(--c-neutral-600)", fontSize: "0.8rem" }}>
                  {new Date(ultimaModifProduccion.ts).toLocaleString("es-ES", {
                    day: "2-digit", month: "2-digit", year: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                  {ultimaModifProduccion.motivo ? ` — "${ultimaModifProduccion.motivo}"` : ""}
                </span>
                <span style={{ color: "var(--c-neutral-700)", fontSize: "0.8rem" }}>
                  <strong>Cambios:</strong> {ultimaModifProduccion.descripcion}
                </span>
                <span style={{ color: "var(--c-warning-700, #b45309)", fontSize: "0.78rem", fontWeight: 500 }}>
                  Las tarjetas marcadas en amarillo requieren que el proveedor vuelva a confirmar.
                </span>
              </div>
            </div>
          )}

          {(() => {
            const lineasVisibles = solicitudActiva.lineas.filter((ls) => {
              const lineasDelMaterial = lineasDist.filter(
                (l) => l.lineaSolicitudId === ls.id
              );
              return (
                sumaViajes(ls) > 0 ||
                lineasDelMaterial.some((l) => totalLinea(l) > 0)
              );
            });
            const totalQuedan = lineasVisibles.reduce((acc, ls) => {
              const distribuido = lineasDist
                .filter((l) => l.lineaSolicitudId === ls.id)
                .reduce((s, l) => s + totalLinea(l), 0);
              return acc + Math.max(0, sumaViajes(ls) - distribuido);
            }, 0);
            return (
              <>
                {totalQuedan > 0 && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    padding: "0.5rem 1rem",
                    background: "var(--c-warning-50, #fffbeb)",
                    border: "1px solid var(--c-warning-300, #fcd34d)",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    color: "var(--c-warning-800, #92400e)",
                  }}>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{totalQuedan}</span>
                    <span>viaje{totalQuedan !== 1 ? "s" : ""} pendiente{totalQuedan !== 1 ? "s" : ""} de distribuir</span>
                  </div>
                )}
                {totalQuedan === 0 && lineasVisibles.length > 0 && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    padding: "0.5rem 1rem",
                    background: "var(--c-success-50, #f0fdf4)",
                    border: "1px solid var(--c-success-300, #86efac)",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    color: "var(--c-success-800, #166534)",
                  }}>
                    <span style={{ fontWeight: 700 }}>✓</span>
                    <span>Todos los viajes distribuidos</span>
                  </div>
                )}
                {lineasVisibles.map((ls) => {
            const lineasDelMaterial = lineasDist.filter(
              (l) => l.lineaSolicitudId === ls.id
            );
            const modificada = materialesModificados.has(ls.materialNom)
              && lineasDelMaterial.some((l) => l.confirmacionProveedor === "pendiente");
            return (
              <TarjetaMaterial
                key={ls.id}
                lineaSolicitud={ls}
                lineasDist={lineasDelMaterial}
                modificada={modificada}
                cambiosDescripcion={modificada ? cambiosPorMaterial.get(ls.materialNom) : undefined}
                fechaIni={solicitudActiva.ini}
                proveedores={proveedores}
                transportistas={transportistas}
                asignaciones={state.asignaciones}
                onAsignarProveedor={(lsId) => setModalLineaSolicitudId(lsId)}
                onAplicarReparto={handleAplicarReparto}
                onEnviarLinea={(lineaId, provNom) => void handleEnviarLinea(lineaId, provNom)}
                onEnviarLineaTransportista={(lineaId, transNom) => void handleEnviarLineaTransportista(lineaId, transNom)}
                isEnviandoLinea={isEnviandoLinea}
                onEditarLinea={handleEditarLinea}
                onEliminarLinea={handleEliminarLinea}
                onReasignarLinea={handleAbrirReasignar}
              />
            );
          })}
              </>
            );
          })()}
        </section>
      )}

      {/* Horario de llegadas */}
      {solicitudActiva && (
        <section className="page" style={{ marginTop: "1.5rem" }}>
          <header className="page__header" style={{ marginBottom: "1rem" }}>
            <div>
              <h3 style={{ margin: 0 }}>Horario de llegadas</h3>
              <p className="page__subtitle" style={{ marginTop: "0.25rem" }}>
                Franjas de descarga por silo para la semana {solicitudActiva.semana}
              </p>
            </div>
          </header>
          <HorarioLlegadasGrid
            solicitudId={solicitudActiva.id}
            horario={state.horarioLlegadas}
            materiales={state.materiales.filter((m) => m.activo).map((m) => m.nom)}
            editable
            onUpsert={(dia: DiaKey, franja: string, silo: "silo1" | "silo2", materialNom: string) => {
              dispatch({
                type: "UPSERT_HORARIO_SLOT",
                solicitudId: solicitudActiva.id,
                dia,
                franja,
                silo,
                materialNom,
              });
            }}
            onDelete={(slotId: number) => {
              dispatch({
                type: "DELETE_HORARIO_SLOT",
                solicitudId: solicitudActiva.id,
                slotId,
              });
            }}
          />
        </section>
      )}

      {/* Modal reasignación */}
      {reasignarState && (
        <ModalReasignar
          state={reasignarState}
          proveedores={proveedores}
          transportistas={transportistas}
          onChange={(updates) =>
            setReasignarState((prev) => (prev ? { ...prev, ...updates } : prev))
          }
          onGuardar={handleGuardarReasignacion}
          onClose={() => setReasignarState(null)}
        />
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
              destino: lineaEditando.destino,
              dl: String(lineaEditando.dl),
              dt: String(lineaEditando.dt),
              dc: String(lineaEditando.dc),
              dj: String(lineaEditando.dj),
              dv: String(lineaEditando.dv),
              ds: String(lineaEditando.ds),
              dg: String(lineaEditando.dg),
            }
          : lineaModalData.destino
          ? { ...FORM_EMPTY, destino: lineaModalData.destino }
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
            destinos={state.destinos}
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
