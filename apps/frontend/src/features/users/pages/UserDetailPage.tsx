import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  useRolesOptions,
  useUserDetail,
  useUserMutations
} from "../hooks/use-users.js";
import {
  UserFormDialog,
  type RoleOption,
  type UserFormValues
} from "../components/UserFormDialog.js";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = id ?? "";
  const navigate = useNavigate();
  const onBack = (): void => {
    void navigate("/administracion/usuarios");
  };
  const { t } = useTranslation("users");
  const { t: tCommon } = useTranslation("common");
  const { state, reload } = useUserDetail(userId);
  const rolesState = useRolesOptions();
  const mutations = useUserMutations();
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const roleOptions: RoleOption[] =
    rolesState.kind === "ready"
      ? rolesState.data.map((r) => ({ id: r.id, nombre: r.nombre }))
      : [];

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

  const handleSubmit = async (values: UserFormValues) => {
    const updated = await mutations.update(userId, {
      nombre: values.nombre.trim(),
      email: values.email.trim(),
      rolId: values.rolId,
      activo: values.activo
    });
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

  const user = state.data;

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
          <h2>{user.nombre}</h2>
          <p className="page__subtitle">{user.email}</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={openEdit}>
          {t("detail.editButton")}
        </button>
      </header>

      <section className="detail-section">
        <header className="detail-section__header">
          <h3>{t("detail.section.title")}</h3>
        </header>
        <dl className="definition-list">
          <div className="definition-list__row">
            <dt>{t("detail.fields.nombre")}</dt>
            <dd>{user.nombre}</dd>
          </div>
          <div className="definition-list__row">
            <dt>{t("detail.fields.email")}</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="definition-list__row">
            <dt>{t("detail.fields.rol")}</dt>
            <dd>{user.rolNombre}</dd>
          </div>
          <div className="definition-list__row">
            <dt>{t("detail.fields.estado")}</dt>
            <dd>
              <span
                className={user.activo ? "pill pill--success" : "pill pill--muted"}
              >
                {user.activo ? tCommon("state.active") : tCommon("state.inactive")}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <UserFormDialog
        open={editing}
        mode="edit"
        roles={roleOptions}
        initialValues={{
          nombre: user.nombre,
          email: user.email,
          rolId: user.rolId,
          activo: user.activo
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
