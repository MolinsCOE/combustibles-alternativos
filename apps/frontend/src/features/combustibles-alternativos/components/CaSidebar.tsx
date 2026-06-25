import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  FolderOpen,
  BarChart2,
  Inbox,
  Truck,
  CheckSquare,
  Package,
  Settings,
  Bell,
  History,
  Activity
} from "lucide-react";
import { useRole } from "../auth/useRole.js";
import type { CaRol } from "../auth/RoleContext.js";

type NavItem = {
  to: string;
  end?: boolean;
  icon: ReactNode;
  label: string;
};

function navItemsForRol(rol: CaRol): NavItem[] {
  switch (rol) {
    case "produccion":
      return [
        {
          to: "/combustibles/solicitud/nueva",
          icon: <ClipboardList size={18} aria-hidden="true" />,
          label: "Nueva solicitud"
        },
        {
          to: "/combustibles/solicitud/mis-solicitudes",
          icon: <FolderOpen size={18} aria-hidden="true" />,
          label: "Mis solicitudes"
        },
        {
          to: "/combustibles/estado-suministro",
          icon: <Activity size={18} aria-hidden="true" />,
          label: "Estado del suministro"
        }
      ];
    case "compras":
      return [
        {
          to: "/combustibles/resumen",
          end: true,
          icon: <BarChart2 size={18} aria-hidden="true" />,
          label: "Resumen semanal"
        },
        {
          to: "/combustibles/solicitudes-recibidas",
          icon: <Inbox size={18} aria-hidden="true" />,
          label: "Solicitudes recibidas"
        },
        {
          to: "/combustibles/distribucion",
          icon: <Truck size={18} aria-hidden="true" />,
          label: "Planificación de viajes"
        },
        {
          to: "/combustibles/confirmaciones",
          icon: <CheckSquare size={18} aria-hidden="true" />,
          label: "Confirmación proveedores y transportistas"
        },
        {
          to: "/combustibles/entradas-reales",
          icon: <Package size={18} aria-hidden="true" />,
          label: "Entradas reales"
        },
        {
          to: "/combustibles/maestros",
          icon: <Settings size={18} aria-hidden="true" />,
          label: "Configuración"
        }
      ];
    case "proveedor":
      return [
        {
          to: "/combustibles/mis-confirmaciones",
          icon: <Bell size={18} aria-hidden="true" />,
          label: "Confirmaciones pendientes"
        },
        {
          to: "/combustibles/historial-confirmaciones",
          icon: <History size={18} aria-hidden="true" />,
          label: "Historial de confirmaciones"
        }
      ];
  }
}

function rolSectionLabel(rol: CaRol): string {
  const labels: Record<CaRol, string> = {
    produccion: "Vista Producción",
    compras: "Vista Compras",
    proveedor: "Vista Proveedor"
  };
  return labels[rol];
}

export function CaSidebar() {
  const { session } = useRole();

  if (!session) return null;

  const items = navItemsForRol(session.rol);

  return (
    <nav className="ca-sidebar" aria-label="Navegación del módulo">
      <p className="ca-sidebar__section-label">{rolSectionLabel(session.rol)}</p>
      <ul className="ca-sidebar__list">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "ca-sidebar__link ca-sidebar__link--active" : "ca-sidebar__link"
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
