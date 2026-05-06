import { useRole } from "../auth/useRole.js";
import type { CaRol } from "../auth/RoleContext.js";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

/** Devuelve el número de semana ISO 8601 y el año ISO para una fecha dada. */
function isoWeekData(date: Date): { week: number; year: number } {
  // Copiamos la fecha y la movemos al jueves de esa semana ISO (la semana pertenece al año de su jueves).
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Día de la semana: 0=dom..6=sáb → ajustamos a 1=lun..7=dom
  const dayOfWeek = tmp.getUTCDay() === 0 ? 7 : tmp.getUTCDay();
  // Movemos al jueves de esta semana ISO
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayOfWeek);
  const year = tmp.getUTCFullYear();
  // Primer jueves del año ISO
  const firstThursday = new Date(Date.UTC(year, 0, 1));
  const ftDay = firstThursday.getUTCDay() === 0 ? 7 : firstThursday.getUTCDay();
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 4 - ftDay);
  const weekNumber =
    1 +
    Math.round(
      (tmp.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
  return { week: weekNumber, year };
}

/** Lunes de la semana ISO a la que pertenece `date`. */
function isoWeekMonday(date: Date): Date {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayOfWeek = tmp.getUTCDay() === 0 ? 7 : tmp.getUTCDay();
  tmp.setUTCDate(tmp.getUTCDate() - (dayOfWeek - 1));
  return tmp;
}

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function getWeekLabel(): string {
  const now = new Date();
  const { week, year } = isoWeekData(now);
  const monday = isoWeekMonday(now);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const monStr = `${padTwo(monday.getUTCDate())}/${padTwo(monday.getUTCMonth() + 1)}`;
  const sunStr = `${padTwo(sunday.getUTCDate())}/${padTwo(sunday.getUTCMonth() + 1)}/${year}`;

  return `S${week} · ${monStr} – ${sunStr}`;
}

type RolBadgeProps = { rol: CaRol };

function RolBadge({ rol }: RolBadgeProps) {
  const labels: Record<CaRol, string> = {
    produccion: "Producción",
    compras: "Compras",
    proveedor: "Proveedor"
  };
  const classes: Record<CaRol, string> = {
    produccion: "ca-topbar__rol-badge ca-topbar__rol-badge--produccion",
    compras: "ca-topbar__rol-badge ca-topbar__rol-badge--compras",
    proveedor: "ca-topbar__rol-badge ca-topbar__rol-badge--proveedor"
  };
  return <span className={classes[rol]}>{labels[rol]}</span>;
}

export function CaTopbar() {
  const { session, logout } = useRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate("/combustibles/login", { replace: true });
  };

  return (
    <header className="ca-topbar">
      <div className="ca-topbar__brand">
        <img
          src="/brand/molins-symbol.png"
          alt="Molins"
          className="ca-topbar__symbol"
        />
        <span className="ca-topbar__title">Combustibles Alternativos</span>
      </div>
      <div className="ca-topbar__center">
        <span className="ca-topbar__week">{getWeekLabel()}</span>
      </div>
      <div className="ca-topbar__right">
        {session && (
          <>
            <RolBadge rol={session.rol} />
            <span className="ca-topbar__user">{session.nombre}</span>
          </>
        )}
        <button
          type="button"
          className="ca-topbar__logout"
          title="Salir"
          onClick={handleLogout}
        >
          <LogOut size={18} aria-hidden="true" />
          <span className="ca-topbar__logout-label">Salir</span>
        </button>
      </div>
    </header>
  );
}
