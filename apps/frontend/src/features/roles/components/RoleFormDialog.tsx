import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export type RoleFormValues = {
  nombre: string;
  descripcion?: string;
};

type Mode = "create" | "edit";

type RoleFormDialogProps = {
  open: boolean;
  mode: Mode;
  initialValues?: RoleFormValues;
  serverError?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => void;
};

type FieldErrors = Partial<Record<keyof RoleFormValues, string>>;

export function RoleFormDialog({
  open,
  mode,
  initialValues,
  serverError,
  submitting = false,
  onClose,
  onSubmit
}: RoleFormDialogProps) {
  const { t } = useTranslation("roles");
  const { t: tCommon } = useTranslation("common");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const roleFormSchema = useMemo(
    () =>
      z.object({
        nombre: z
          .string()
          .trim()
          .min(2, t("form.errors.nombreMin"))
          .max(60, t("form.errors.nombreMax")),
        descripcion: z
          .string()
          .trim()
          .max(240, t("form.errors.descripcionMax"))
          .optional()
          .or(z.literal(""))
      }),
    [t]
  );

  useEffect(() => {
    if (open) {
      setNombre(initialValues?.nombre ?? "");
      setDescripcion(initialValues?.descripcion ?? "");
      setErrors({});
      firstFieldRef.current?.focus();
    }
  }, [open, initialValues]);

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
    const result = roleFormSchema.safeParse({ nombre, descripcion });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof RoleFormValues;
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
      aria-labelledby="role-form-title"
      onClick={onClose}
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <header className="dialog__header">
          <h2 id="role-form-title">{title}</h2>
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
            <label htmlFor="role-nombre">{t("form.fields.nombre.label")}</label>
            <input
              ref={firstFieldRef}
              id="role-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={Boolean(errors.nombre)}
              aria-describedby={errors.nombre ? "role-nombre-error" : undefined}
              autoComplete="off"
            />
            {errors.nombre && (
              <p id="role-nombre-error" className="form__error" role="alert">
                {errors.nombre}
              </p>
            )}
          </div>

          <div className="form__field">
            <label htmlFor="role-descripcion">{t("form.fields.descripcion.label")}</label>
            <textarea
              id="role-descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              aria-invalid={Boolean(errors.descripcion)}
              aria-describedby={
                errors.descripcion ? "role-descripcion-error" : undefined
              }
            />
            {errors.descripcion && (
              <p id="role-descripcion-error" className="form__error" role="alert">
                {errors.descripcion}
              </p>
            )}
          </div>

          <footer className="dialog__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
              {tCommon("actions.cancel")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitLabel}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
