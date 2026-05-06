import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  UserFormDialog,
  type RoleOption,
  type UserFormValues
} from "../components/UserFormDialog.js";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog.js";
import {
  useRolesOptions,
  useUserMutations,
  useUsersList
} from "../hooks/use-users.js";
import type { UserWithRole } from "../services/users.service.js";

const PAGE_SIZE = 10;

type EditState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; user: UserWithRole };

export function UsersListPage() {
  const navigate = useNavigate();
  const onOpenUser = (userId: string): void => {
    void navigate(`/administracion/usuarios/${userId}`);
  };
  const { t } = useTranslation("users");
  const { t: tCommon } = useTranslation("common");
  const [page, setPage] = useState(1);
  const { state, reload } = useUsersList(page, PAGE_SIZE);
  const rolesState = useRolesOptions();
  const mutations = useUserMutations();

  const [dialog, setDialog] = useState<EditState>({ mode: "closed" });
  const [toast, setToast] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const list = state.kind === "ready" ? state.data : null;
  const items = useMemo(() => list?.items ?? [], [list]);
  const total = list?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = list?.page ?? page;
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const roleOptions: RoleOption[] =
    rolesState.kind === "ready"
      ? rolesState.data.map((r) => ({ id: r.id, nombre: r.nombre }))
      : [];

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  };

  const openCreate = () => {
    mutations.clearError();
    setDialog({ mode: "create" });
  };

  const openEdit = (user: UserWithRole) => {
    mutations.clearError();
    setDialog({ mode: "edit", user });
  };

  const closeDialog = () => {
    mutations.clearError();
    setDialog({ mode: "closed" });
  };

  const handleSubmit = async (values: UserFormValues) => {
    const input = {
      nombre: values.nombre.trim(),
      email: values.email.trim(),
      rolId: values.rolId,
      activo: values.activo
    };
    if (dialog.mode === "create") {
      const created = await mutations.create(input);
      if (created) {
        showToast(t("toast.created", { nombre: created.nombre }));
        setDialog({ mode: "closed" });
        reload();
      }
    } else if (dialog.mode === "edit") {
      const updated = await mutations.update(dialog.user.id, input);
      if (updated) {
        showToast(t("toast.updated", { nombre: updated.nombre }));
        setDialog({ mode: "closed" });
        reload();
      }
    }
  };

  const requestDelete = (user: UserWithRole) => {
    setDeleteError(null);
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const ok = await mutations.remove(userToDelete.id);
    if (ok !== null) {
      showToast(t("toast.deleted", { nombre: userToDelete.nombre }));
      setUserToDelete(null);
      reload();
    } else {
      setDeleteError(mutations.error ?? t("delete.error"));
    }
  };

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h2>{t("list.title")}</h2>
          <p className="page__subtitle">{t("list.subtitle")}</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={openCreate}
          disabled={rolesState.kind !== "ready" || rolesState.data.length === 0}
        >
          {t("list.createButton")}
        </button>
      </header>

      {toast && (
        <div className="toast toast--success" role="status">
          {toast}
        </div>
      )}

      {state.kind === "error" && (
        <div className="toast" role="alert">
          {state.message}{" "}
          <button type="button" className="link-button" onClick={reload}>
            {tCommon("actions.retry")}
          </button>
        </div>
      )}

      {rolesState.kind === "error" && (
        <div className="toast" role="alert">
          {t("list.rolesLoadError")}
        </div>
      )}

      {rolesState.kind === "ready" && rolesState.data.length === 0 && (
        <div className="toast" role="alert">
          {t("list.noRolesYet")}
        </div>
      )}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("list.columns.nombre")}</th>
              <th scope="col">{t("list.columns.email")}</th>
              <th scope="col">{t("list.columns.rol")}</th>
              <th scope="col">{t("list.columns.estado")}</th>
              <th scope="col" className="table__col--actions">{t("list.columns.acciones")}</th>
            </tr>
          </thead>
          <tbody>
            {state.kind === "loading" && (
              <tr>
                <td colSpan={5} className="empty-state">{t("list.loading")}</td>
              </tr>
            )}
            {state.kind === "ready" && items.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  {t("list.emptyFirst")}
                </td>
              </tr>
            )}
            {state.kind === "ready" &&
              items.map((u) => (
                <tr key={u.id}>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onOpenUser(u.id)}
                    >
                      {u.nombre}
                    </button>
                  </td>
                  <td className="table__col--muted">{u.email}</td>
                  <td>{u.rolNombre}</td>
                  <td>
                    <span
                      className={
                        u.activo ? "pill pill--success" : "pill pill--muted"
                      }
                    >
                      {u.activo ? tCommon("state.active") : tCommon("state.inactive")}
                    </span>
                  </td>
                  <td className="table__col--actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => onOpenUser(u.id)}
                    >
                      {tCommon("actions.view")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => openEdit(u)}
                    >
                      {tCommon("actions.edit")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--danger-ghost"
                      onClick={() => requestDelete(u)}
                    >
                      {tCommon("actions.delete")}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <footer className="pagination" aria-label={t("list.paginationAria")}>
        <span className="pagination__info">
          {tCommon("pagination.showing", {
            from: items.length === 0 ? 0 : startIndex + 1,
            to: startIndex + items.length,
            total
          })}
        </span>
        <div className="pagination__controls">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || state.kind === "loading"}
          >
            {tCommon("pagination.previous")}
          </button>
          <span className="pagination__page">
            {tCommon("pagination.page", { current: currentPage, total: totalPages })}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || state.kind === "loading"}
          >
            {tCommon("pagination.next")}
          </button>
        </div>
      </footer>

      <UserFormDialog
        open={dialog.mode !== "closed"}
        mode={dialog.mode === "edit" ? "edit" : "create"}
        roles={roleOptions}
        initialValues={
          dialog.mode === "edit"
            ? {
                nombre: dialog.user.nombre,
                email: dialog.user.email,
                rolId: dialog.user.rolId,
                activo: dialog.user.activo
              }
            : undefined
        }
        submitting={mutations.pending}
        serverError={mutations.error}
        onClose={closeDialog}
        onSubmit={(v) => {
          void handleSubmit(v);
        }}
      />

      <ConfirmDialog
        open={userToDelete !== null}
        title={t("delete.title")}
        description={
          userToDelete
            ? deleteError ??
              t("delete.confirm", { nombre: userToDelete.nombre })
            : ""
        }
        confirmLabel={
          mutations.pending ? tCommon("actions.deleting") : tCommon("actions.delete")
        }
        cancelLabel={tCommon("actions.cancel")}
        tone="danger"
        disabled={mutations.pending}
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => {
          setUserToDelete(null);
          setDeleteError(null);
        }}
      />
    </section>
  );
}
