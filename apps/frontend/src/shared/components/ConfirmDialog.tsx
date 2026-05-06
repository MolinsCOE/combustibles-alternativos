import { useEffect } from "react";
import { useTranslation } from "react-i18next";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  disabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "default",
  disabled = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const { t } = useTranslation("common");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const resolvedConfirmLabel = confirmLabel ?? t("actions.confirm");
  const resolvedCancelLabel = cancelLabel ?? t("actions.cancel");

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <header className="dialog__header">
          <h2 id="confirm-dialog-title">{title}</h2>
          <button
            type="button"
            className="btn-icon"
            aria-label={t("actions.close")}
            onClick={onCancel}
          >
            ×
          </button>
        </header>
        <div className="dialog__body">
          <p>{description}</p>
        </div>
        <footer className="dialog__footer">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "btn btn--danger" : "btn btn--primary"}
            onClick={onConfirm}
            disabled={disabled}
          >
            {resolvedConfirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
