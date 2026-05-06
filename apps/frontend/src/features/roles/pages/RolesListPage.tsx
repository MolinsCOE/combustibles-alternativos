import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { RoleFormDialog, type RoleFormValues } from "../components/RoleFormDialog.js";
import { ConfirmDialog } from "../../../shared/components/ConfirmDialog.js";
import { useRolesList, useRoleMutations } from "../hooks/use-roles.js";
import type { RoleWithCount } from "../services/roles.service.js";

const PAGE_SIZE = 10;

type EditState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; role: RoleWithCount };

export function RolesListPage() {
  const navigate = useNavigate();
  const onOpenRole = (roleId: string): void => {
    void navigate(`/administracion/roles/${roleId}`);
  };
  const { t } = useTranslation("roles");
  const { t: tCommon } = useTranslation("common");
  const [page, setPage] = useState(1);
  const { state, reload } = useRolesList(page, PAGE_SIZE);
  const mutations = useRoleMutations();

  const [dialog, setDialog] = useState<EditState>({ mode: "closed" });
  const [toast, setToast] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleWithCount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const list = state.kind === "ready" ? state.data : null;
  const items = useMemo(() => list?.items ?? [], [list]);
  const total = list?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = list?.page ?? page;
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  };

  const openCreate = () => {
    mutations.clearError();
    setDialog({ mode: "create" });
  };

  const openEdit = (role: RoleWithCount) => {
    mutations.clearError();
    setDialog({ mode: "edit", role });
  };

  const closeDialog = () => {
    mutations.clearError();
    setDialog({ mode: "closed" });
  };

  const handleSubmit = async (values: RoleFormValues) => {
    const input = {
      nombre: values.nombre.trim(),
      descripcion: values.descripcion?.trim() ? values.descripcion.trim() : null
    };
    if (dialog.mode === "create") {
      const created = await mutations.create(input);
      if (created) {
        showToast(t("toast.created", { nombre: created.nombre }));
        setDialog({ mode: "closed" });
        reload();
      }
    } else if (dialog.mode === "edit") {
      const updated = await mutations.update(dialog.role.id, input);
      if (updated) {
        showToast(t("toast.updated", { nombre: updated.nombre }));
        setDialog({ mode: "closed" });
        reload();
      }
    }
  };

  const requestDelete = (role: RoleWithCount) => {
    setDeleteError(null);
    setRoleToDelete(role);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    if (roleToDelete.numeroUsuarios > 0) return;
    const ok = await mutations.remove(roleToDelete.id);
    if (ok !== null) {
      showToast(t("toast.deleted", { nombre: roleToDelete.nombre }));
      setRoleToDelete(null);
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
        <button type="button" className="btn btn--primary" onClick={openCreate}>
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

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t("list.columns.nombre")}</th>
              <th scope="col">{t("list.columns.descripcion")}</th>
              <th scope="col" className="table__col--numeric">{t("list.columns.usuarios")}</th>
              <th scope="col" className="table__col--actions">{t("list.columns.acciones")}</th>
            </tr>
          </thead>
          <tbody>
            {state.kind === "loading" && (
              <tr>
                <td colSpan={4} className="empty-state">{t("list.loading")}</td>
              </tr>
            )}
            {state.kind === "ready" && items.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-state">
                  {t("list.emptyFirst")}
                </td>
              </tr>
            )}
            {state.kind === "ready" &&
              items.map((rol) => (
                <tr key={rol.id}>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onOpenRole(rol.id)}
                    >
                      {rol.nombre}
                    </button>
                  </td>
                  <td className="table__col--muted">
                    {rol.descripcion || t("list.emptyDescription")}
                  </td>
                  <td className="table__col--numeric">{rol.numeroUsuarios}</td>
                  <td className="table__col--actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => onOpenRole(rol.id)}
                    >
                      {tCommon("actions.view")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => openEdit(rol)}
                    >
                      {tCommon("actions.edit")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--danger-ghost"
                      onClick={() => requestDelete(rol)}
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

      <RoleFormDialog
        open={dialog.mode !== "closed"}
        mode={dialog.mode === "edit" ? "edit" : "create"}
        initialValues={
          dialog.mode === "edit"
            ? {
                nombre: dialog.role.nombre,
                descripcion: dialog.role.descripcion ?? ""
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
        open={roleToDelete !== null}
        title={t("delete.title")}
        description={
          roleToDelete
            ? roleToDelete.numeroUsuarios > 0
              ? t(
                  roleToDelete.numeroUsuarios === 1
                    ? "delete.blockedOne"
                    : "delete.blockedOther",
                  { nombre: roleToDelete.nombre, count: roleToDelete.numeroUsuarios }
                )
              : deleteError ??
                t("delete.confirm", { nombre: roleToDelete.nombre })
            : ""
        }
        confirmLabel={
          mutations.pending ? tCommon("actions.deleting") : tCommon("actions.delete")
        }
        cancelLabel={tCommon("actions.cancel")}
        tone="danger"
        disabled={
          (roleToDelete?.numeroUsuarios ?? 0) > 0 || mutations.pending
        }
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => {
          setRoleToDelete(null);
          setDeleteError(null);
        }}
      />
    </section>
  );
}
