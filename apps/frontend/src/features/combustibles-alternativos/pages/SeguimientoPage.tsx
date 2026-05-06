import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FileUp } from "lucide-react";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore } from "../store/caStore.js";
import { ImportarProsegurModal } from "../components/ImportarProsegurModal.js";
import type { FilaProsegurParseada } from "../utils/parseProsegur.js";
// Tipos que espera el modal (del mock antiguo)
import type { Material, Proveedor, Transportista, Asignacion } from "../data/mock.js";

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

type TipoEstado = "incidencia" | "aviso" | "ok";

type FilaCruce = {
  materialNom: string;
  proveedorNom: string;
  transportistaNom: string;
  planificado: number;
  confirmado: number;
  real: number;
  desviacion: number;
  tipo: TipoEstado;
  motivoRechazo: string | null;
};

type FormViaje = {
  materialId: string;
  proveedorId: string;
  transportistaId: string;
  viajes: string;
  fecha: string;
  destino: string;
  obs: string;
};

const FORM_INIT: FormViaje = {
  materialId: "",
  proveedorId: "",
  transportistaId: "",
  viajes: "",
  fecha: new Date().toISOString().slice(0, 10),
  destino: "",
  obs: "",
};

function estadoClass(tipo: TipoEstado): string {
  switch (tipo) {
    case "incidencia": return "pill pill--danger";
    case "aviso":      return "pill pill--warning";
    default:           return "pill pill--success";
  }
}

// ---------------------------------------------------------------------------
// Función cruce (igual que antes pero con tipos del store)
// ---------------------------------------------------------------------------

