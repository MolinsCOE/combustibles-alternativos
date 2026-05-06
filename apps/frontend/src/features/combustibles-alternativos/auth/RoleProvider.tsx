import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { RoleContext } from "./RoleContext.js";
import type { CaSession } from "./types.js";

const SESSION_KEY = "ca_session";

function loadSession(): CaSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "nombre" in parsed &&
      "rol" in parsed &&
      typeof (parsed as Record<string, unknown>).nombre === "string" &&
      typeof (parsed as Record<string, unknown>).rol === "string" &&
      ["produccion", "compras", "proveedor"].includes(
        (parsed as Record<string, unknown>).rol as string
      )
    ) {
      const p = parsed as Record<string, unknown>;
      return {
        nombre: p.nombre as string,
        rol: p.rol as CaSession["rol"],
        proveedorId:
          typeof p.proveedorId === "string" ? p.proveedorId : null
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CaSession | null>(loadSession);

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  const login = useCallback((s: CaSession) => {
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  return (
    <RoleContext.Provider value={{ session, login, logout }}>
      {children}
    </RoleContext.Provider>
  );
}
