import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useRoleDetail, useRoleMutations } from "../hooks/use-roles.js";
import { RoleFormDialog, type RoleFormValues } from "../components/RoleFormDialog.js";

export function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roleId = id ?? "";
  const navigate = useNavigate();
  const onBack = (): void => {
    void navigate("/administracion/roles");
  };
  const { t } = useTranslation("roles");
  const { t: tCommon } = useTranslation("common");
  const { state, reload } = useRoleDetail(roleId);
  const mutations = useRoleMutations();
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  };

  const openEdit = () => {
    mutations.clearError();
    setEditing(true);
  };

  const closeEdit = () => {
    mutations.clearError();
    setEditing(false);
  };

  const handleSubmit = async (values: RoleFormValues) => {
    const input = {
      nombre: values.nombre.trim(),
      descripcion: values.descripcion?.trim() ? values.descripcion.trim() : null
    };
    const updated = await mutations.update(roleId, input);
    if (updated) {
      showToast(t("toast.updated", { nombre: updated.nombre }));
      setEditing(false);
      reload();
    }
  };

  if (state.kind === "loading") {
    return (
      <section className="page">
        <nav className="breadcrumbs" aria-label={t("nav.aria")}>
          <button type="button" className="link-button" onClick={onBack}>
            {t("detail.back")}
          </button>
        </nav>
        <p className="empty-state">{t("detail.loading")}</p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section className="page">
        <nav className="breadcrumbs" aria-label={t("nav.aria")}>
          <button type="button" className="link-button" onClick={onBack}>
            {t("detail.back")}
          </button>
        </nav>
        <div className="toast" role="alert">
          {state.message}{" "}
          <button type="button" className="link-button" onClick={reload}>
            {tCommon("actions.retry")}
          </button>
        </div>
      </section>
    );
  }

  const role = state.data;
  const usuarios = role.usuarios;

  return (
    <section className="page">
      <nav className="breadcrumbs" aria-label={t("nav.aria")}>
        <button type="button" className="link-button" onClick={onBack}>
          {t("detail.back")}
        </button>
      </nav>

      {toast && (
        <div className="toast toast--success" role="status">
          {toast}
        </div>
      )}

      <header className="page__header">
        <div>
          <h2>{role.nombre}</h2>
          <p className="page__subtitle">
            {role.descripcion || t("detail.noDescription")}
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={openEdit}>
          {t("detail.editButton")}
        </button>
      </header>

      <section className="detail-section">
        <header className="detail-section__header">
          <h3>{t("detail.usersSection")}</h3>
          <span className="badge">{usuarios.length}</span>
        </header>

        {usuarios.length === 0 ? (
          <p className="empty-state">{t("detail.usersEmpty")}</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t("detail.columns.nombre")}</th>
                  <th scope="col">{t("detail.columns.email")}</th>
                  <th scope="col">{t("detail.columns.estado")}</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.nombre}</strong>
                    </td>
                    <td className="table__col--muted">{u.email}</td>
                    <td>
                      <span
                        className={
                          u.activo ? "pill pill--success" : "pill pill--muted"
                        }
                      >
                        {u.activo ? tCommon("state.active") : tCommon("state.inactive")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <RoleFormDialog
        open={editing}
        mode="edit"
        initialValues={{
          nombre: role.nombre,
          descripcion: role.descripcion ?? ""
        }}
        submitting={mutations.pending}
        serverError={mutations.error}
        onClose={closeEdit}
        onSubmit={(v) => {
          void handleSubmit(v);
        }}
      />
    </section>
  );
}
