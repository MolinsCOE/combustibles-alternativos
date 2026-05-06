import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, sumaViajes } from "../store/caStore.js";

const DIAS_ABR = ["L", "M", "X", "J", "V", "S", "D"] as const;
const DIAS_KEYS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"] as const;

export function EstadoSuministroPage() {
  const { state } = useCaStore();

  // Solicitud más reciente en estado enviada o superior
  const solicitudActiva = state.solicitudes
    .filter((s) =>
      ["enviada", "en_distribucion", "confirmada"].includes(s.estado)
    )
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0];

  // Líneas de distribución para esa solicitud
  const lineasDist = solicitudActiva
    ? state.distribucion.filter((l) => l.solicitudId === solicitudActiva.id)
    : [];

  // Para cada línea de solicitud calcula los viajes confirmados sumando líneas de distribución
  function viajesConfirmados(materialId: number, dia: (typeof DIAS_KEYS)[number]): number {
    return lineasDist
      .filter((l) => l.materialId === materialId && l.confirmacionProveedor === "confirmada")
      .reduce((sum, l) => sum + l[dia], 0);
  }

  return (
    <div className="combustibles-page">
      <DemoBanner />
      <section className="page">
        <header className="page__header">
          <div>
            <h2>Estado del suministro</h2>
            <p className="page__subtitle">
              Vista de solo lectura del estado actual del suministro de combustibles alternativos.
            </p>
          </div>
          {solicitudActiva && (
            <span className="pill pill--primary">{solicitudActiva.semana}</span>
          )}
        </header>

        {!solicitudActiva && (
          <p className="empty-state">No hay solicitudes enviadas actualmente.</p>
        )}

        {solicitudActiva && (
          <>
            {solicitudActiva.comentarioGeneral && (
              <p
                style={{
                  marginBottom: "1rem",
                  color: "var(--c-neutral-700)",
                  fontStyle: "italic",
                }}
              >
                {solicitudActiva.comentarioGeneral}
              </p>
            )}
            <div className="table-wrapper">
              <table className="table combustibles-solicitud-table">
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
                    <th scope="col" className="table__col--numeric">Total pedido</th>
                    <th scope="col" className="table__col--numeric">Confirmado</th>
                    <th scope="col">Estado fila</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudActiva.lineas.map((linea) => {
                    const totalPedido = sumaViajes(linea);
                    const totalConfirmado = DIAS_KEYS.reduce(
                      (sum, k) => sum + viajesConfirmados(linea.materialId, k),
                      0
                    );
                    const pct =
                      totalPedido === 0
                        ? 100
                        : Math.round((totalConfirmado / totalPedido) * 100);
                    const estadoClass =
                      pct >= 100
                        ? "pill pill--success"
                        : pct > 0
                        ? "pill pill--warning"
                        : "pill pill--muted";
                    const estadoLabel =
                      pct >= 100
                        ? "Confirmado"
                        : pct > 0
                        ? "Parcial"
                        : "Pendiente";

                    return (
                      <tr key={linea.id}>
                        <td className="combustibles-material-cell">{linea.materialNom}</td>
                        {DIAS_KEYS.map((k) => (
                          <td
                            key={k}
                            className="table__col--numeric combustibles-dia-col"
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                              <span>{linea[k]}</span>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--c-success-600)",
                                }}
                              >
                                {viajesConfirmados(linea.materialId, k) > 0
                                  ? `✓${viajesConfirmados(linea.materialId, k)}`
                                  : ""}
                              </span>
                            </div>
                          </td>
                        ))}
                        <td className="table__col--numeric" style={{ fontWeight: 700 }}>
                          {totalPedido}
                        </td>
                        <td className="table__col--numeric" style={{ fontWeight: 700 }}>
                          {totalConfirmado}
                        </td>
                        <td>
                          <span className={estadoClass}>{estadoLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.8rem",
                color: "var(--c-neutral-500)",
              }}
            >
              Los números en verde bajo cada día indican viajes ya confirmados por el proveedor.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
