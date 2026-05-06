import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Upload, AlertTriangle, CheckCircle } from "lucide-react";
import {
  parsearCSVProsegur,
  type FilaProsegurParseada,
  type ResultadoParseo
} from "../utils/parseProsegur.js";
import type {
  Material,
  Proveedor,
  Transportista,
  Asignacion
} from "../data/mock.js";

type Props = {
  onClose: () => void;
  onConfirmar: (filas: FilaProsegurParseada[]) => void;
  materiales: Material[];
  proveedores: Proveedor[];
  transportistas: Transportista[];
  asignaciones: Asignacion[];
};

export function ImportarProsegurModal({
  onClose,
  onConfirmar,
  materiales,
  proveedores,
  transportistas,
  asignaciones
}: Props) {
  const { t } = useTranslation("combustibles");
  const inputRef = useRef<HTMLInputElement>(null);

  const [resultado, setResultado] = useState<ResultadoParseo | null>(null);
  const [nombreFichero, setNombreFichero] = useState<string>("");
  const [cargando, setCargando] = useState(false);

  const maestros = { materiales, proveedores, transportistas, asignaciones };

  const handleFicheroSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichero = e.target.files?.[0];
    if (!fichero) return;

    setNombreFichero(fichero.name);
    setCargando(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const contenido = ev.target?.result;
      if (typeof contenido !== "string") {
        setResultado({
          filas: [],
          noMapeadas: 0,
          omitidas: 0,
          error: t("seguimiento.importar.errorLectura")
        });
        setCargando(false);
        return;
      }
      const res = parsearCSVProsegur(contenido, maestros);
      setResultado(res);
      setCargando(false);
    };
    reader.onerror = () => {
      setResultado({
        filas: [],
        noMapeadas: 0,
        omitidas: 0,
        error: t("seguimiento.importar.errorLectura")
      });
      setCargando(false);
    };
    reader.readAsText(fichero, "UTF-8");
  };

  const handleConfirmar = () => {
    if (!resultado || resultado.filas.length === 0) return;
    onConfirmar(resultado.filas);
  };

  const hayFilas = resultado !== null && resultado.filas.length > 0;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-importar-title">
      <div className="modal modal--wide">
        {/* Cabecera */}
        <div className="modal__header">
          <h2 id="modal-importar-title" className="modal__title">
            {t("seguimiento.importar.title")}
          </h2>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label={t("seguimiento.importar.cerrar")}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="modal__body">
          {/* Aviso formato */}
          <div className="alert alert--info" style={{ marginBottom: "1.25rem" }}>
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{t("seguimiento.importar.avisoFormato")}</span>
          </div>

          {/* Selector de fichero */}
          <div className="form__field">
            <label htmlFor="prosegur-file-input">
              {t("seguimiento.importar.ficheroLabel")}
            </label>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => inputRef.current?.click()}
                disabled={cargando}
              >
                <Upload size={16} aria-hidden="true" style={{ marginRight: "0.4rem" }} />
                {t("seguimiento.importar.seleccionarFichero")}
              </button>
              {nombreFichero && (
                <span style={{ fontSize: "0.875rem", color: "var(--c-neutral-600)" }}>
                  {nombreFichero}
                </span>
              )}
            </div>
            <input
              ref={inputRef}
              id="prosegur-file-input"
              type="file"
              accept=".csv,.txt,.xls,.xlsx"
              style={{ display: "none" }}
              onChange={handleFicheroSeleccionado}
            />
          </div>

          {/* Estado de carga */}
          {cargando && (
            <p style={{ color: "var(--c-neutral-500)", fontSize: "0.9rem" }}>
              {t("seguimiento.importar.cargando")}
            </p>
          )}

          {/* Error de parseo */}
          {resultado?.error && (
            <div className="alert alert--danger">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{resultado.error}</span>
            </div>
          )}

          {/* Resumen del parseo */}
          {hayFilas && !resultado?.error && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap"
                }}
              >
                <span className="pill pill--success">
                  <CheckCircle size={13} aria-hidden="true" style={{ marginRight: "0.3rem" }} />
                  {t("seguimiento.importar.filasMapeadas", {
                    n: resultado.filas.length - resultado.noMapeadas
                  })}
                </span>
                {resultado.noMapeadas > 0 && (
                  <span className="pill pill--warning">
                    <AlertTriangle size={13} aria-hidden="true" style={{ marginRight: "0.3rem" }} />
                    {t("seguimiento.importar.filasNoMapeadas", { n: resultado.noMapeadas })}
                  </span>
                )}
                {resultado.omitidas > 0 && (
                  <span className="pill pill--neutral">
                    {t("seguimiento.importar.filasOmitidas", { n: resultado.omitidas })}
                  </span>
                )}
              </div>

              {/* Tabla de preview */}
              <div className="table-wrapper" style={{ maxHeight: "340px", overflowY: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">{t("seguimiento.importar.col.fecha")}</th>
                      <th scope="col">{t("seguimiento.importar.col.materialDetectado")}</th>
                      <th scope="col">{t("seguimiento.importar.col.proveedor")}</th>
                      <th scope="col">{t("seguimiento.importar.col.transportista")}</th>
                      <th scope="col">{t("seguimiento.importar.col.horaEntrada")}</th>
                      <th scope="col">{t("seguimiento.importar.col.horaSalida")}</th>
                      <th scope="col">{t("seguimiento.importar.col.destino")}</th>
                      <th scope="col">{t("seguimiento.importar.col.estado")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.filas.map((fila, i) => (
                      <tr
                        key={i}
                        className={fila.noMapeado ? "combustibles-row--aviso" : ""}
                      >
                        <td>{fila.fecha}</td>
                        <td>
                          {fila.noMapeado ? (
                            <span title={t("seguimiento.importar.textoOriginal")}>
                              <code style={{ fontSize: "0.8rem", background: "var(--c-warning-50, #fef9c3)", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>
                                {fila.materialTextoOriginal}
                              </code>
                            </span>
                          ) : (
                            fila.materialNombre
                          )}
                        </td>
                        <td>{fila.proveedorNombre ?? <em style={{ color: "var(--c-warning-600, #ca8a04)" }}>{t("seguimiento.importar.noReconocido")}</em>}</td>
                        <td>{fila.transportistaNombre ?? <em style={{ color: "var(--c-warning-600, #ca8a04)" }}>{t("seguimiento.importar.noReconocido")}</em>}</td>
                        <td>{fila.horaEntrada}</td>
                        <td>{fila.horaSalida}</td>
                        <td>{fila.destino}</td>
                        <td>
                          {fila.noMapeado ? (
                            <span className="pill pill--warning">{t("seguimiento.importar.revisar")}</span>
                          ) : (
                            <span className="pill pill--success">{t("seguimiento.importar.ok")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Sin resultados */}
          {resultado !== null && !resultado.error && resultado.filas.length === 0 && (
            <div className="alert alert--warning">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{t("seguimiento.importar.sinFilas")}</span>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t("seguimiento.importar.cancelar")}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!hayFilas || cargando}
            onClick={handleConfirmar}
          >
            {t("seguimiento.importar.confirmar")}
          </button>
        </div>
      </div>
    </div>
  );
}
