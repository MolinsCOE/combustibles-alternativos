import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRole } from "./useRole.js";
import type { CaRol } from "./RoleContext.js";
import { rolHomePath } from "./rolHomePath.js";

type RoleGuardProps = {
  allowedRoles: CaRol[];
  redirectTo?: string;
  children: ReactNode;
};

/**
 * Muestra un toast de "acceso denegado" durante un breve instante
 * y luego navega a la ruta de inicio del rol.
 */
function AccessDeniedRedirect({ to }: { to: string }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      void navigate(to, { replace: true });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [navigate, to]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "var(--color-danger, #dc2626)",
        color: "#fff",
        padding: "0.75rem 1.5rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        fontSize: "0.9rem",
        fontWeight: 500,
        whiteSpace: "nowrap"
      }}
    >
      No tienes acceso a esta sección
    </div>
  );
}

export function RoleGuard({ allowedRoles, redirectTo, children }: RoleGuardProps) {
  const { session } = useRole();

  if (!session) {
    return <Navigate to="/combustibles/login" replace />;
  }

  if (!allowedRoles.includes(session.rol)) {
    const fallback = redirectTo ?? rolHomePath(session.rol);
    return <AccessDeniedRedirect to={fallback} />;
  }

  return <>{children}</>;
}
