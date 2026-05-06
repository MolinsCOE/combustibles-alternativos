import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCaStore, type DiaKey } from "../store/caStore.js";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const DIAS_KEYS: DiaKey[] = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];
const DIAS_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ConfirmarLineaPage() {
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useCaStore();

  const lineaIdParam = searchParams.get("id");
  const proveedorIdParam = searchParams.get("prov");

  const lineaId = lineaIdParam !== null ? parseInt(lineaIdParam, 10) : NaN;
  const proveedorId = proveedorIdParam !== null ? parseInt(proveedorIdParam, 10) : NaN;

  const [respondido, setRespondido] = useState(false);
  const [accion, setAccion] = useState<"confirmada" | "rechazada" | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [comentarioConfirmacion, setComentarioConfirmacion] = useState("");
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState(false);

  // Buscar la línea y el proveedor
  const linea = isNaN(lineaId)
    ? undefined
    : state.distribucion.find((l) => l.id === lineaId && l.proveedorId === proveedorId);

  const solicitud = linea
    ? state.solicitudes.find((s) => s.id === linea.solicitudId)
    : undefined;

  const proveedor = isNaN(proveedorId)
    ? undefined
    : state.proveedores.find((p) => p.id === proveedorId);

  // Si los params son inválidos o no se encuentra la línea
  if (!linea || !proveedor) {
    return (
      <div className="page" style={{ maxWidth: "600px", margin: "3rem auto", padding: "0 1rem" }}>
        <header style={{ marginBottom: "2rem", borderBottom: "2px solid var(--c-neutral-200)", paddingBottom: "1rem" }}>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--c-neutral-700)" }}>
            Cementos Molins &mdash; Combustibles Alternativos
          </p>
        </header>
        <div
          style={{
            background: "var(--c-danger-50, #fef2f2)",
            border: "1px solid var(--c-danger-200, #fecaca)",
            borderRadius: "8px",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontWeight: 700, color: "var(--c-danger-700, #b91c1c)", marginBottom: "0.5rem" }}>
            Enlace no válido
          </p>
          <p style={{ color: "var(--c-neutral-600)", fontSize: "0.9rem" }}>
            No se ha encontrado la planificación correspondiente a este enlace.
            Es posible que el enlace haya caducado o sea incorrecto.
          </p>
        </div>
      </div>
    );
  }

  const total = DIAS_KEYS.reduce((s, k) => s + linea[k], 0);
  const estadoActual = linea.confirmacionProveedor;
  const yaRespondio = respondido || estadoActual === "confirmada" || estadoActual === "rechazada";

  // Pill de estado
  const renderPillEstado = (estado: typeof estadoActual) => {
    switch (estado) {
      case "confirmada":
        return <span className="pill pill--success">Confirmada</span>;
      case "rechazada":
        return <span className="pill pill--danger">Rechazada</span>;
      default:
        return <span className="pill pill--muted">Pendiente</span>;
    }
  };

  const handleConfirmar = () => {
    dispatch({
      type: "CONFIRMAR_LINEA_PROVEEDOR",
      lineaId,
      proveedorId,
      comentario: comentarioConfirmacion.trim() || null,
    });
    setAccion("confirmada");
    setRespondido(true);
  };

  const handleRechazar = () => {
    if (motivo.trim() === "") {
      setErrorMotivo(true);
      return;
    }
    dispatch({ type: "RECHAZAR_LINEA_PROVEEDOR", lineaId, proveedorId, motivo: motivo.trim() });
    setAccion("rechazada");
    setRespondido(true);
  };

  return (
    <div className="page" style={{ maxWidth: "640px", margin: "2rem auto", padding: "0 1rem" }}>
      {/* Cabecera de marca */}
      <header
        style={{
          marginBottom: "2rem",
          borderBottom: "2px solid var(--c-neutral-200)",
          paddingBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--c-neutral-800)", margin: 0 }}>
            Cementos Molins
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--c-neutral-500)", margin: 0 }}>
            Combustibles Alternativos
          </p>
        </div>
      </header>

      {/* Tarjeta de detalle de la planificación */}
      <section
        style={{
          border: "1px solid var(--c-neutral-200)",
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            background: "var(--c-neutral-50)",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--c-neutral-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <div>
            <p style={{ fontWeight: 700, fontSize: "1rem", margin: 0 }}>
              {linea.materialNom}
            </p>
            {solicitud && (
              <p style={{ fontSize: "0.82rem", color: "var(--c-neutral-500)", margin: 0 }}>
                Semana {solicitud.semana}
              </p>
            )}
          </div>
          {renderPillEstado(estadoActual)}
        </div>

        <div style={{ padding: "1rem 1.25rem" }}>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "0.4rem 1rem",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            <dt style={{ color: "var(--c-neutral-500)", fontWeight: 600 }}>Proveedor</dt>
            <dd style={{ margin: 0 }}>{linea.proveedorNom}</dd>
            <dt style={{ color: "var(--c-neutral-500)", fontWeight: 600 }}>Transportista</dt>
            <dd style={{ margin: 0 }}>{linea.transportistaNom}</dd>
          </dl>

          {/* Tabla de viajes por día */}
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--c-neutral-600)", marginBottom: "0.5rem" }}>
              Viajes por día
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "0.4rem",
              }}
            >
              {DIAS_KEYS.map((k, i) => (
                <div
                  key={k}
                  style={{
                    textAlign: "center",
                    background: linea[k] > 0 ? "var(--c-neutral-100)" : "transparent",
                    borderRadius: "6px",
                    padding: "0.4rem 0.2rem",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "var(--c-neutral-500)", fontWeight: 600 }}>
                    {DIAS_LABELS[i]}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                    {linea[k]}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--c-neutral-600)", marginTop: "0.75rem" }}>
              Total semana: <strong>{total} viajes</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Zona de respuesta */}
      {yaRespondio ? (
        <div
          style={{
            border: "1px solid var(--c-neutral-200)",
            borderRadius: "10px",
            padding: "1.5rem",
            textAlign: "center",
            background: accion === "confirmada" || estadoActual === "confirmada"
              ? "var(--c-success-50, #f0fdf4)"
              : "var(--c-danger-50, #fef2f2)",
          }}
        >
          {(accion === "confirmada" || estadoActual === "confirmada") ? (
            <>
              <p style={{ fontWeight: 700, color: "var(--c-success-700, #15803d)", fontSize: "1.05rem", marginBottom: "0.25rem" }}>
                Planificación confirmada
              </p>
              <p style={{ color: "var(--c-neutral-600)", fontSize: "0.9rem" }}>
                Gracias por confirmar. Hemos registrado tu respuesta correctamente.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 700, color: "var(--c-danger-700, #b91c1c)", fontSize: "1.05rem", marginBottom: "0.25rem" }}>
                Planificación rechazada
              </p>
              <p style={{ color: "var(--c-neutral-600)", fontSize: "0.9rem" }}>
                Hemos registrado tu rechazo. El equipo de Compras se pondrá en contacto contigo.
              </p>
            </>
          )}
          {estadoActual !== "pendiente" && !respondido && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--c-neutral-500)" }}>
              Ya has respondido a esta planificación.
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--c-neutral-200)",
            borderRadius: "10px",
            padding: "1.25rem",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "1rem", color: "var(--c-neutral-700)" }}>
            ¿Puedes atender esta planificación?
          </p>

          {!mostrarConfirmacion && !mostrarRechazo ? (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setMostrarConfirmacion(true)}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => setMostrarRechazo(true)}
              >
                Rechazar
              </button>
            </div>
          ) : mostrarConfirmacion ? (
            <div>
              <div className="form__field">
                <label htmlFor="comentario-confirmacion">
                  Comentario{" "}
                  <span style={{ fontWeight: 400, color: "var(--c-neutral-500)" }}>(opcional)</span>
                </label>
                <textarea
                  id="comentario-confirmacion"
                  rows={3}
                  placeholder="Añade cualquier observación si es necesario (incidencias previstas, restricciones horarias, etc.)..."
                  value={comentarioConfirmacion}
                  onChange={(e) => setComentarioConfirmacion(e.target.value)}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setMostrarConfirmacion(false);
                    setComentarioConfirmacion("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleConfirmar}
                >
                  Confirmar planificación
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="form__field">
                <label htmlFor="motivo-rechazo">
                  Motivo del rechazo <span style={{ color: "var(--c-danger-600, #dc2626)" }}>*</span>
                </label>
                <textarea
                  id="motivo-rechazo"
                  rows={4}
                  placeholder="Indica el motivo por el que no puedes atender esta planificación..."
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    if (e.target.value.trim() !== "") setErrorMotivo(false);
                  }}
                  style={{
                    width: "100%",
                    resize: "vertical",
                    border: errorMotivo ? "1px solid var(--c-danger-500, #ef4444)" : undefined,
                  }}
                />
                {errorMotivo && (
                  <p style={{ color: "var(--c-danger-600, #dc2626)", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                    El motivo es obligatorio para rechazar la planificación.
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setMostrarRechazo(false);
                    setMotivo("");
                    setErrorMotivo(false);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={handleRechazar}
                >
                  Confirmar rechazo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p
        style={{
          marginTop: "2rem",
          fontSize: "0.78rem",
          color: "var(--c-neutral-400)",
          textAlign: "center",
        }}
      >
        Cementos Molins, S.A. &mdash; Dept. Compras
      </p>
    </div>
  );
}
