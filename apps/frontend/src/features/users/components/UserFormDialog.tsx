import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export type RoleOption = { id: string; nombre: string };

export type UserFormValues = {
  nombre: string;
  email: string;
  rolId: string;
  activo: boolean;
};

type Mode = "create" | "edit";

type UserFormDialogProps = {
  open: boolean;
  mode: Mode;
  roles: RoleOption[];
  initialValues?: UserFormValues;
  submitting?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
};

type FieldErrors = Partial<Record<keyof UserFormValues, string>>;

const DEFAULT_VALUES: UserFormValues = {
  nombre: "",
  email: "",
  rolId: "",
  activo: true
};

export function UserFormDialog({
  open,
  mode,
  roles,
  initialValues,
  submitting = false,
  serverError,
  onClose,
  onSubmit
}: UserFormDialogProps) {
  const { t } = useTranslation("users");
  const { t: tCommon } = useTranslation("common");
  const [values, setValues] = useState<UserFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const userFormSchema = useMemo(
    () =>
      z.object({
        nombre: z
          .string()
          .trim()
          .min(2, t("form.errors.nombreMin"))
          .max(80, t("form.errors.nombreMax")),
        email: z
          .string()
          .trim()
          .min(1, t("form.errors.emailRequired"))
          .email(t("form.errors.emailInvalid")),
        rolId: z.string().min(1, t("form.errors.rolRequired")),
        activo: z.boolean()
      }),
    [t]
  );

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? { ...DEFAULT_VALUES, rolId: roles[0]?.id ?? "" });
      setErrors({});
      firstFieldRef.current?.focus();
    }
  }, [open, initialValues, roles]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const title = mode === "create" ? t("form.createTitle") : t("form.editTitle");
  const submitLabel = submitting
    ? tCommon("actions.saving")
    : mode === "create"
      ? t("form.submit.create")
      : t("form.submit.edit");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = userFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof UserFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onSubmit(result.data);
  };

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-title"
      onClick={onClose}
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <header className="dialog__header">
          <h2 id="user-form-title">{title}</h2>
          <button
            type="button"
            className="btn-icon"
            aria-label={tCommon("actions.close")}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form className="form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="form__server-error" role="alert">
              {serverError}
            </div>
          )}

          <div className="form__field">
            <label htmlFor="user-nombre">{t("form.fields.nombre.label")}</label>
            <input
              ref={firstFieldRef}
              id="user-nombre"
              type="text"
              value={values.nombre}
              onChange={(e) => setValues((v) => ({ ...v, nombre: e.target.value }))}
              aria-invalid={Boolean(errors.nombre)}
              aria-describedby={errors.nombre ? "user-nombre-error" : undefined}
              autoComplete="off"
              disabled={submitting}
            />
            {errors.nombre && (
              <p id="user-nombre-error" className="form__error" role="alert">
                {errors.nombre}
              </p>
            )}
          </div>

          <div className="form__field">
            <label htmlFor="user-email">{t("form.fields.email.label")}</label>
            <input
              id="user-email"
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "user-email-error" : undefined}
              autoComplete="off"
              disabled={submitting}
            />
            {errors.email && (
              <p id="user-email-error" className="form__error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="form__field">
            <label htmlFor="user-rol">{t("form.fields.rol.label")}</label>
            <select
              id="user-rol"
              value={values.rolId}
              onChange={(e) => setValues((v) => ({ ...v, rolId: e.target.value }))}
              aria-invalid={Boolean(errors.rolId)}
              aria-describedby={errors.rolId ? "user-rol-error" : undefined}
              disabled={submitting}
            >
              <option value="" disabled>
                {t("form.fields.rol.placeholder")}
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
            {errors.rolId && (
              <p id="user-rol-error" className="form__error" role="alert">
                {errors.rolId}
              </p>
            )}
          </div>

          <div className="form__field form__field--inline">
            <label htmlFor="user-activo" className="form__checkbox">
              <input
                id="user-activo"
                type="checkbox"
                checked={values.activo}
                onChange={(e) =>
                  setValues((v) => ({ ...v, activo: e.target.checked }))
                }
                disabled={submitting}
              />
              <span>{t("form.fields.activo.label")}</span>
            </label>
          </div>

          <footer className="dialog__footer">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              {tCommon("actions.cancel")}
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitLabel}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
