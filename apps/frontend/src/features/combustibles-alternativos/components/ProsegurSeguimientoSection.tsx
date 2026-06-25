import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle, FileText, ChevronDown, ChevronUp, Play } from "lucide-react";
import { useProsegurImports, useProsegurUnmapped } from "../hooks/use-prosegur.js";
import { prosegurService } from "../services/prosegur.service.js";
import type { Material, Proveedor } from "../store/caStore.js";

type Props = {
  materiales: Material[];
  proveedores: Proveedor[];
  onToast?: (msg: string, tipo?: "success" | "warning") => void;
};

// ---------------------------------------------------------------------------
// Inline form to identify an unrecognized entry
// ---------------------------------------------------------------------------

type InlineMapFormProps = {
  entryId: number;
  materialRaw: string;
  materiales: Material[];
  proveedores: Proveedor[];
  onSave: (materialId: number, proveedorId: number) => Promise<void>;
  onCancel: () => void;
};

function InlineMapForm({ materialRaw, materiales, proveedores, onSave, onCancel }: InlineMapFormProps) {
  const [materialId, setMaterialId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [saving, setSaving] = useState(false);

  const proveedoresFiltrados = proveedores.filter(
    (p) => p.activo && (p.tipus === "proveedor" || p.tipus === "ambos")
  );

  const handleSave = async () => {
    if (!materialId || !proveedorId) return;
    setSaving(true);
    try {
      await onSave(Number(materialId), Number(proveedorId));
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td colSpan={4} style={{ padding: "0.75rem 1rem", background: "var(--c-neutral-50)" }}>
        <div style={{ marginBottom: "0.4rem", fontSize: "0.82rem", color: "var(--c-neutral-500)" }}>
          Prosegur registró esta entrada como:{" "}
          <strong style={{ fontFamily: "monospace", color: "var(--c-neutral-700)" }}>{materialRaw}</strong>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form__field" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label style={{ fontSize: "0.8rem" }}>Material</label>
            <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} style={{ fontSize: "0.83rem" }}>
              <option value="">— Seleccionar —</option>
              {materiales.filter((m) => m.activo).map((m) => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>
          <div className="form__field" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label style={{ fontSize: "0.8rem" }}>Proveedor / Transportista</label>
            <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} style={{ fontSize: "0.83rem" }}>
              <option value="">— Seleccionar —</option>
              {proveedoresFiltrados.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", paddingBottom: "2px" }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={!materialId || !proveedorId || saving}
              onClick={() => { void handleSave(); }}
            >
              {saving ? "Guardando..." : "Confirmar"}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </div>
        <p style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--c-neutral-400)", marginBottom: 0 }}>
          El sistema recordará esta asociación para futuros ficheros de Prosegur.
        </p>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function ProsegurSeguimientoSection({ materiales, proveedores, onToast }: Props) {
  const { t } = useTranslation("combustibles");
  const { imports, loading: importsLoading, reload: reloadImports } = useProsegurImports();
  const { entries: unmapped, loading: unmappedLoading, mapEntry, reload: reloadUnmapped } = useProsegurUnmapped();

  const [mappingEntryId, setMappingEntryId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const lastImport = imports.length > 0 ? [...imports].sort((a, b) =>
    new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
  )[0] : null;

  const nUnmapped = unmapped.length;

  const handleProcesarAhora = async () => {
    setProcesando(true);
    try {
      const result = await prosegurService.runImport();
      const total = result.results.reduce((s, r) => s + r.total, 0);
      if (total === 0) {
        onToast?.("No se encontraron archivos nuevos en la carpeta de Prosegur.", "warning");
      } else {
        onToast?.(`Procesado: ${total} entradas importadas.`);
        await reloadImports();
        await reloadUnmapped();
      }
    } catch (err) {
      onToast?.(`Error al procesar: ${err instanceof Error ? err.message : "error desconocido"}`, "warning");
    } finally {
      setProcesando(false);
    }
  };

  const handleMap = async (entryId: number, materialId: number, proveedorId: number) => {
    const entry = unmapped.find((e) => e.id === entryId);
    await mapEntry(entryId, materialId, proveedorId, entry?.materialRaw ?? "");
    setMappingEntryId(null);
    onToast?.(t("prosegur.seguimiento.sinMapear.toast.mapeado"));
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return d;
    }
  };

  const formatDateTime = (d: string) => {
    try {
      return new Date(d).toLocaleString("es-ES", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  return (
    <div style={{ marginTop: "1.5rem" }}>

      {/* ── Estado del archivo de hoy ── */}
      <div style={{
        border: "1px solid var(--c-neutral-200)",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
        marginBottom: "1.25rem",
        background: "var(--c-neutral-0, #fff)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
          <FileText size={18} style={{ color: "var(--c-neutral-500)" }} aria-hidden="true" />
          <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--c-neutral-800)" }}>
            Archivo de Prosegur
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={procesando}
            onClick={() => { void handleProcesarAhora(); }}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem" }}
            title="Procesa ahora los archivos que haya en la carpeta configurada (para pruebas)"
          >
            <Play size={13} aria-hidden="true" />
            {procesando ? "Procesando..." : "Procesar ahora"}
          </button>
        </div>

        {importsLoading || unmappedLoading ? (
          <p style={{ color: "var(--c-neutral-400)", fontSize: "0.85rem", margin: 0 }}>Cargando...</p>
        ) : lastImport ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--c-neutral-500)" }}>Último archivo procesado</p>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 500, color: "var(--c-neutral-700)" }}>
                {formatDateTime(lastImport.processedAt)}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--c-neutral-500)" }}>Entradas registradas</p>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 500, color: "var(--c-neutral-700)" }}>
                {lastImport.rowsTotal ?? "—"} viajes
              </p>
            </div>
            <div>
              {nUnmapped > 0 ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.2rem 0.65rem", borderRadius: "999px",
                  background: "var(--c-warning-50, #fffbeb)",
                  border: "1px solid var(--c-warning-300, #fcd34d)",
                  fontSize: "0.82rem", color: "var(--c-warning-700, #b45309)", fontWeight: 600,
                }}>
                  <AlertTriangle size={13} aria-hidden="true" />
                  {nUnmapped} sin identificar
                </span>
              ) : (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.2rem 0.65rem", borderRadius: "999px",
                  background: "var(--c-success-50, #f0fdf4)",
                  border: "1px solid var(--c-success-300, #86efac)",
                  fontSize: "0.82rem", color: "var(--c-success-700, #15803d)", fontWeight: 600,
                }}>
                  <CheckCircle size={13} aria-hidden="true" />
                  Todo identificado
                </span>
              )}
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--c-neutral-400)", fontSize: "0.85rem", margin: 0 }}>
            Todavía no se ha procesado ningún archivo. El sistema lo hará automáticamente cada madrugada.
          </p>
        )}
      </div>

      {/* ── Entradas sin identificar ── */}
      {!unmappedLoading && nUnmapped > 0 && (
        <div style={{
          border: "1px solid var(--c-warning-300, #fcd34d)",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          background: "var(--c-warning-50, #fffbeb)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", marginBottom: "0.75rem" }}>
            <AlertTriangle size={18} style={{ color: "var(--c-warning-600, #d97706)", flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
            <div>
              <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.92rem", color: "var(--c-warning-800, #92400e)" }}>
                {nUnmapped} {nUnmapped === 1 ? "entrada no identificada" : "entradas no identificadas"}
              </p>
              <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--c-warning-700, #b45309)" }}>
                Prosegur registró {nUnmapped === 1 ? "un viaje" : "viajes"} con un nombre que el sistema no reconoce.
                Indica a qué material y proveedor corresponde cada uno para que quede contabilizado correctamente.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table" style={{ fontSize: "0.83rem" }}>
              <thead>
                <tr>
                  <th scope="col">Lo que registró Prosegur</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Destino</th>
                  <th scope="col" className="table__col--actions">Acción</th>
                </tr>
              </thead>
              <tbody>
                {unmapped.map((entry) => (
                  <>
                    <tr key={entry.id}>
                      <td>
                        <span style={{
                          fontFamily: "monospace", fontSize: "0.8rem",
                          background: "var(--c-warning-100, #fef3c7)",
                          padding: "0.1rem 0.4rem", borderRadius: "4px",
                        }}>
                          {entry.materialRaw}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDate(entry.fecha)}</td>
                      <td style={{ color: "var(--c-neutral-500)" }}>{entry.destinoRaw ?? "—"}</td>
                      <td className="table__col--actions">
                        {mappingEntryId !== entry.id && (
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => setMappingEntryId(entry.id)}
                          >
                            Identificar
                          </button>
                        )}
                      </td>
                    </tr>
                    {mappingEntryId === entry.id && (
                      <InlineMapForm
                        key={`map-${entry.id}`}
                        entryId={entry.id}
                        materialRaw={entry.materialRaw}
                        materiales={materiales}
                        proveedores={proveedores}
                        onSave={(matId, provId) => handleMap(entry.id, matId, provId)}
                        onCancel={() => setMappingEntryId(null)}
                      />
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Historial de archivos procesados ── */}
      <div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setShowHistory((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
        >
          {showHistory ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          Ver historial de archivos procesados
        </button>

        {showHistory && (
          <div style={{ marginTop: "0.75rem" }}>
            {importsLoading ? (
              <p style={{ color: "var(--c-neutral-400)", fontSize: "0.85rem" }}>Cargando...</p>
            ) : imports.length === 0 ? (
              <p style={{ color: "var(--c-neutral-400)", fontSize: "0.85rem" }}>No hay archivos procesados todavía.</p>
            ) : (
              <div className="table-wrapper">
                <table className="table" style={{ fontSize: "0.83rem" }}>
                  <thead>
                    <tr>
                      <th scope="col">Archivo</th>
                      <th scope="col">Procesado el</th>
                      <th scope="col" className="table__col--numeric">Viajes</th>
                      <th scope="col" className="table__col--numeric">Sin identificar</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...imports].sort((a, b) =>
                      new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
                    ).map((imp) => (
                      <tr key={imp.id}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--c-neutral-600)" }}>
                          {imp.filename}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(imp.processedAt)}</td>
                        <td className="table__col--numeric">{imp.rowsTotal ?? "—"}</td>
                        <td className="table__col--numeric">
                          {imp.rowsUnmapped != null && imp.rowsUnmapped > 0 ? (
                            <span style={{ color: "var(--c-warning-600, #d97706)", fontWeight: 600 }}>
                              {imp.rowsUnmapped}
                            </span>
                          ) : (
                            <span style={{ color: "var(--c-success-600, #16a34a)" }}>0</span>
                          )}
                        </td>
                        <td>
                          <span className={
                            imp.status === "ok" ? "pill pill--success"
                            : imp.status === "error" ? "pill pill--danger"
                            : "pill pill--warning"
                          }>
                            {imp.status === "ok" ? "Correcto" : imp.status === "error" ? "Error" : "Parcial"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
