import { useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Paperclip, FileText, Image, Table2, Mail, File, Trash2, Eye, Download } from "lucide-react";
import type { ChangeEvent } from "react";
import type { Attachment, FileType } from "../data/types.js";
import type { CreateAttachmentWithFileInput } from "../hooks/useGestionJornada.js";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFileType(fileName: string): FileType {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  if (["eml", "msg"].includes(ext)) return "email";
  return "other";
}

function FileTypeIcon({ type }: { type: FileType }) {
  const icons: Record<FileType, ReactNode> = {
    pdf: <FileText size={15} aria-hidden="true" />,
    image: <Image size={15} aria-hidden="true" />,
    excel: <Table2 size={15} aria-hidden="true" />,
    email: <Mail size={15} aria-hidden="true" />,
    other: <File size={15} aria-hidden="true" />
  };
  return <>{icons[type]}</>;
}

const canPreviewInApp = (type: FileType) => type === "pdf" || type === "image";

interface AttachmentListProps {
  attachments: Attachment[];
  taskId: string;
  onAdd: (taskId: string, input: CreateAttachmentWithFileInput) => void;
  onDelete: (taskId: string, attachmentId: string) => void;
  onConfirmDelete?: (attachmentId: string, fileName: string) => void;
}

export function AttachmentList({
  attachments,
  taskId,
  onAdd,
  onDelete,
  onConfirmDelete
}: AttachmentListProps) {
  const { t } = useTranslation("gestion-jornada");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visible = attachments.filter((a) => !a.isDeleted);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      onAdd(taskId, {
        fileName: file.name,
        fileType: detectFileType(file.name),
        fileSizeBytes: file.size,
        file
      });
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDelete(att: Attachment) {
    if (onConfirmDelete) {
      onConfirmDelete(att.id, att.fileName);
    } else {
      onDelete(taskId, att.id);
    }
  }

  function handleOpen(att: Attachment) {
    if (att.file) {
      // File uploaded in this session — create blob URL
      const url = URL.createObjectURL(att.file);
      const a = document.createElement("a");
      if (canPreviewInApp(att.fileType)) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        a.href = url;
        a.download = att.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      // Revoke after a short delay so the browser can open it
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    // For mock attachments without a real File object, nothing opens (demo)
  }

  return (
    <section className="jornada-attachment-list">
      <header className="jornada-attachment-list__header">
        <h4 className="jornada-attachment-list__title">
          {t("attachments.title")}
          {visible.length > 0 && (
            <span style={{ marginLeft: "0.4rem", fontWeight: 400, color: "#616666", textTransform: "none", letterSpacing: 0 }}>
              ({visible.length})
            </span>
          )}
        </h4>
        <button
          type="button"
          className="jornada-btn jornada-btn--ghost jornada-btn--sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={13} aria-hidden="true" />
          {t("attachments.add")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="jornada-visually-hidden"
          onChange={handleFileChange}
          aria-label={t("attachments.add")}
        />
      </header>

      {visible.length === 0 && (
        <p className="jornada-empty-hint">{t("attachments.empty")}</p>
      )}

      <ul className="jornada-attachment-list__items">
        {visible.map((att) => (
          <li key={att.id} className="jornada-attachment-item">
            <span className="jornada-attachment-item__icon" style={{ color: att.fileType === "pdf" ? "#d3322f" : att.fileType === "excel" ? "#00b847" : att.fileType === "image" ? "#1c7ed6" : "#616666" }}>
              <FileTypeIcon type={att.fileType} />
            </span>
            <div className="jornada-attachment-item__info">
              <span className="jornada-attachment-item__name">{att.fileName}</span>
              <span className="jornada-attachment-item__meta">
                {t(`attachments.fileType.${att.fileType}`)}
                {att.fileSizeBytes != null && ` · ${formatBytes(att.fileSizeBytes)}`}
                {" · "}{new Date(att.attachedAt).toLocaleDateString("es-ES")}
              </span>
            </div>
            <div className="jornada-attachment-item__actions">
              {att.file ? (
                canPreviewInApp(att.fileType) ? (
                  <button
                    type="button"
                    className="jornada-btn jornada-btn--ghost jornada-btn--sm"
                    aria-label={`${t("attachments.actions.view")}: ${att.fileName}`}
                    onClick={() => handleOpen(att)}
                    title={t("attachments.actions.view")}
                  >
                    <Eye size={13} aria-hidden="true" />
                    {t("attachments.actions.view")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="jornada-btn jornada-btn--ghost jornada-btn--sm"
                    aria-label={`${t("attachments.actions.download")}: ${att.fileName}`}
                    onClick={() => handleOpen(att)}
                    title={t("attachments.actions.download")}
                  >
                    <Download size={13} aria-hidden="true" />
                    {t("attachments.actions.download")}
                  </button>
                )
              ) : (
                <span
                  style={{ fontSize: "0.7rem", color: "#adb5bd", fontStyle: "italic", padding: "0.2rem 0.4rem" }}
                  title="Fichero de demostración, no disponible para apertura"
                >
                  Demo
                </span>
              )}
              <button
                type="button"
                className="jornada-btn jornada-btn--danger-ghost jornada-btn--sm"
                aria-label={`${t("attachments.actions.delete")}: ${att.fileName}`}
                onClick={() => handleDelete(att)}
                title={t("attachments.actions.delete")}
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
