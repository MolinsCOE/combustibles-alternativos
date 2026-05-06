import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import {
  useCaStore,
  type Material,
  type Proveedor,
  type Asignacion,
} from "../store/caStore.js";

type Tab = "materiales" | "proveedores" | "asignaciones";

// ---------------------------------------------------------------------------
// Pestaña Materiales
// ---------------------------------------------------------------------------

function TabMateriales() {
  const { t } = useTranslation("combustibles");
  const { t: tCommon } = useTranslation("common");
  const { state, dispatch } = useCaStore();
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nuevoNom, setNuevoNom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = (m: Material) => {
    dispatch({ type: "TOGGLE_MATERIAL", id: m.id });
    showToast(t("maestros.materiales.toast.editado"));
  };

  const handleCrear = () => {
    if (!nuevoNom.trim()) return;
    dispatch({ type: "ADD_MATERIAL", nom: nuevoNom.trim() });
    showToast("Material añadido.");
    setNuevoNom("");
    setShowModal(false);
  };

  return (
    <div>
      {toast && (
        <div className="toast toast--success" role="status" style={{ marginBottom: "1rem" }}>
          {toast}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setShowModal(true);
            window.setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          {t("maestros.materiales.crear")}
        </button>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("maestros.materiales.columns.nombre")}</th>
              <th scope="col">{t("maestros.materiales.columns.activo")}</th>
              <th scope="col" className="table__col--actions">
                {t("maestros.materiales.columns.acciones")}
              </th>
            </tr>
          </thead>
          <tbody>
            {state.materiales.map((m) => (
              <tr key={m.id}>
                <td>{m.nom}</td>
                <td>
                  <span className={m.activo ? "pill pill--success" : "pill pill--muted"}>
                    {m.activo ? tCommon("state.active") : tCommon("state.inactive")}
                  </span>
                </td>
                <td className="table__col--actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleToggle(m)}
                  >
                    {m.activo ? tCommon("state.inactive") : tCommon("state.active")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-mat-title"
          onClick={() => setShowModal(false)}
        >
          <div className="dialog" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog__header">
              <h2 id="modal-mat-title">Nuevo material</h2>
              <button type="button" className="btn-icon" aria-label="Cerrar" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </header>
            <div className="form" style={{ padding: "1rem 1.25rem" }}>
              <div className="form__field">
                <label htmlFor="mat-nom">Nombre del material</label>
                <input
                  ref={inputRef}
                  id="mat-nom"
                  type="text"
                  value={nuevoNom}
                  placeholder="Ej. Biomasa Fina"
                  onChange={(e) => setNuevoNom(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCrear(); }}
                />
              </div>
            </div>
            <footer className="dialog__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!nuevoNom.trim()}
                onClick={handleCrear}
              >
                Añadir
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pestaña Proveedores
// ---------------------------------------------------------------------------

type FormProv = { nom: string; tipus: Proveedor["tipus"]; email: string };
const FORM_PROV_INIT: FormProv = { nom: "", tipus: "proveedor", email: "" };

function TabProveedores() {
  const { t } = useTranslation("combustibles");
  const { t: tCommon } = useTranslation("common");
  const { state, dispatch } = useCaStore();
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormProv>(FORM_PROV_INIT);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = (p: Proveedor) => {
    dispatch({ type: "TOGGLE_PROVEEDOR", id: p.id });
    showToast(t("maestros.proveedores.toast.editado"));
  };

  const handleCrear = () => {
    if (!form.nom.trim()) return;
    dispatch({ type: "ADD_PROVEEDOR", nom: form.nom.trim(), tipus: form.tipus, email: form.email.trim() });
    showToast("Proveedor / transportista añadido.");
    setForm(FORM_PROV_INIT);
    setShowModal(false);
  };

  const tipusLabel = (tipus: Proveedor["tipus"]) => {
    const map: Record<Proveedor["tipus"], string> = {
      proveedor: "Proveedor",
      transportista: "Transportista",
      ambos: "Ambos",
    };
    return map[tipus];
  };

  return (
    <div>
      {toast && (
        <div className="toast toast--success" role="status" style={{ marginBottom: "1rem" }}>
          {toast}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setShowModal(true)}
        >
          {t("maestros.proveedores.crear")}
        </button>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("maestros.proveedores.columns.nombre")}</th>
              <th scope="col">Tipo</th>
              <th scope="col">{t("maestros.proveedores.columns.email")}</th>
              <th scope="col">{t("maestros.proveedores.columns.activo")}</th>
              <th scope="col" className="table__col--actions">
                {t("maestros.proveedores.columns.acciones")}
              </th>
            </tr>
          </thead>
          <tbody>
            {state.proveedores.map((p) => (
              <tr key={p.id}>
                <td>{p.nom}</td>
                <td className="table__col--muted">{tipusLabel(p.tipus)}</td>
                <td className="table__col--muted">{p.email}</td>
                <td>
                  <span className={p.activo ? "pill pill--success" : "pill pill--muted"}>
                    {p.activo ? tCommon("state.active") : tCommon("state.inactive")}
                  </span>
                </td>
                <td className="table__col--actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleToggle(p)}
                  >
                    {p.activo ? tCommon("state.inactive") : tCommon("state.active")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-prov-title"
          onClick={() => setShowModal(false)}
        >
          <div className="dialog" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog__header">
              <h2 id="modal-prov-title">Nuevo proveedor / transportista</h2>
              <button type="button" className="btn-icon" aria-label="Cerrar" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </header>
            <div className="form" style={{ padding: "1rem 1.25rem" }}>
              <div className="form__field">
                <label htmlFor="prov-nom">Nombre</label>
                <input
                  id="prov-nom"
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </div>
              <div className="form__field">
                <label htmlFor="prov-tipus">Tipo</label>
                <select
                  id="prov-tipus"
                  value={form.tipus}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipus: e.target.value as Proveedor["tipus"] }))
                  }
                >
                  <option value="proveedor">Proveedor</option>
                  <option value="transportista">Transportista</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <div className="form__field">
                <label htmlFor="prov-email">Email</label>
                <input
                  id="prov-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <footer className="dialog__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!form.nom.trim()}
                onClick={handleCrear}
              >
                Añadir
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pestaña Asignaciones
// ---------------------------------------------------------------------------

type FormAsig = {
  materialId: string;
  proveedorId: string;
  transportistaId: string;
  pct: string;
};

const FORM_ASIG_INIT: FormAsig = {
  materialId: "", proveedorId: "", transportistaId: "", pct: "",
};

function TabAsignaciones() {
  const { t } = useTranslation("combustibles");
  const { t: tCommon } = useTranslation("common");
  const { state, dispatch } = useCaStore();
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormAsig>(FORM_ASIG_INIT);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleEliminar = (a: Asignacion) => {
    dispatch({ type: "DELETE_ASIGNACION", id: a.id });
    showToast(t("maestros.asignaciones.toast.eliminado"));
  };

  const handleCrear = () => {
    if (!form.materialId || !form.proveedorId || !form.transportistaId || !form.pct) return;
    dispatch({
      type: "ADD_ASIGNACION",
      materialId: Number(form.materialId),
      proveedorId: Number(form.proveedorId),
      transportistaId: Number(form.transportistaId),
      pct: Number(form.pct),
    });
    showToast("Asignación añadida.");
    setForm(FORM_ASIG_INIT);
    setShowModal(false);
  };

  // Suma de porcentajes por material + proveedor
  const sumaPorMaterial = (materialId: number): number =>
    state.asignaciones
      .filter((a) => a.materialId === materialId)
      .reduce((s, a) => s + a.pct, 0);

  const proveedoresMat = state.proveedores.filter(
    (p) => p.activo && (p.tipus === "proveedor" || p.tipus === "ambos")
  );
  const transportistas = state.proveedores.filter(
    (p) => p.activo && (p.tipus === "transportista" || p.tipus === "ambos")
  );

  return (
    <div>
      {toast && (
        <div className="toast toast--success" role="status" style={{ marginBottom: "1rem" }}>
          {toast}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <button type="button" className="btn btn--primary" onClick={() => setShowModal(true)}>
          {t("maestros.asignaciones.crear")}
        </button>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("maestros.asignaciones.columns.material")}</th>
              <th scope="col">{t("maestros.asignaciones.columns.proveedor")}</th>
              <th scope="col">{t("maestros.asignaciones.columns.transportista")}</th>
              <th scope="col" className="table__col--numeric">
                {t("maestros.asignaciones.columns.porcentaje")}
              </th>
              <th scope="col" className="table__col--actions">
                {t("maestros.asignaciones.columns.acciones")}
              </th>
            </tr>
          </thead>
          <tbody>
            {state.asignaciones.map((a) => {
              const mat = state.materiales.find((m) => m.id === a.materialId);
              const prov = state.proveedores.find((p) => p.id === a.proveedorId);
              const trans = state.proveedores.find((p) => p.id === a.transportistaId);
              const suma = sumaPorMaterial(a.materialId);
              const sumaOk = suma <= 100;
              return (
                <tr key={a.id}>
                  <td>{mat?.nom ?? a.materialId}</td>
                  <td>{prov?.nom ?? a.proveedorId}</td>
                  <td>{trans?.nom ?? a.transportistaId}</td>
                  <td className="table__col--numeric">
                    <span style={{ fontWeight: 600 }}>{a.pct}%</span>
                    {!sumaOk && (
                      <p style={{ color: "var(--c-warning-500)", fontSize: "0.75rem", marginTop: "0.1rem" }}>
                        {t("maestros.asignaciones.advertencia100", { suma })}
                      </p>
                    )}
                  </td>
                  <td className="table__col--actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--danger-ghost"
                      onClick={() => handleEliminar(a)}
                    >
                      {tCommon("actions.delete")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-asig-title"
          onClick={() => setShowModal(false)}
        >
          <div className="dialog" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog__header">
              <h2 id="modal-asig-title">Nueva asignación</h2>
              <button type="button" className="btn-icon" aria-label="Cerrar" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </header>
            <div className="form" style={{ padding: "1rem 1.25rem" }}>
              <div className="form__field">
                <label htmlFor="asig-mat">Material</label>
                <select
                  id="asig-mat"
                  value={form.materialId}
                  onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
                >
                  <option value="">— Seleccionar —</option>
                  {state.materiales.filter((m) => m.activo).map((m) => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form__field">
                <label htmlFor="asig-prov">Proveedor</label>
                <select
                  id="asig-prov"
                  value={form.proveedorId}
                  onChange={(e) => setForm((f) => ({ ...f, proveedorId: e.target.value }))}
                >
                  <option value="">— Seleccionar —</option>
                  {proveedoresMat.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form__field">
                <label htmlFor="asig-trans">Transportista</label>
                <select
                  id="asig-trans"
                  value={form.transportistaId}
                  onChange={(e) => setForm((f) => ({ ...f, transportistaId: e.target.value }))}
                >
                  <option value="">— Seleccionar —</option>
                  {transportistas.map((t) => (
                    <option key={t.id} value={t.id}>{t.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form__field">
                <label htmlFor="asig-pct">Porcentaje (%)</label>
                <input
                  id="asig-pct"
                  type="number"
                  min={1}
                  max={100}
                  value={form.pct}
                  onChange={(e) => setForm((f) => ({ ...f, pct: e.target.value }))}
                />
              </div>
              {form.materialId && (
                <p style={{ fontSize: "0.8rem", color: "var(--c-neutral-500)" }}>
                  Suma actual para este material:{" "}
                  <strong>
                    {state.asignaciones
                      .filter((a) => String(a.materialId) === form.materialId)
                      .reduce((s, a) => s + a.pct, 0)}
                    %
                  </strong>
                  {Number(form.pct) + state.asignaciones
                      .filter((a) => String(a.materialId) === form.materialId)
                      .reduce((s, a) => s + a.pct, 0) > 100 && (
                    <span style={{ color: "var(--c-warning-500)", marginLeft: "0.5rem" }}>
                      Superará el 100%
                    </span>
                  )}
                </p>
              )}
            </div>
            <footer className="dialog__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!form.materialId || !form.proveedorId || !form.transportistaId || !form.pct}
                onClick={handleCrear}
              >
                Añadir
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal Maestros
// ---------------------------------------------------------------------------

export function MaestrosPage() {
  const { t } = useTranslation("combustibles");
  const [tab, setTab] = useState<Tab>("materiales");

  const tabs: { key: Tab; label: string }[] = [
    { key: "materiales",   label: t("maestros.tabs.materiales") },
    { key: "proveedores",  label: t("maestros.tabs.proveedores") },
    { key: "asignaciones", label: t("maestros.tabs.asignaciones") },
  ];

  return (
    <div className="combustibles-page">
      <DemoBanner />

      <section className="page">
        <header className="page__header">
          <div>
            <h2>{t("maestros.title")}</h2>
            <p className="page__subtitle">{t("maestros.subtitle")}</p>
          </div>
        </header>

        <nav className="tabs" aria-label={t("maestros.title")}>
          {tabs.map((tb) => (
            <button
              key={tb.key}
              type="button"
              className={tab === tb.key ? "tabs__tab tabs__tab--active" : "tabs__tab"}
              onClick={() => setTab(tb.key)}
            >
              {tb.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: "0.75rem" }}>
          {tab === "materiales"   && <TabMateriales />}
          {tab === "proveedores"  && <TabProveedores />}
          {tab === "asignaciones" && <TabAsignaciones />}
        </div>
      </section>
    </div>
  );
}
