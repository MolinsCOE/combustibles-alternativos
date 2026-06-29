import { useRef, useState } from "react";
import { X, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { prosegurService } from "../services/prosegur.service.js";

type ImportResult = {
  filename: string;
  total: number;
  mapped: number;
  unmapped: number;
};

type Props = {
  onClose: () => void;
  onImportado?: () => void;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result = "data:application/...:base64,<datos>"
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImportarProsegurModal({ onClose, onImportado }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"idle" | "cargando" | "ok" | "error">("idle");
  const [resultado, setResultado] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombreFichero, setNombreFichero] = useState("");

  const handleFichero = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreFichero(file.name);
    setEstado("cargando");
    setResultado(null);
    setError(null);

    try {
      const base64 = await fileToBase64(file);
      const res = await prosegurService.uploadFile(file.name, base64);
      setResultado(res);
      setEstado("ok");
      onImportado?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
      setEstado("error");
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white", borderRadius: "12px",
          padding: "1.5rem", width: "440px", maxWidth: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Importar fichero Prosegur</h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Descripción */}
        <p style={{ fontSize: "0.85rem", color: "var(--c-neutral-500)", marginBottom: "1.25rem" }}>
          Selecciona el fichero <strong>.xls</strong> diario de Prosegur. El sistema lo importará y aplicará el mapeo de materiales automáticamente.
        </p>

        {/* Selector */}
        <div style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            disabled={estado === "cargando"}
            onClick={() => inputRef.current?.click()}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600,
              border: "1.5px dashed var(--c-neutral-300)", borderRadius: "8px",
              background: "var(--c-neutral-50)", cursor: estado === "cargando" ? "not-allowed" : "pointer",
              color: "var(--c-primary-600, #003e39)",
            }}
          >
            <Upload size={16} />
            {estado === "cargando" ? "Importando…" : "Seleccionar fichero .xls"}
          </button>
          {nombreFichero && (
            <span style={{ marginLeft: "0.75rem", fontSize: "0.82rem", color: "var(--c-neutral-500)" }}>
              {nombreFichero}
            </span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xls,.xlsx"
            style={{ display: "none" }}
            onChange={handleFichero}
          />
        </div>

        {/* Resultado OK */}
        {estado === "ok" && resultado && (
          <div style={{
            display: "flex", flexDirection: "column", gap: "0.5rem",
            padding: "1rem", borderRadius: "8px",
            background: "var(--c-success-50, #f0fdf4)",
            border: "1px solid var(--c-success-200, #bbf7d0)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--c-success-700, #15803d)", fontSize: "0.9rem" }}>
              <CheckCircle size={16} />
              Importación completada
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--c-neutral-600)", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <span><strong>{resultado.total}</strong> viajes</span>
              <span style={{ color: "var(--c-success-700, #15803d)" }}><strong>{resultado.mapped}</strong> mapeados</span>
              {resultado.unmapped > 0 && (
                <span style={{ color: "var(--c-warning-700, #b45309)" }}><strong>{resultado.unmapped}</strong> sin mapeo</span>
              )}
            </div>
            {resultado.unmapped > 0 && (
              <p style={{ fontSize: "0.78rem", color: "var(--c-neutral-500)", margin: 0 }}>
                Los viajes sin mapeo aparecen en la pestaña "No mapeados" para revisión manual.
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {estado === "error" && error && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "0.5rem",
            padding: "1rem", borderRadius: "8px",
            background: "var(--c-error-50, #fef2f2)",
            border: "1px solid var(--c-error-200, #fecaca)",
            color: "var(--c-error-700, #b91c1c)", fontSize: "0.85rem",
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>{error}</span>
          </div>
        )}

        {/* Pie */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 1rem", fontSize: "0.875rem", fontWeight: 600,
              border: "1px solid var(--c-neutral-300)", borderRadius: "6px",
              background: "white", cursor: "pointer",
            }}
          >
            {estado === "ok" ? "Cerrar" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}
