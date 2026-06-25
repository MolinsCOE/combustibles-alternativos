import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCaStore, type DiaKey } from "../store/caStore.js";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const DIAS_KEYS: DiaKey[] = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];
const DIAS_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

type Flujo = "confirmacion-total" | "confirmacion-parcial" | "rechazo" | null;
type TipoConfirmacion = "proveedor" | "transportista";

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ConfirmarLineaPage() {
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useCaStore();

  const lineaIdParam = searchParams.get("id");
  const proveedorIdParam = searchParams.get("prov");
  const transportistaIdParam = searchParams.get("trans");
  const tipoParam = searchParams.get("tipo");

  const tipo: TipoConfirmacion =
    tipoParam === "transportista" ? "transportista" : "proveedor";

  const lineaId = lineaIdParam !== null ? parseInt(lineaIdParam, 10) : NaN;
  const proveedorId =
    tipo === "proveedor" && proveedorIdParam !== null
      ? parseInt(proveedorIdParam, 10)
      : NaN;
  const transportistaId =
    tipo === "transportista" && transportistaIdParam !== null
      ? parseInt(transportistaIdParam, 10)
      : NaN;

  const [respondido, setRespondido] = useState(false);
  const [accion, setAccion] = useState<"confirmada" | "rechazada" | null>(null);
  const [flujoActivo, setFlujoActivo] = useState<Flujo>(null);
  const [modificando, setModificando] = useState(false);

  // Confirmación total
  const [comentarioConfirmacion, setComentarioConfirmacion] = useState("");

  // Confirmación parcial — se guarda como string para evitar el problema de type="number" controlado
  const [cantidadesParciales, setCantidadesParciales] = useState<Partial<Record<DiaKey, string>>>({});
  const [comentarioParcial, setComentarioParcial] = useState("");

  // Rechazo
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState(false);

  // Buscar la línea
  const linea =
    isNaN(lineaId)
      ? undefined
      : tipo === "proveedor"
      ? state.distribucion.find((l) => l.id === lineaId && l.proveedorId === proveedorId)
      : state.distribucion.find((l) => l.id === lineaId && l.transportistaId === transportistaId);

  const solicitud = linea
    ? state.solicitudes.find((s) => s.id === linea.solicitudId)
    : undefined;

  const actor =
    tipo === "proveedor"
      ? state.proveedores.find((p) => p.id === proveedorId)
      : state.proveedores.find((p) => p.id === transportistaId);

  // Si los params son inválidos o no se encuentra la línea
  if (!linea || !actor) {
    return (
      <div className="page" style={{ maxWidth: "600px", margin: "3rem auto", padding: "0 1rem" }}>
        <header style={{ marginBottom: "2rem", borderBottom: "2px solid var(--c-neutral-200)", paddingBottom: "1rem" }}>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--c-neutral-700)" }}>
            Molins &mdash; Combustibles Alternativos
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
  const estadoActual =
    tipo === "proveedor" ? linea.confirmacionProveedor : linea.confirmacionTransportista;
  const yaRespondio = (respondido || estadoActual === "confirmada" || estadoActual === "rechazada") && !modificando;

  // Total de viajes confirmados en modo parcial
  const totalParcial = DIAS_KEYS.reduce((s, k) => {
    const raw = cantidadesParciales[k];
    if (raw === undefined) return s + linea[k];
    const num = parseInt(raw, 10);
    return s + (isNaN(num) ? linea[k] : Math.max(0, Math.min(num, linea[k])));
  }, 0);

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

  const resetFlujo = () => {
    setFlujoActivo(null);
    setComentarioConfirmacion("");
    setCantidadesParciales({});
    setComentarioParcial("");
    setMotivo("");
    setErrorMotivo(false);
  };

  const handleModificar = () => {
    // Pre-rellenar con cantidades ya confirmadas si las hay
    const cantActuales = tipo === "proveedor" ? linea.cantidadesProveedor : linea.cantidadesTransportista;
    if (cantActuales) {
      const preRelleno: Partial<Record<DiaKey, string>> = {};
      for (const k of DIAS_KEYS) {
        if (cantActuales[k] !== undefined) preRelleno[k] = String(cantActuales[k]);
      }
      setCantidadesParciales(preRelleno);
    }
    resetFlujo();
    setRespondido(false);
    setAccion(null);
    setModificando(true);
  };

  const handleConfirmarTotal = () => {
    if (tipo === "proveedor") {
      dispatch({
        type: "CONFIRMAR_LINEA_PROVEEDOR",
        lineaId,
        proveedorId,
        comentario: comentarioConfirmacion.trim() || null,
      });
    } else {
      dispatch({
        type: "CONFIRMAR_LINEA_TRANSPORTISTA",
        lineaId,
        transportistaId,
        comentario: comentarioConfirmacion.trim() || null,
      });
    }
    setAccion("confirmada");
    setRespondido(true);
    setModificando(false);
  };

  const handleConfirmarParcial = () => {
    const cantidades = cantidadesParcialesNum();
    if (tipo === "proveedor") {
      dispatch({
        type: "CONFIRMAR_LINEA_PROVEEDOR",
        lineaId,
        proveedorId,
        comentario: comentarioParcial.trim() || null,
        cantidades,
      });
    } else {
      dispatch({
        type: "CONFIRMAR_LINEA_TRANSPORTISTA",
        lineaId,
        transportistaId,
        comentario: comentarioParcial.trim() || null,
        cantidades,
      });
    }
    setAccion("confirmada");
    setRespondido(true);
    setModificando(false);
  };

  const handleRechazar = () => {
    if (motivo.trim() === "") {
      setErrorMotivo(true);
      return;
    }
    if (tipo === "proveedor") {
      dispatch({ type: "RECHAZAR_LINEA_PROVEEDOR", lineaId, proveedorId, motivo: motivo.trim() });
    } else {
      dispatch({ type: "RECHAZAR_LINEA_TRANSPORTISTA", lineaId, transportistaId, motivo: motivo.trim() });
    }
    setAccion("rechazada");
    setRespondido(true);
    setModificando(false);
  };

  const handleCantidadChange = (k: DiaKey, raw: string) => {
    setCantidadesParciales((prev) => ({ ...prev, [k]: raw }));
  };

  // Convierte el estado de edición a números para enviar al servidor
  const cantidadesParcialesNum = (): Partial<Record<DiaKey, number>> => {
    const result: Partial<Record<DiaKey, number>> = {};
    for (const [k, v] of Object.entries(cantidadesParciales) as [DiaKey, string][]) {
      const num = parseInt(v, 10);
      const max = linea[k as DiaKey];
      result[k as DiaKey] = isNaN(num) ? max : Math.max(0, Math.min(num, max));
    }
    return result;
  };

  // Textos según el tipo
  const tituloAccion =
    tipo === "transportista"
      ? "Confirmar disponibilidad de transporte"
      : "¿Puedes atender esta planificación?";
  const subtituloViajes =
    tipo === "transportista" ? "Viajes a transportar" : "Viajes por día";
  const textoConfirmarTotal =
    tipo === "transportista" ? "Confirmar disponibilidad" : "Confirmar planificación";

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
            Molins
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
            {tipo === "proveedor" ? (
              <>
                <dt style={{ color: "var(--c-neutral-500)", fontWeight: 600 }}>Proveedor</dt>
                <dd style={{ margin: 0 }}>{linea.proveedorNom}</dd>
                <dt style={{ color: "var(--c-neutral-500)", fontWeight: 600 }}>Destino</dt>
                <dd style={{ margin: 0 }}>{linea.destino || "—"}</dd>
                <dt style={{ color: "var(--c-neutral-500)", fontWeight: 600 }}>Transportista</dt>
                <dd style={{ margin: 0 }}>{linea.transportistaNom}</dd>
              </>
            ) : (
              <>
                <dt style={{ color: "var(--c-neutral-500)", fontWeight: 600 }}>Transportista</dt>
                <dd style={{ margin: 0 }}>{linea.transportistaNom}</dd>
                <dt style={{ color: "var(--c-neutral-500)", fontWeight: 600 }}>Destino</dt>
                <dd style={{ margin: 0 }}>{linea.destino || "—"}</dd>
                <dt style={{ color: "var(--c-neutral-500)", fontWeight: 600 }}>Proveedor</dt>
                <dd style={{ margin: 0 }}>{linea.proveedorNom}</dd>
              </>
            )}
          </dl>

          {/* Tabla de viajes por día */}
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--c-neutral-600)", marginBottom: "0.5rem" }}>
              {subtituloViajes}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "0.4rem",
              }}
            >
              {DIAS_KEYS.map((k, i) => {
                const cantidades =
                  tipo === "proveedor" ? linea.cantidadesProveedor : linea.cantidadesTransportista;
                const confirmado = cantidades?.[k] !== undefined ? (cantidades[k] ?? linea[k]) : linea[k];
                const estaConfirmado =
                  (tipo === "proveedor" ? linea.confirmacionProveedor : linea.confirmacionTransportista) === "confirmada";
                const valorMostrado = estaConfirmado ? confirmado : linea[k];
                const reducido = estaConfirmado && confirmado < linea[k];
                return (
                  <div
                    key={k}
                    style={{
                      textAlign: "center",
                      background: linea[k] > 0 ? "var(--c-neutral-100)" : "transparent",
                      borderRadius: "6px",
                      padding: "0.4rem 0.2rem",
                      outline: reducido ? "1px solid var(--c-warning-400, #fbbf24)" : undefined,
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "var(--c-neutral-500)", fontWeight: 600 }}>
                      {DIAS_LABELS[i]}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: reducido ? "var(--c-warning-700, #b45309)" : undefined }}>
                      {valorMostrado}
                    </div>
                    {reducido && (
                      <div style={{ fontSize: "0.65rem", color: "var(--c-neutral-400)", textDecoration: "line-through" }}>
                        {linea[k]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--c-neutral-600)", marginTop: "0.75rem" }}>
              {(tipo === "proveedor" ? linea.confirmacionProveedor : linea.confirmacionTransportista) === "confirmada" && (linea.cantidadesProveedor ?? linea.cantidadesTransportista)
                ? <>Total confirmado: <strong>{DIAS_KEYS.reduce((s, k) => {
                    const c = tipo === "proveedor" ? linea.cantidadesProveedor : linea.cantidadesTransportista;
                    return s + (c?.[k] !== undefined ? (c[k] ?? linea[k]) : linea[k]);
                  }, 0)} viajes</strong> <span style={{ color: "var(--c-neutral-400)", fontSize: "0.78rem" }}>(de {total} solicitados)</span></>
                : <>Total semana: <strong>{total} viajes</strong></>
              }
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
                {tipo === "transportista" ? "Disponibilidad confirmada" : "Planificación confirmada"}
              </p>
              <p style={{ color: "var(--c-neutral-600)", fontSize: "0.9rem" }}>
                Gracias por confirmar. Hemos registrado tu respuesta correctamente.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 700, color: "var(--c-danger-700, #b91c1c)", fontSize: "1.05rem", marginBottom: "0.25rem" }}>
                {tipo === "transportista" ? "Disponibilidad rechazada" : "Planificación rechazada"}
              </p>
              <p style={{ color: "var(--c-neutral-600)", fontSize: "0.9rem" }}>
                Hemos registrado tu rechazo. El equipo de Compras se pondrá en contacto contigo.
              </p>
            </>
          )}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ marginTop: "1rem" }}
            onClick={handleModificar}
          >
            Modificar respuesta
          </button>
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
            {tituloAccion}
          </p>

          {/* Selección de acción: ningún flujo activo */}
          {flujoActivo === null && (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setFlujoActivo("confirmacion-total")}
              >
                Confirmar todo
              </button>
              {total > 1 && (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setFlujoActivo("confirmacion-parcial")}
                >
                  Confirmar parcialmente
                </button>
              )}
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => setFlujoActivo("rechazo")}
              >
                Rechazar
              </button>
            </div>
          )}

          {/* Flujo: confirmación total */}
          {flujoActivo === "confirmacion-total" && (
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
                  onClick={resetFlujo}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleConfirmarTotal}
                >
                  {textoConfirmarTotal}
                </button>
              </div>
            </div>
          )}

          {/* Flujo: confirmación parcial */}
          {flujoActivo === "confirmacion-parcial" && (
            <div>
              <p style={{ fontSize: "0.88rem", color: "var(--c-neutral-600)", marginBottom: "1rem" }}>
                Indica cuántos viajes puedes{" "}
                {tipo === "transportista" ? "transportar" : "realizar"} cada día. Puedes reducir la cantidad, pero no puedes activar días que no estaban solicitados.
              </p>

              {/* Grid de días con inputs */}
              <div className="combustibles-dias-grid">
                {DIAS_KEYS.map((k, i) => {
                  const original = linea[k];
                  const rawStr = cantidadesParciales[k];
                  const valorActual = rawStr !== undefined ? rawStr : String(original);
                  const valorNum = rawStr !== undefined ? (parseInt(rawStr, 10) || 0) : original;
                  const reducido = valorNum < original;
                  return (
                    <div
                      key={k}
                      style={{
                        textAlign: "center",
                        background: original > 0 ? "var(--c-neutral-50)" : "transparent",
                        border: original > 0 ? "1px solid var(--c-neutral-200)" : "none",
                        borderRadius: "8px",
                        padding: "0.5rem 0.25rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--c-neutral-500)",
                          fontWeight: 600,
                          marginBottom: "0.25rem",
                        }}
                      >
                        {DIAS_LABELS[i]}
                      </div>
                      {original > 0 ? (
                        <>
                          <input
                            type="number"
                            min={0}
                            max={original}
                            value={valorActual}
                            onChange={(e) => handleCantidadChange(k, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            style={{
                              width: "100%",
                              textAlign: "center",
                              fontWeight: 700,
                              fontSize: "1rem",
                              border: reducido
                                ? "1px solid var(--c-warning-400, #fbbf24)"
                                : "1px solid var(--c-neutral-300)",
                              borderRadius: "4px",
                              padding: "0.2rem",
                              background: reducido ? "var(--c-warning-50, #fffbeb)" : "white",
                            }}
                          />
                          <div
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--c-neutral-400)",
                              marginTop: "0.2rem",
                            }}
                          >
                            máx. {original}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--c-neutral-300)" }}>
                          &mdash;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resumen de totales */}
              <div
                style={{
                  background: "var(--c-neutral-50)",
                  border: "1px solid var(--c-neutral-200)",
                  borderRadius: "8px",
                  padding: "0.75rem 1rem",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                Total confirmado:{" "}
                <strong
                  style={{
                    color: totalParcial < total ? "var(--c-warning-700, #b45309)" : "var(--c-success-700, #15803d)",
                  }}
                >
                  {totalParcial} de {total} viajes
                </strong>
              </div>

              {/* Comentario opcional */}
              <div className="form__field">
                <label htmlFor="comentario-parcial">
                  Comentario{" "}
                  <span style={{ fontWeight: 400, color: "var(--c-neutral-500)" }}>(opcional)</span>
                </label>
                <textarea
                  id="comentario-parcial"
                  rows={2}
                  placeholder="Indica el motivo de la reducción u otras observaciones..."
                  value={comentarioParcial}
                  onChange={(e) => setComentarioParcial(e.target.value)}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={resetFlujo}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleConfirmarParcial}
                >
                  Confirmar con estas cantidades
                </button>
              </div>
            </div>
          )}

          {/* Flujo: rechazo */}
          {flujoActivo === "rechazo" && (
            <div>
              <div className="form__field">
                <label htmlFor="motivo-rechazo">
                  Motivo del rechazo <span style={{ color: "var(--c-danger-600, #dc2626)" }}>*</span>
                </label>
                <textarea
                  id="motivo-rechazo"
                  rows={4}
                  placeholder={
                    tipo === "transportista"
                      ? "Indica el motivo por el que no puedes realizar el transporte de esta planificación..."
                      : "Indica el motivo por el que no puedes atender esta planificación..."
                  }
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
                  onClick={resetFlujo}
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
        Molins Cement &mdash; Dept. Compras
      </p>
    </div>
  );
}
