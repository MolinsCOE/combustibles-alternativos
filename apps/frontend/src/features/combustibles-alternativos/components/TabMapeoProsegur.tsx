import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProsegurMaps } from "../hooks/use-prosegur.js";
import type { Material, Proveedor } from "../store/caStore.js";

type Props = {
  materiales: Material[];
  proveedores: Proveedor[];
};

type FormState = {
  prosegurLabel: string;
  materialId: string;
  proveedorId: string;
};

const FORM_INIT: FormState = {
  prosegurLabel: "",
  materialId: "",
  proveedorId: "",
};

export function TabMapeoProsegur({ materiales, proveedores }: Props) {
  const { t } = useTranslation("combustibles");
  const { maps, loading, upsert, remove } = useProsegurMaps();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_INIT);
  const [toast, setToast] = useState<{ msg: string; tipo: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const showToast = (msg: string, tipo: "success" | "error" = "success") => {
    setToast({ msg, tipo });
    window.setTimeout(() => setToast(null), 4000);
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.prosegurLabel.trim()) {
      newErrors.prosegurLabel = t("prosegur.maestros.form.errors.labelRequerido");
    }
    if (!form.materialId) {
      newErrors.materialId = t("prosegur.maestros.form.errors.materialRequerido");
    }
    if (!form.proveedorId) {
      newErrors.proveedorId = t("prosegur.maestros.form.errors.proveedorRequerido");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardar = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await upsert({
        prosegurLabel: form.prosegurLabel.trim(),
        materialId: Number(form.materialId),
        proveedorId: Number(form.proveedorId),
      });
      showToast(t("prosegur.maestros.toast.guardado"));
      setForm(FORM_INIT);
      setShowModal(false);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al guardar el mapeo",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await remove(id);
      showToast(t("prosegur.maestros.toast.eliminado"));
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al eliminar el mapeo",
        "error"
      );
    }
  };

  const materialName = (id: number) =>
    materiales.find((m) => m.id === id)?.nom ?? String(id);

  const proveedorName = (id: number) =>
    proveedores.find((p) => p.id === id)?.nom ?? String(id);

  // Todos los activos: un label de Prosegur puede contener tanto un proveedor como un transportista
  const proveedoresMat = proveedores.filter((p) => p.activo);

  return (
    <div>
      {toast && (
        <div
          className={toast.tipo === "error" ? "toast toast--error" : "toast toast--success"}
          role="status"
          style={{ marginBottom: "1rem" }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: "0.5rem" }}>
        <p style={{ color: "var(--c-neutral-600)", fontSize: "0.88rem", margin: "0 0 0.75rem" }}>
          {t("prosegur.maestros.subtitle")}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => { setForm(FORM_INIT); setErrors({}); setShowModal(true); }}
        >
          {t("prosegur.maestros.crear")}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--c-neutral-400)" }}>Cargando...</p>
      ) : maps.length === 0 ? (
        <p style={{ color: "var(--c-neutral-400)" }}>{t("prosegur.maestros.sinMapeos")}</p>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t("prosegur.maestros.columns.label")}</th>
                <th scope="col">{t("prosegur.maestros.columns.material")}</th>
                <th scope="col">{t("prosegur.maestros.columns.proveedor")}</th>
                <th scope="col" className="table__col--actions">
                  {t("prosegur.maestros.columns.acciones")}
                </th>
              </tr>
            </thead>
            <tbody>
              {maps.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.83rem" }}>
                    {m.prosegurLabel}
                  </td>
                  <td>{materialName(m.materialId)}</td>
                  <td>{proveedorName(m.proveedorId)}</td>
                  <td className="table__col--actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--danger-ghost"
                      onClick={() => { void handleEliminar(m.id); }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-prosegur-map-title"
          onClick={() => setShowModal(false)}
        >
          <div
            className="dialog"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="dialog__header">
              <h2 id="modal-prosegur-map-title">
                {t("prosegur.maestros.form.title_create")}
              </h2>
              <button
                type="button"
                className="btn-icon"
                aria-label="Cerrar"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </header>
            <div className="form" style={{ padding: "1rem 1.25rem" }}>
              <div className="form__field">
                <label htmlFor="pm-label">
                  {t("prosegur.maestros.form.label")}
                </label>
                <input
                  id="pm-label"
                  type="text"
                  value={form.prosegurLabel}
                  placeholder={t("prosegur.maestros.form.labelPlaceholder")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, prosegurLabel: e.target.value }))
                  }
                />
                {errors.prosegurLabel && (
                  <p className="form__error">{errors.prosegurLabel}</p>
                )}
              </div>
              <div className="form__field">
                <label htmlFor="pm-mat">{t("prosegur.maestros.form.material")}</label>
                <select
                  id="pm-mat"
                  value={form.materialId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, materialId: e.target.value }))
                  }
                >
                  <option value="">— Seleccionar —</option>
                  {materiales
                    .filter((m) => m.activo)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom}
                      </option>
                    ))}
                </select>
                {errors.materialId && (
                  <p className="form__error">{errors.materialId}</p>
                )}
              </div>
              <div className="form__field">
                <label htmlFor="pm-prov">{t("prosegur.maestros.form.proveedor")}</label>
                <select
                  id="pm-prov"
                  value={form.proveedorId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, proveedorId: e.target.value }))
                  }
                >
                  <option value="">— Seleccionar —</option>
                  {proveedoresMat.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
                {errors.proveedorId && (
                  <p className="form__error">{errors.proveedorId}</p>
                )}
              </div>
            </div>
            <footer className="dialog__footer">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={saving}
                onClick={() => { void handleGuardar(); }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
