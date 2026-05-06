import { DemoBanner } from "../../../shared/components/DemoBanner.js";
import { useCaStore, type EstadoConfirmacion } from "../store/caStore.js";
import { useRole } from "../auth/useRole.js";

function estadoPillClass(estado: EstadoConfirmacion): string {
  switch (estado) {
    case "confirmada": return "pill pill--success";
    case "rechazada":  return "pill pill--danger";
    default:           return "pill pill--warning";
  }
}

function estadoLabel(estado: EstadoConfirmacion): string {
  const map: Record<EstadoConfirmacion, string> = {
    pendiente:  "Pendiente",
    confirmada: "Confirmada",
    rechazada:  "Rechazada",
  };
  return map[estado];
}

export function HistorialConfirmacionesPage() {
  const { state } = useCaStore();
  const { session } = useRole();

  // Todas las confirmaciones del proveedor de la sesión (parte proveedor)
  const confirmaciones = state.confirmaciones
    .filter((c) => c.parte === "proveedor")
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  // Para cada confirmación obtener la línea de distribución correspondiente
  const filas = confirmaciones.map((conf) => {
    const linea = state.distribucion.find((l) => l.id === conf.lineaDistribucionId);
    const solicitud = linea
      ? state.solicitudes.find((s) => s.id === linea.solicitudId)
      : null;
    return { conf, linea, solicitud };
  });

  return (
    <div className="combustibles-page">
      <DemoBanner />
      <section className="page">
        <header className="page__header">
          <div>
            <h2>Historial de confirmaciones</h2>
            <p className="page__subtitle">
              Registro de todas las confirmaciones y rechazos que has realizado.
              {session?.nombre && <> &mdash; {session.nombre}</>}
            </p>
          </div>
        </header>

        {filas.length === 0 && (
          <p className="empty-state">
            No tienes confirmaciones registradas todavía.
          </p>
        )}

        {filas.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Semana</th>
                  <th scope="col">Material</th>
                  <th scope="col" className="table__col--numeric">Total viajes</th>
                  <th scope="col">Fecha confirmación</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Motivo rechazo</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(({ conf, linea, solicitud }) => {
                  const total = linea
                    ? linea.dl + linea.dt + linea.dc + linea.dj + linea.dv + linea.ds + linea.dg
                    : 0;
                  return (
                    <tr key={conf.id}>
                      <td>{solicitud?.semana ?? "—"}</td>
                      <td>{linea?.materialNom ?? "—"}</td>
                      <td className="table__col--numeric">{total}</td>
                      <td className="table__col--muted">
                        {new Date(conf.ts).toLocaleString("es-ES", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>
                        <span className={estadoPillClass(conf.estado)}>
                          {estadoLabel(conf.estado)}
                        </span>
                      </td>
                      <td className="table__col--muted" style={{ fontSize: "0.85rem" }}>
                        {conf.motivo ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