function aplicarCruceAutomatico(
  filasActuales: FilaCruce[],
  filasImportadas: FilaProsegurParseada[]
): FilaCruce[] {
  const conteos = new Map<string, number>();
  for (const fila of filasImportadas) {
    if (fila.noMapeado || !fila.materialNombre || !fila.proveedorNombre || !fila.transportistaNombre) continue;
    const clave = `${fila.materialNombre}|${fila.proveedorNombre}|${fila.transportistaNombre}`;
    conteos.set(clave, (conteos.get(clave) ?? 0) + 1);
  }

  const actualizadas = filasActuales.map((fila) => {
    const clave = `${fila.materialNom}|${fila.proveedorNom}|${fila.transportistaNom}`;
    const real = conteos.get(clave) ?? fila.real;
    conteos.delete(clave);
    const desviacion = real - fila.confirmado;
    const tipo: TipoEstado = desviacion < 0 ? "incidencia" : desviacion > 0 ? "aviso" : "ok";
    return { ...fila, real, desviacion, tipo };
  });

  for (const [clave, conteo] of conteos.entries()) {
    const [materialNom, proveedorNom, transportistaNom] = clave.split("|");
    actualizadas.push({
      materialNom: materialNom ?? "",
      proveedorNom: proveedorNom ?? "",
      transportistaNom: transportistaNom ?? "",
      planificado: 0,
      confirmado: 0,
      real: conteo,
      desviacion: conteo,
      tipo: "aviso",
      motivoRechazo: null,
    });
  }

  return actualizadas;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export function SeguimientoPage() {
  const { t } = useTranslation("combustibles");
  const { state, dispatch } = useCaStore();

  const [diaSeleccionado, setDiaSeleccionado] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [showForm, setShowForm] = useState(false);
  const [showImportar, setShowImportar] = useState(false);
  const [form, setForm] = useState<FormViaje>(FORM_INIT);
  const [toast, setToast] = useState<{ msg: string; tipo: "success" | "warning" } | null>(null);

  const showToast = (msg: string, tipo: "success" | "warning" = "success") => {
    setToast({ msg, tipo });
    window.setTimeout(() => setToast(null), 4000);
  };

  // Construir filas de cruce desde el store (distribución confirmada vs entradas reales)
  const [filas, setFilas] = useState<FilaCruce[]>(() => {
    // Cruce inicial: distribuciones confirmadas del store
    return state.distribucion.map((l) => ({
      materialNom: l.materialNom,
      proveedorNom: l.proveedorNom,
      transportistaNom: l.transportistaNom,
      planificado:
        l.dl + l.dt + l.dc + l.dj + l.dv + l.ds + l.dg,
      confirmado: l.confirmacionProveedor === "confirmada"
        ? l.dl + l.dt + l.dc + l.dj + l.dv + l.ds + l.dg
        : 0,
      real: 0,
      desviacion: l.confirmacionProveedor === "confirmada"
        ? -(l.dl + l.dt + l.dc + l.dj + l.dv + l.ds + l.dg)
        : 0,
      tipo: l.confirmacionProveedor === "confirmada" ? "incidencia" as TipoEstado : "ok" as TipoEstado,
      motivoRechazo: l.motivoRechazoProveedor,
    }));
  });

  // Adaptar datos del store al shape que espera el modal/parser (del mock antiguo)
  const materialesMock = useMemo((): Material[] =>
    state.materiales
      .filter((m) => m.activo)
      .map((m) => ({
        id: String(m.id),
        nombre: m.nom,
        destinoId: "d1",
        destinoNombre: "",
        horaInicioRestriccion: null,
        horaFinRestriccion: null,
        activo: m.activo,
      })),
    [state.materiales]
  );

  const proveedoresMock = useMemo((): Proveedor[] =>
    state.proveedores
      .filter((p) => p.activo && (p.tipus === "proveedor" || p.tipus === "ambos"))
      .map((p) => ({
        id: String(p.id),
        nombre: p.nom,
        email: p.email,
        activo: p.activo,
      })),
    [state.proveedores]
  );

  const transportistasMock = useMemo((): Transportista[] =>
    state.proveedores
      .filter((p) => p.activo && (p.tipus === "transportista" || p.tipus === "ambos"))
      .map((p) => ({
        id: String(p.id),
        nombre: p.nom,
        emails: [p.email],
        activo: p.activo,
      })),
    [state.proveedores]
  );

  const asignacionesMock = useMemo((): Asignacion[] =>
    state.asignaciones.map((a) => ({
      id: String(a.id),
      materialId: String(a.materialId),
      materialNombre: state.materiales.find((m) => m.id === a.materialId)?.nom ?? "",
      proveedorId: String(a.proveedorId),
      proveedorNombre: state.proveedores.find((p) => p.id === a.proveedorId)?.nom ?? "",
      transportistaId: String(a.transportistaId),
      transportistaNombre: state.proveedores.find((p) => p.id === a.transportistaId)?.nom ?? "",
      porcentaje: a.pct,
    })),
    [state.asignaciones, state.materiales, state.proveedores]
  );

  const handleGuardarViaje = () => {
    if (!form.materialId || !form.proveedorId || !form.transportistaId || !form.viajes) return;

    const mat = state.materiales.find((m) => m.id === Number(form.materialId));
    const prov = state.proveedores.find((p) => p.id === Number(form.proveedorId));
    const trans = state.proveedores.find((p) => p.id === Number(form.transportistaId));
    if (!mat || !prov || !trans) return;

    const viajesNum = parseInt(form.viajes, 10) || 0;

    dispatch({
      type: "ADD_ENTRADA_REAL",
      entrada: {
        solicitudId: null,
        fecha: form.fecha,
        materialId: mat.id,
        materialNom: mat.nom,
        proveedorId: prov.id,
        proveedorNom: prov.nom,
        transportistaId: trans.id,
        transportistaNom: trans.nom,
        viajes: viajesNum,
        destino: form.destino,
        obs: form.obs,
      },
    });

    // Actualizar tabla de cruce
    const nuevaFila: FilaCruce = {
      materialNom: mat.nom,
      proveedorNom: prov.nom,
      transportistaNom: trans.nom,
      planificado: 0,
      confirmado: 0,
      real: viajesNum,
      desviacion: viajesNum,
      tipo: "aviso",
      motivoRechazo: null,
    };
    setFilas((prev) => [...prev, nuevaFila]);
    setForm(FORM_INIT);
    setShowForm(false);
    showToast(t("seguimiento.toast.guardado"));
  };

  const handleConfirmarImportacion = (filasImportadas: FilaProsegurParseada[]) => {
    setShowImportar(false);

    // Guardar cada fila mapeada como entrada real en el store
    for (const fila of filasImportadas) {
      if (fila.noMapeado || !fila.materialId || !fila.proveedorId || !fila.transportistaId) continue;
      const mat = state.materiales.find((m) => String(m.id) === fila.materialId);
      const prov = state.proveedores.find((p) => String(p.id) === fila.proveedorId);
      const trans = state.proveedores.find((p) => String(p.id) === fila.transportistaId);
      if (!mat || !prov || !trans) continue;
      dispatch({
        type: "ADD_ENTRADA_REAL",
        entrada: {
          solicitudId: null,
          fecha: fila.fecha,
          materialId: mat.id,
          materialNom: mat.nom,
          proveedorId: prov.id,
          proveedorNom: prov.nom,
          transportistaId: trans.id,
          transportistaNom: trans.nom,
          viajes: 1,
          destino: fila.destino,
          obs: "",
        },
      });
    }

    const filasActualizadas = aplicarCruceAutomatico(filas, filasImportadas);
    setFilas(filasActualizadas);

    const noMapeadas = filasImportadas.filter((f) => f.noMapeado).length;
    if (noMapeadas > 0) {
      showToast(t("seguimiento.importar.toast.importadoConAvisos", { n: noMapeadas }), "warning");
    } else {
      showToast(t("seguimiento.importar.toast.importadoOk"));
    }
  };

  const materialesActivos = state.materiales.filter((m) => m.activo);
  const proveedoresActivos = state.proveedores.filter(
    (p) => p.activo && (p.tipus === "proveedor" || p.tipus === "ambos")
  );
  const transportistasActivos = state.proveedores.filter(
    (p) => p.activo && (p.tipus === "transportista" || p.tipus === "ambos")
  );

  return (
    <div className="combustibles-page">
      <DemoBanner />

      <section className="page">
        <header className="page__header">
          <div>
            <h2>{t("seguimiento.title")}</h2>
            <p className="page__subtitle">{t("seguimiento.subtitle")}</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setShowImportar(true)}
            >
              <FileUp size={16} aria-hidden="true" style={{ marginRight: "0.4rem" }} />
              {t("seguimiento.importar.boton")}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setShowForm((v) => !v)}
            >
              {t("seguimiento.registrarViajes")}
            </button>
          </div>
        </header>

        {toast && (
          <div className={`toast toast--${toast.tipo}`} role="status">
            {toast.msg}
          </div>
        )}

        {/* Selector de día */}
        <div className="combustibles-semana-bar">
          <div className="form__field" style={{ marginBottom: 0 }}>
            <label htmlFor="dia-selector">{t("seguimiento.diaLabel")}</label>
            <input
              id="dia-selector"
              type="date"
              value={diaSeleccionado}
              style={{ maxWidth: "200px" }}
              onChange={(e) => setDiaSeleccionado(e.target.value)}
            />
          </div>
        </div>

        {/* Formulario inline registro de viajes reales */}
        {showForm && (
          <div className="combustibles-form-panel">
            <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "var(--c-primary-500)" }}>
              {t("seguimiento.formulario.title")}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto auto",
                gap: "1rem",
                alignItems: "flex-end",
              }}
            >
              <div className="form__field" style={{ marginBottom: 0 }}>
                <label htmlFor="form-material">{t("seguimiento.formulario.material")}</label>
                <select
                  id="form-material"
                  value={form.materialId}
                  onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
                >
                  <option value="">— Seleccionar —</option>
                  {materialesActivos.map((m) => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form__field" style={{ marginBottom: 0 }}>
                <label htmlFor="form-proveedor">{t("seguimiento.formulario.proveedor")}</label>
                <select
                  id="form-proveedor"
                  value={form.proveedorId}
                  onChange={(e) => setForm((f) => ({ ...f, proveedorId: e.target.value }))}
                >
                  <option value="">— Seleccionar —</option>
                  {proveedoresActivos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form__field" style={{ marginBottom: 0 }}>
                <label htmlFor="form-transportista">{t("seguimiento.formulario.transportista")}</label>
                <select
                  id="form-transportista"
                  value={form.transportistaId}
                  onChange={(e) => setForm((f) => ({ ...f, transportistaId: e.target.value }))}
                >
                  <option value="">— Seleccionar —</option>
                  {transportistasActivos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form__field" style={{ marginBottom: 0 }}>
                <label htmlFor="form-viajes">{t("seguimiento.formulario.viajes")}</label>
                <input
                  id="form-viajes"
                  type="number"
                  min={0}
                  value={form.viajes}
                  style={{ maxWidth: "100px" }}
                  onChange={(e) => setForm((f) => ({ ...f, viajes: e.target.value }))}
                />
              </div>
              <div className="form__field" style={{ marginBottom: 0 }}>
                <label htmlFor="form-destino">Destino</label>
                <input
                  id="form-destino"
                  type="text"
                  value={form.destino}
                  style={{ maxWidth: "180px" }}
                  onChange={(e) => setForm((f) => ({ ...f, destino: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="btn btn--primary" onClick={handleGuardarViaje}>
                {t("seguimiento.formulario.guardar")}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>
                {t("seguimiento.formulario.cancelar")}
              </button>
            </div>
          </div>
        )}

        {/* Tabla entradas reales del store */}
        {state.entradasReales.length > 0 && (
          <>
            <h3 style={{ fontSize: "1rem", margin: "1rem 0 0.5rem", color: "var(--c-neutral-700)" }}>
              Entradas registradas
            </h3>
            <div className="table-wrapper">
              <table className="table" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Material</th>
                    <th scope="col">Proveedor</th>
                    <th scope="col">Transportista</th>
                    <th scope="col" className="table__col--numeric">Viajes</th>
                    <th scope="col">Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {state.entradasReales.map((e) => (
                    <tr key={e.id}>
                      <td>{e.fecha}</td>
                      <td>{e.materialNom}</td>
                      <td>{e.proveedorNom}</td>
                      <td>{e.transportistaNom}</td>
                      <td className="table__col--numeric">{e.viajes}</td>
                      <td className="table__col--muted">{e.destino || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Sección cruce */}
        {filas.length > 0 && (
          <>
            <h3
              style={{
                fontSize: "1rem",
                margin: "1.5rem 0 0.5rem",
                color: "var(--c-neutral-700)",
              }}
            >
              Cruce planificado vs. confirmado vs. real
            </h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">{t("seguimiento.columns.material")}</th>
                    <th scope="col">{t("seguimiento.columns.proveedor")}</th>
                    <th scope="col">{t("seguimiento.columns.transportista")}</th>
                    <th scope="col" className="table__col--numeric">{t("seguimiento.columns.planificado")}</th>
                    <th scope="col" className="table__col--numeric">{t("seguimiento.columns.confirmado")}</th>
                    <th scope="col" className="table__col--numeric">{t("seguimiento.columns.real")}</th>
                    <th scope="col" className="table__col--numeric">{t("seguimiento.columns.desviacion")}</th>
                    <th scope="col">{t("seguimiento.columns.estado")}</th>
                    <th scope="col">{t("seguimiento.columns.motivo")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, i) => (
                    <tr
                      key={i}
                      className={
                        fila.tipo === "incidencia"
                          ? "combustibles-row--incidencia"
                          : fila.tipo === "aviso"
                          ? "combustibles-row--aviso"
                          : ""
                      }
                    >
                      <td className="combustibles-material-cell">{fila.materialNom}</td>
                      <td>{fila.proveedorNom}</td>
                      <td>{fila.transportistaNom}</td>
                      <td className="table__col--numeric">{fila.planificado}</td>
                      <td className="table__col--numeric">{fila.confirmado}</td>
                      <td className="table__col--numeric">{fila.real}</td>
                      <td
                        className={`table__col--numeric ${
                          fila.desviacion < 0
                            ? "combustibles__cell--danger"
                            : fila.desviacion > 0
                            ? "combustibles__cell--warning"
                            : ""
                        }`}
                      >
                        {fila.desviacion > 0 ? `+${fila.desviacion}` : fila.desviacion}
                      </td>
                      <td>
                        <span className={estadoClass(fila.tipo)}>
                          {t(`seguimiento.estados.${fila.tipo}`)}
                        </span>
                      </td>
                      <td className="table__col--muted" style={{ fontSize: "0.85rem" }}>
                        {fila.motivoRechazo ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Modal de importación Prosegur */}
      {showImportar && (
        <ImportarProsegurModal
          onClose={() => setShowImportar(false)}
          onConfirmar={handleConfirmarImportacion}
          materiales={materialesMock}
          proveedores={proveedoresMock}
          transportistas={transportistasMock}
          asignaciones={asignacionesMock}
        />
      )}
    </div>
  );
}
