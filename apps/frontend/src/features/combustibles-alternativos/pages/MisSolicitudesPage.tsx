import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, sumaViajes, type Solicitud } from "../store/caStore.js";

const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;
const DIAS_KEYS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"] as const;

function totalViajes(s: Solicitud): number {
  return s.lineas.reduce((sum, l) => sum + sumaViajes(l), 0);
}

function estadoPillClass(estado: string): string {
  switch (estado) {
    case "borrador":        return "pill pill--muted";
    case "enviada":         return "pill pill--primary";
    case "en_distribucion": return "pill pill--warning";
    case "confirmada":      return "pill pill--success";
    case "cerrada":         return "pill pill--success";
    default:                return "pill pill--muted";
  }
}

function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    borrador:        "Borrador",
    enviada:         "Enviada",
    en_distribucion: "En distribución",
    confirmada:      "Confirmada",
    cerrada:         "Cerrada",
  };
  return map[estado] ?? estado;
}

export function MisSolicitudesPage() {
  const { state } = useCaStore();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const solicitudes = [...state.solicitudes].sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
  );

  return (
    <div className="combustibles-page">
      <DemoBanner />
      <section className="page">
        <header className="page__header">
          <div>
            <h2>Mis solicitudes</h2>
            <p className="page__subtitle">
              Listado de todas las solicitudes que has enviado y su estado actual.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => { void navigate("/combustibles/solicitud/nueva"); }}
          >
            Nueva solicitud
          </button>
        </header>

        {solicitudes.length === 0 && (
          <p className="empty-state">Todavía no has creado ninguna solicitud.</p>
        )}

        {solicitudes.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Semana</th>
                  <th scope="col">Fechas</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="table__col--numeric">Total viajes</th>
                  <th scope="col">Creada</th>
                  <th scope="col" className="table__col--actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setExpandedId(expandedId === s.id ? null : s.id)
                      }
                    >
                      <td style={{ fontWeight: 600 }}>{s.semana}</td>
                      <td className="table__col--muted" style={{ whiteSpace: "nowrap" }}>
                        {s.ini} — {s.fi}
                      </td>
                      <td>
                        <span className={estadoPillClass(s.estado)}>
                          {estadoLabel(s.estado)}
                        </span>
                      </td>
                      <td className="table__col--numeric">{totalViajes(s)}</td>
                      <td className="table__col--muted">
                        {new Date(s.ts).toLocaleDateString("es-ES")}
                      </td>
                      <td className="table__col--actions">
                        {s.estado === "borrador" && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void navigate("/combustibles/solicitud/nueva");
                            }}
                          >
                            Continuar editando
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(expandedId === s.id ? null : s.id);
                          }}
                        >
                          {expandedId === s.id ? "Cerrar" : "Ver detalle"}
                        </button>
                      </td>
                    </tr>

                    {/* Detalle expandido */}
                    {expandedId === s.id && (
                      <tr key={`${s.id}-detail`}>
                        <td colSpan={6} style={{ background: "var(--c-neutral-50)", padding: "1rem" }}>
                          {s.comentarioGeneral && (
                            <p
                              style={{
                                marginBottom: "0.75rem",
                                color: "var(--c-neutral-700)",
                                fontStyle: "italic",
                              }}
                            >
                              {s.comentarioGeneral}
                            </p>
                          )}
                          <div className="table-wrapper">
                            <table className="table" style={{ fontSize: "0.85rem" }}>
                              <thead>
                                <tr>
                                  <th scope="col">Material</th>
                                  {DIAS_ABR.map((d) => (
                                    <th
                                      key={d}
                                      scope="col"
                                      className="table__col--numeric combustibles-dia-col"
                                    >
                                      {d}
                                    </th>
                                  ))}
                                  <th scope="col" className="table__col--numeric">Total</th>
                                  <th scope="col">Obs.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.lineas.map((l) => (
                                  <tr key={l.id}>
                                    <td>{l.materialNom}</td>
                                    {DIAS_KEYS.map((k) => (
                                      <td
                                        key={k}
                                        className="table__col--numeric combustibles-dia-col"
                                      >
                                        {l[k]}
                                      </td>
                                    ))}
                                    <td
                                      className="table__col--numeric"
                                      style={{ fontWeight: 700 }}
                                    >
                                      {sumaViajes(l)}
                                    </td>
                                    <td className="table__col--muted">{l.obs || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
