import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useGestionJornada } from "./useGestionJornada.js";

type GestionJornadaContextValue = ReturnType<typeof useGestionJornada>;

const GestionJornadaContext = createContext<GestionJornadaContextValue | null>(null);

interface GestionJornadaProviderProps {
  children: ReactNode;
}

export function GestionJornadaProvider({ children }: GestionJornadaProviderProps) {
  const value = useGestionJornada();
  return (
    <GestionJornadaContext.Provider value={value}>
      {children}
    </GestionJornadaContext.Provider>
  );
}

export function useGestionJornadaContext(): GestionJornadaContextValue {
  const ctx = useContext(GestionJornadaContext);
  if (!ctx) {
    throw new Error("useGestionJornadaContext must be used inside GestionJornadaProvider");
  }
  return ctx;
}
