import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import {
  useCaStore,
  type Destino,
  type Material,
  type PlantillaDistribucion,
  type Proveedor,
  type Asignacion,
  type DiaKey,
} from "../store/caStore.js";
import { TabMapeoProsegur } from "../components/TabMapeoProsegur.js";
import { usePlantillaDistribucion } from "../hooks/use-plantilla-distribucion.js";
import { HorarioLlegadasGrid } from "../components/HorarioLlegadasGrid.js";

type Tab = "materiales" | "destinos" | "proveedores" | "asignaciones" | "plantilla" | "horario-plantilla" | "prosegur";

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
// Pestaña Destinos
// ---------------------------------------------------------------------------

function TabDestinos() {
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

  const handleToggle = (d: Destino) => {
    dispatch({ type: "TOGGLE_DESTINO", id: d.id });
    showToast(t("maestros.destinos.toast.editado"));
  };

  const handleCrear = () => {
    if (!nuevoNom.trim()) return;
    dispatch({ type: "ADD_DESTINO", nom: nuevoNom.trim() });
    showToast(t("maestros.destinos.toast.creado"));
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
          {t("maestros.destinos.crear")}
        </button>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("maestros.destinos.columns.nombre")}</th>
              <th scope="col">{t("maestros.destinos.columns.activo")}</th>
              <th scope="col" className="table__col--actions">
                {t("maestros.destinos.columns.acciones")}
              </th>
            </tr>
          </thead>
          <tbody>
            {state.destinos.map((d) => (
              <tr key={d.id}>
                <td>{d.nom}</td>
                <td>
                  <span className={d.activo ? "pill pill--success" : "pill pill--muted"}>
                    {d.activo ? tCommon("state.active") : tCommon("state.inactive")}
                  </span>
                </td>
                <td className="table__col--actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleToggle(d)}
                  >
                    {d.activo ? tCommon("state.inactive") : tCommon("state.active")}
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
          aria-labelledby="modal-dest-title"
          onClick={() => setShowModal(false)}
        >
          <div className="dialog" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog__header">
              <h2 id="modal-dest-title">{t("maestros.destinos.form.title_create")}</h2>
              <button type="button" className="btn-icon" aria-label="Cerrar" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </header>
            <div className="form" style={{ padding: "1rem 1.25rem" }}>
              <div className="form__field">
                <label htmlFor="dest-nom">{t("maestros.destinos.form.nombre")}</label>
                <input
                  ref={inputRef}
                  id="dest-nom"
                  type="text"
                  value={nuevoNom}
                  placeholder="Ej. QUEMADOR SILO 3"
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

type FormProv = { nom: string; tipus: Proveedor["tipus"]; emails: string[]; bcc: string[] };
const FORM_PROV_INIT: FormProv = { nom: "", tipus: "proveedor", emails: [""], bcc: [] };

function TabProveedores() {
  const { t } = useTranslation("combustibles");
  const { t: tCommon } = useTranslation("common");
  const { state, dispatch } = useCaStore();
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormProv>(FORM_PROV_INIT);
  // Modal de edición de emails de un proveedor existente
  const [editandoProv, setEditandoProv] = useState<Proveedor | null>(null);
  const [editEmails, setEditEmails] = useState<string[]>([""]);
  const [editBcc, setEditBcc] = useState<string[]>([]);

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
    const emails = form.emails.map((e) => e.trim()).filter(Boolean);
    const bcc = form.bcc.map((e) => e.trim()).filter(Boolean);
    dispatch({ type: "ADD_PROVEEDOR", nom: form.nom.trim(), tipus: form.tipus, emails, bcc });
    showToast("Proveedor / transportista añadido.");
    setForm(FORM_PROV_INIT);
    setShowModal(false);
  };

  const handleAbrirEditEmails = (p: Proveedor) => {
    setEditandoProv(p);
    setEditEmails(p.emails.length > 0 ? [...p.emails] : [""]);
    setEditBcc(p.bcc.length > 0 ? [...p.bcc] : []);
  };

  const handleGuardarEmails = () => {
    if (!editandoProv) return;
    const emails = editEmails.map((e) => e.trim()).filter(Boolean);
    const bcc = editBcc.map((e) => e.trim()).filter(Boolean);
    dispatch({ type: "UPDATE_PROVEEDOR", id: editandoProv.id, changes: { emails, bcc } });
    showToast("Emails actualizados.");
    setEditandoProv(null);
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
              <th scope="col">Copia oculta (BCC)</th>
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
                <td className="table__col--muted">
                  {p.emails.length > 0 ? p.emails.join(", ") : <em style={{ color: "var(--c-neutral-400)" }}>Sin email</em>}
                </td>
                <td className="table__col--muted">
                  {p.bcc.length > 0 ? p.bcc.join(", ") : <em style={{ color: "var(--c-neutral-400)" }}>—</em>}
                </td>
                <td>
                  <span className={p.activo ? "pill pill--success" : "pill pill--muted"}>
                    {p.activo ? tCommon("state.active") : tCommon("state.inactive")}
                  </span>
                </td>
                <td className="table__col--actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleAbrirEditEmails(p)}
                  >
                    Editar emails
                  </button>
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

      {/* Modal crear proveedor */}
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
                <label>Emails de contacto</label>
                {form.emails.map((email, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem", alignItems: "center" }}>
                    <input
                      type="email"
                      value={email}
                      placeholder="email@ejemplo.com"
                      onChange={(e) => {
                        const next = [...form.emails];
                        next[i] = e.target.value;
                        setForm((f) => ({ ...f, emails: next }));
                      }}
                      style={{ flex: 1 }}
                    />
                    {form.emails.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label="Eliminar email"
                        onClick={() => setForm((f) => ({ ...f, emails: f.emails.filter((_, j) => j !== i) }))}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setForm((f) => ({ ...f, emails: [...f.emails, ""] }))}
                  style={{ marginTop: "0.25rem" }}
                >
                  + Añadir email
                </button>
              </div>
              <div className="form__field">
                <label>
                  Copia oculta (BCC)
                  <span style={{ fontWeight: 400, color: "var(--c-neutral-500)", marginLeft: "0.4rem", fontSize: "0.82rem" }}>opcional</span>
                </label>
                {form.bcc.map((email, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem", alignItems: "center" }}>
                    <input
                      type="email"
                      value={email}
                      placeholder="email@ejemplo.com"
                      onChange={(e) => {
                        const next = [...form.bcc];
                        next[i] = e.target.value;
                        setForm((f) => ({ ...f, bcc: next }));
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label="Eliminar BCC"
                      onClick={() => setForm((f) => ({ ...f, bcc: f.bcc.filter((_, j) => j !== i) }))}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setForm((f) => ({ ...f, bcc: [...f.bcc, ""] }))}
                  style={{ marginTop: "0.25rem" }}
                >
                  + Añadir BCC
                </button>
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

      {/* Modal editar emails de proveedor existente */}
      {editandoProv !== null && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-emails-title"
          onClick={() => setEditandoProv(null)}
        >
          <div className="dialog" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog__header">
              <h2 id="modal-edit-emails-title">Emails — {editandoProv.nom}</h2>
              <button type="button" className="btn-icon" aria-label="Cerrar" onClick={() => setEditandoProv(null)}>
                &times;
              </button>
            </header>
            <div className="form" style={{ padding: "1rem 1.25rem" }}>
              <div className="form__field">
                <label>Emails de contacto</label>
                {editEmails.map((email, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem", alignItems: "center" }}>
                    <input
                      type="email"
                      value={email}
                      placeholder="email@ejemplo.com"
                      onChange={(e) => {
                        const next = [...editEmails];
                        next[i] = e.target.value;
                        setEditEmails(next);
                      }}
                      style={{ flex: 1 }}
                    />
                    {editEmails.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label="Eliminar email"
                        onClick={() => setEditEmails((prev) => prev.filter((_, j) => j !== i))}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setEditEmails((prev) => [...prev, ""])}
                  style={{ marginTop: "0.25rem" }}
                >
                  + Añadir email
                </button>
              </div>
              <div className="form__field" style={{ marginTop: "0.75rem" }}>
                <label>
                  Copia oculta (BCC)
                  <span style={{ fontWeight: 400, color: "var(--c-neutral-500)", marginLeft: "0.4rem", fontSize: "0.82rem" }}>
                    recibirá todos los correos sin que el destinatario lo vea
                  </span>
                </label>
                {editBcc.length === 0 && (
                  <p style={{ fontSize: "0.82rem", color: "var(--c-neutral-400)", marginBottom: "0.4rem" }}>Sin destinatarios en copia oculta.</p>
                )}
                {editBcc.map((email, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem", alignItems: "center" }}>
                    <input
                      type="email"
                      value={email}
                      placeholder="email@ejemplo.com"
                      onChange={(e) => {
                        const next = [...editBcc];
                        next[i] = e.target.value;
                        setEditBcc(next);
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label="Eliminar BCC"
                      onClick={() => setEditBcc((prev) => prev.filter((_, j) => j !== i))}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setEditBcc((prev) => [...prev, ""])}
                  style={{ marginTop: "0.25rem" }}
                >
                  + Añadir BCC
                </button>
              </div>
            </div>
            <footer className="dialog__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setEditandoProv(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn--primary" onClick={handleGuardarEmails}>
                Guardar
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
// Pestaña Plantilla de distribución
// ---------------------------------------------------------------------------

type FormPlantilla = {
  materialId: string;
  destino: string;
};
const FORM_PLANTILLA_INIT: FormPlantilla = { materialId: "", destino: "" };

function TabPlantilla() {
  const { state, dispatch } = useCaStore();
  const { plantilla, loading, error, create, remove } = usePlantillaDistribucion();
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormPlantilla>(FORM_PLANTILLA_INIT);
  const [confirmDelete, setConfirmDelete] = useState<PlantillaDistribucion | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleCrear = async () => {
    if (!form.materialId || !form.destino) return;
    setSaving(true);
    try {
      const mat = state.materiales.find((m) => m.id === Number(form.materialId));
      if (!mat) return;
      const created = await create({
        materialId: mat.id,
        materialNom: mat.nom,
        destino: form.destino,
      });
      dispatch({
        type: "ADD_PLANTILLA_ROW",
        row: {
          materialId: created.materialId,
          materialNom: created.materialNom,
          destino: created.destino,
          activo: created.activo,
        },
      });
      showToast("Ruta añadida.");
      setForm(FORM_PLANTILLA_INIT);
      setShowModal(false);
    } catch {
      showToast("Error al añadir la ruta.");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (row: PlantillaDistribucion) => {
    try {
      await remove(row.id);
      dispatch({ type: "REMOVE_PLANTILLA_ROW", id: row.id });
      showToast("Ruta eliminada.");
    } catch {
      showToast("Error al eliminar la ruta.");
    }
    setConfirmDelete(null);
  };

  const rows = plantilla.length > 0 ? plantilla : state.plantillaDistribucion;

  return (
    <div>
      {toast && (
        <div className="toast toast--success" role="status" style={{ marginBottom: "1rem" }}>
          {toast}
        </div>
      )}
      {error && (
        <div className="toast toast--danger" role="alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <button type="button" className="btn btn--primary" onClick={() => setShowModal(true)}>
          Añadir ruta
        </button>
      </div>
      {loading ? (
        <p style={{ color: "var(--c-neutral-400)", textAlign: "center" }}>Cargando...</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Material</th>
                <th scope="col">Destino</th>
                <th scope="col" className="table__col--actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "var(--c-neutral-400)", padding: "1rem" }}>
                    Sin rutas definidas. Usa "Añadir ruta" para crear la primera.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.materialNom}</td>
                    <td>{r.destino}</td>
                    <td className="table__col--actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm btn--danger-ghost"
                        onClick={() => setConfirmDelete(r)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal añadir ruta */}
      {showModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-plantilla-title"
          onClick={() => setShowModal(false)}
        >
          <div className="dialog" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog__header">
              <h2 id="modal-plantilla-title">Nueva ruta de distribución</h2>
              <button type="button" className="btn-icon" aria-label="Cerrar" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </header>
            <div className="form" style={{ padding: "1rem 1.25rem" }}>
              <div className="form__field">
                <label htmlFor="plt-mat">Material</label>
                <select
                  id="plt-mat"
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
                <label htmlFor="plt-destino">Destino</label>
                <select
                  id="plt-destino"
                  value={form.destino}
                  onChange={(e) => setForm((f) => ({ ...f, destino: e.target.value }))}
                >
                  <option value="">— Seleccionar destino —</option>
                  {state.destinos.filter((d) => d.activo).map((d) => (
                    <option key={d.id} value={d.nom}>{d.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <footer className="dialog__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!form.materialId || !form.destino || saving}
                onClick={() => { void handleCrear(); }}
              >
                {saving ? "Guardando..." : "Añadir"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Confirmación eliminar */}
      {confirmDelete !== null && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-del-plantilla-title"
          onClick={() => setConfirmDelete(null)}
        >
          <div className="dialog" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog__header">
              <h2 id="modal-del-plantilla-title">Eliminar ruta</h2>
              <button type="button" className="btn-icon" aria-label="Cerrar" onClick={() => setConfirmDelete(null)}>
                &times;
              </button>
            </header>
            <div style={{ padding: "1rem 1.25rem" }}>
              <p>
                ¿Eliminar la ruta <strong>{confirmDelete.materialNom} → {confirmDelete.destino}</strong>?
              </p>
            </div>
            <footer className="dialog__footer">
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => { void handleEliminar(confirmDelete); }}
              >
                Eliminar
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

// ---------------------------------------------------------------------------
// Pestaña Plantilla de Horario
// ---------------------------------------------------------------------------

function TabHorarioPlantilla() {
  const { state, dispatch } = useCaStore();

  const slots = state.horarioPlantilla.map((h) => ({
    id: h.id,
    dia: h.dia,
    franja: h.franja,
    silo: h.silo,
    materialNom: h.materialNom,
  }));

  return (
    <div>
      <p style={{ marginBottom: "1rem", fontSize: "0.88rem", color: "var(--c-neutral-600)" }}>
        Define el horario predeterminado de llegadas. Se copiará automáticamente cada vez que Compras inicie la distribución de una nueva semana.
      </p>
      <HorarioLlegadasGrid
        slots={slots}
        materiales={state.materiales.filter((m) => m.activo).map((m) => m.nom)}
        editable
        onUpsert={(dia: DiaKey, franja: string, silo: "silo1" | "silo2", materialNom: string) => {
          dispatch({ type: "UPSERT_HORARIO_PLANTILLA_SLOT", dia, franja, silo, materialNom });
        }}
        onDelete={(slotId: number) => {
          dispatch({ type: "DELETE_HORARIO_PLANTILLA_SLOT", slotId });
        }}
      />
    </div>
  );
}

export function MaestrosPage() {
  const { t } = useTranslation("combustibles");
  const { state } = useCaStore();
  const [tab, setTab] = useState<Tab>("materiales");

  const tabs: { key: Tab; label: string }[] = [
    { key: "materiales",   label: t("maestros.tabs.materiales") },
    { key: "destinos",     label: t("maestros.tabs.destinos") },
    { key: "proveedores",  label: t("maestros.tabs.proveedores") },
    { key: "asignaciones", label: t("maestros.tabs.asignaciones") },
    { key: "plantilla",         label: "Plantilla distribución" },
    { key: "horario-plantilla", label: "Plantilla horario" },
    { key: "prosegur",          label: t("prosegur.maestros.tabLabel") },
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
          {tab === "destinos"     && <TabDestinos />}
          {tab === "proveedores"  && <TabProveedores />}
          {tab === "asignaciones" && <TabAsignaciones />}
          {tab === "plantilla"    && <TabPlantilla />}
          {tab === "horario-plantilla" && <TabHorarioPlantilla />}
          {tab === "prosegur" && (
            <TabMapeoProsegur
              materiales={state.materiales}
              proveedores={state.proveedores}
            />
          )}
        </div>
      </section>
    </div>
  );
}
