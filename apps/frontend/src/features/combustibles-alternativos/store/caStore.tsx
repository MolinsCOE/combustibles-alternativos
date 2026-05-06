// Este fichero exporta un Provider (componente), un hook y una función helper.
// La regla react-refresh/only-export-components genera warnings esperados en ficheros de store.
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";

const LS_KEY = "ca_store_v2";

// ---------------------------------------------------------------------------
// Tipos del dominio
// ---------------------------------------------------------------------------

export type EstadoSolicitud =
  | "borrador"
  | "enviada"
  | "en_distribucion"
  | "confirmada"
  | "cerrada";

export type EstadoConfirmacion = "pendiente" | "confirmada" | "rechazada";

export type DiaKey =
  | "dl"
  | "dt"
  | "dc"
  | "dj"
  | "dv"
  | "ds"
  | "dg";

export type LineaSolicitud = {
  id: number;
  materialId: number;
  materialNom: string;
  dl: number;
  dt: number;
  dc: number;
  dj: number;
  dv: number;
  ds: number;
  dg: number;
  obs: string;
};

export type Solicitud = {
  id: number;
  semana: string;    // p.ej. "S19"
  ini: string;       // ISO date
  fi: string;        // ISO date
  creadaPor: string;
  estado: EstadoSolicitud;
  ts: string;        // ISO datetime
  comentarioGeneral: string;
  lineas: LineaSolicitud[];
};

export type EstadoLineaDistribucion =
  | "pendiente"
  | "enviada"
  | "confirmada"
  | "rechazada";

export type LineaDistribucion = {
  id: number;
  solicitudId: number;
  lineaSolicitudId: number;
  materialId: number;
  materialNom: string;
  proveedorId: number;
  proveedorNom: string;
  transportistaId: number;
  transportistaNom: string;
  dl: number;
  dt: number;
  dc: number;
  dj: number;
  dv: number;
  ds: number;
  dg: number;
  estado: EstadoLineaDistribucion;
  correoEnviadoEn: string | null;
  confirmacionProveedor: EstadoConfirmacion;
  confirmacionTransportista: EstadoConfirmacion;
  motivoRechazoProveedor: string | null;
  motivoRechazoTransportista: string | null;
};

export type Confirmacion = {
  id: number;
  lineaDistribucionId: number;
  parte: "proveedor" | "transportista";
  estado: EstadoConfirmacion;
  motivo: string | null;
  ts: string;
};

export type EntradaReal = {
  id: number;
  solicitudId: number | null;
  fecha: string;
  materialId: number;
  materialNom: string;
  proveedorId: number;
  proveedorNom: string;
  transportistaId: number;
  transportistaNom: string;
  viajes: number;
  destino: string;
  obs: string;
};

export type Material = {
  id: number;
  nom: string;
  activo: boolean;
};

export type Proveedor = {
  id: number;
  nom: string;
  tipus: "proveedor" | "transportista" | "ambos";
  email: string;
  activo: boolean;
};

export type Asignacion = {
  id: number;
  materialId: number;
  proveedorId: number;
  transportistaId: number;
  pct: number;
};

// ---------------------------------------------------------------------------
// Estado global
// ---------------------------------------------------------------------------

export type CaState = {
  solicitudes: Solicitud[];
  distribucion: LineaDistribucion[];
  confirmaciones: Confirmacion[];
  entradasReales: EntradaReal[];
  materiales: Material[];
  proveedores: Proveedor[];
  asignaciones: Asignacion[];
};

// ---------------------------------------------------------------------------
// Estado inicial con datos de ejemplo
// ---------------------------------------------------------------------------

const initialState: CaState = {
  solicitudes: [],
  distribucion: [],
  confirmaciones: [],
  entradasReales: [],
  materiales: [
    { id: 1, nom: "Madera Fina",      activo: true },
    { id: 2, nom: "CSR Fino",         activo: true },
    { id: 3, nom: "CSR Grueso",       activo: true },
    { id: 4, nom: "Biomasa Fina",     activo: true },
    { id: 5, nom: "Biomasa Gruesa",   activo: true },
    { id: 6, nom: "NFU",              activo: true },
    { id: 7, nom: "Amoniaco",         activo: true },
    { id: 8, nom: "Sulfato Ferroso",  activo: true },
    { id: 9, nom: "Cáscaras Anacardo", activo: true },
  ],
  proveedores: [
    { id: 1,  nom: "PRONATUR",   tipus: "proveedor",     email: "arnau.guitart@molins.es", activo: true },
    { id: 2,  nom: "GRP",        tipus: "proveedor",     email: "arnau.guitart@molins.es", activo: true },
    { id: 3,  nom: "PIRSA",      tipus: "proveedor",     email: "arnau.guitart@molins.es", activo: true },
    { id: 4,  nom: "SEMESA",     tipus: "proveedor",     email: "arnau.guitart@molins.es", activo: true },
    { id: 5,  nom: "XIRGU",      tipus: "proveedor",     email: "arnau.guitart@molins.es", activo: true },
    { id: 6,  nom: "GESVAL",     tipus: "proveedor",     email: "arnau.guitart@molins.es", activo: true },
    { id: 7,  nom: "FOMENT",     tipus: "transportista", email: "arnau.guitart@molins.es", activo: true },
    { id: 8,  nom: "RUIZ MILÀ",  tipus: "transportista", email: "arnau.guitart@molins.es", activo: true },
    { id: 9,  nom: "RUMO",       tipus: "transportista", email: "arnau.guitart@molins.es", activo: true },
  ],
  asignaciones: [
    { id: 1, materialId: 3, proveedorId: 1, transportistaId: 7, pct: 70 },
    { id: 2, materialId: 3, proveedorId: 1, transportistaId: 8, pct: 30 },
    { id: 3, materialId: 1, proveedorId: 4, transportistaId: 7, pct: 50 },
    { id: 4, materialId: 1, proveedorId: 5, transportistaId: 9, pct: 50 },
  ],
};

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------

export type CaAction =
  // Solicitudes
  | { type: "GUARDAR_BORRADOR"; solicitud: Omit<Solicitud, "id" | "estado" | "ts"> & { id?: number } }
  | { type: "ENVIAR_SOLICITUD"; solicitudId: number }
  | { type: "GUARDAR_Y_ENVIAR"; solicitud: Omit<Solicitud, "id" | "estado" | "ts"> & { id?: number } }
  | { type: "INICIAR_DISTRIBUCION"; solicitudId: number }
  // Distribución
  | { type: "ADD_LINEA_DISTRIBUCION"; linea: Omit<LineaDistribucion, "id"> & { estado?: EstadoLineaDistribucion } }
  | { type: "UPDATE_LINEA_DISTRIBUCION"; lineaId: number; changes: Partial<LineaDistribucion> }
  | { type: "ENVIAR_CORREO_LINEA"; lineaId: number }
  | { type: "ENVIAR_TODOS_CORREOS"; solicitudId: number }
  // Confirmaciones proveedor
  | { type: "CONFIRMAR_LINEA_PROVEEDOR"; lineaId: number; proveedorId: number; comentario?: string | null }
  | { type: "RECHAZAR_LINEA_PROVEEDOR"; lineaId: number; proveedorId: number; motivo: string }
  // Entradas reales
  | { type: "ADD_ENTRADA_REAL"; entrada: Omit<EntradaReal, "id"> }
  // Maestros
  | { type: "ADD_MATERIAL"; nom: string }
  | { type: "TOGGLE_MATERIAL"; id: number }
  | { type: "ADD_PROVEEDOR"; nom: string; tipus: Proveedor["tipus"]; email: string }
  | { type: "TOGGLE_PROVEEDOR"; id: number }
  | { type: "ADD_ASIGNACION"; materialId: number; proveedorId: number; transportistaId: number; pct: number }
  | { type: "DELETE_ASIGNACION"; id: number };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

export function sumaViajes(l: Pick<LineaSolicitud, "dl" | "dt" | "dc" | "dj" | "dv" | "ds" | "dg">): number {
  return l.dl + l.dt + l.dc + l.dj + l.dv + l.ds + l.dg;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function caInnerReducer(state: CaState, action: CaAction): CaState {
  switch (action.type) {

    case "GUARDAR_BORRADOR": {
      const { id, ...rest } = action.solicitud;
      // Si tiene id, actualiza; si no, crea nueva con estado borrador
      if (id !== undefined) {
        return {
          ...state,
          solicitudes: state.solicitudes.map((s) =>
            s.id === id ? { ...s, ...rest } : s
          ),
        };
      }
      const nueva: Solicitud = {
        id: nextId(state.solicitudes),
        estado: "borrador",
        ts: new Date().toISOString(),
        ...rest,
      };
      return { ...state, solicitudes: [...state.solicitudes, nueva] };
    }

    case "ENVIAR_SOLICITUD":
      return {
        ...state,
        solicitudes: state.solicitudes.map((s) =>
          s.id === action.solicitudId ? { ...s, estado: "enviada" } : s
        ),
      };

    case "GUARDAR_Y_ENVIAR": {
      const { id, ...rest } = action.solicitud;
      if (id !== undefined) {
        // Actualiza la existente y la marca como enviada
        return {
          ...state,
          solicitudes: state.solicitudes.map((s) =>
            s.id === id ? { ...s, ...rest, estado: "enviada" as EstadoSolicitud } : s
          ),
        };
      }
      // Crea nueva directamente en estado enviada
      const nueva: Solicitud = {
        id: nextId(state.solicitudes),
        estado: "enviada",
        ts: new Date().toISOString(),
        ...rest,
      };
      return { ...state, solicitudes: [...state.solicitudes, nueva] };
    }

    case "INICIAR_DISTRIBUCION":
      return {
        ...state,
        solicitudes: state.solicitudes.map((s) =>
          s.id === action.solicitudId ? { ...s, estado: "en_distribucion" } : s
        ),
      };

    case "ADD_LINEA_DISTRIBUCION": {
      const linea: LineaDistribucion = {
        id: nextId(state.distribucion),
        ...action.linea,
        estado: action.linea.estado ?? "pendiente",
      };
      return { ...state, distribucion: [...state.distribucion, linea] };
    }

    case "UPDATE_LINEA_DISTRIBUCION":
      return {
        ...state,
        distribucion: state.distribucion.map((l) =>
          l.id === action.lineaId ? { ...l, ...action.changes } : l
        ),
      };

    case "ENVIAR_CORREO_LINEA":
      return {
        ...state,
        distribucion: state.distribucion.map((l) =>
          l.id === action.lineaId
            ? { ...l, estado: "enviada" as const, correoEnviadoEn: new Date().toISOString() }
            : l
        ),
      };

    case "ENVIAR_TODOS_CORREOS":
      return {
        ...state,
        distribucion: state.distribucion.map((l) =>
          l.solicitudId === action.solicitudId
            ? { ...l, estado: "enviada" as const, correoEnviadoEn: new Date().toISOString() }
            : l
        ),
      };

    case "CONFIRMAR_LINEA_PROVEEDOR": {
      const conf: Confirmacion = {
        id: nextId(state.confirmaciones),
        lineaDistribucionId: action.lineaId,
        parte: "proveedor",
        estado: "confirmada",
        motivo: action.comentario ?? null,
        ts: new Date().toISOString(),
      };
      const nuevaDistribucion = state.distribucion.map((l) =>
        l.id === action.lineaId
          ? {
              ...l,
              confirmacionProveedor: "confirmada" as EstadoConfirmacion,
              confirmacionTransportista: "confirmada" as EstadoConfirmacion,
            }
          : l
      );
      // Buscar la solicitud afectada y comprobar si todas sus líneas están confirmadas
      const lineaConfirmada = nuevaDistribucion.find((l) => l.id === action.lineaId);
      const solicitudId = lineaConfirmada?.solicitudId;
      const todasConfirmadas =
        solicitudId !== undefined &&
        nuevaDistribucion
          .filter((l) => l.solicitudId === solicitudId)
          .every((l) => l.confirmacionProveedor === "confirmada");
      return {
        ...state,
        distribucion: nuevaDistribucion,
        confirmaciones: [...state.confirmaciones, conf],
        solicitudes: todasConfirmadas
          ? state.solicitudes.map((s) =>
              s.id === solicitudId ? { ...s, estado: "confirmada" as const } : s
            )
          : state.solicitudes,
      };
    }

    case "RECHAZAR_LINEA_PROVEEDOR": {
      const conf: Confirmacion = {
        id: nextId(state.confirmaciones),
        lineaDistribucionId: action.lineaId,
        parte: "proveedor",
        estado: "rechazada",
        motivo: action.motivo,
        ts: new Date().toISOString(),
      };
      return {
        ...state,
        distribucion: state.distribucion.map((l) =>
          l.id === action.lineaId
            ? {
                ...l,
                confirmacionProveedor: "rechazada" as EstadoConfirmacion,
                motivoRechazoProveedor: action.motivo,
              }
            : l
        ),
        confirmaciones: [...state.confirmaciones, conf],
      };
    }

    case "ADD_ENTRADA_REAL": {
      const entrada: EntradaReal = {
        id: nextId(state.entradasReales),
        ...action.entrada,
      };
      return { ...state, entradasReales: [...state.entradasReales, entrada] };
    }

    case "ADD_MATERIAL": {
      const mat: Material = {
        id: nextId(state.materiales),
        nom: action.nom,
        activo: true,
      };
      return { ...state, materiales: [...state.materiales, mat] };
    }

    case "TOGGLE_MATERIAL":
      return {
        ...state,
        materiales: state.materiales.map((m) =>
          m.id === action.id ? { ...m, activo: !m.activo } : m
        ),
      };

    case "ADD_PROVEEDOR": {
      const prov: Proveedor = {
        id: nextId(state.proveedores),
        nom: action.nom,
        tipus: action.tipus,
        email: action.email,
        activo: true,
      };
      return { ...state, proveedores: [...state.proveedores, prov] };
    }

    case "TOGGLE_PROVEEDOR":
      return {
        ...state,
        proveedores: state.proveedores.map((p) =>
          p.id === action.id ? { ...p, activo: !p.activo } : p
        ),
      };

    case "ADD_ASIGNACION": {
      const asig: Asignacion = {
        id: nextId(state.asignaciones),
        materialId: action.materialId,
        proveedorId: action.proveedorId,
        transportistaId: action.transportistaId,
        pct: action.pct,
      };
      return { ...state, asignaciones: [...state.asignaciones, asig] };
    }

    case "DELETE_ASIGNACION":
      return {
        ...state,
        asignaciones: state.asignaciones.filter((a) => a.id !== action.id),
      };

    default:
      return state;
  }
}

function caReducer(state: CaState, action: CaAction | { type: "__SYNC__"; state: CaState }): CaState {
  if (action.type === "__SYNC__") return (action as { type: "__SYNC__"; state: CaState }).state;
  return caInnerReducer(state, action as CaAction);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type CaStoreContextValue = {
  state: CaState;
  dispatch: Dispatch<CaAction>;
};

const CaStoreContext = createContext<CaStoreContextValue | null>(null);

function loadFromStorage(): CaState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...(JSON.parse(raw) as Partial<CaState>) };
  } catch {
    return initialState;
  }
}

function saveToStorage(state: CaState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* cuota excedida, ignorar */ }
}

export function CaStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(caReducer, undefined, loadFromStorage);
  const isFirstRender = useRef(true);

  // Persiste en localStorage cada vez que el estado cambia
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    saveToStorage(state);
  }, [state]);

  // Sincroniza entre pestañas cuando otra pestaña modifica el store
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== LS_KEY || e.newValue === null) return;
      try {
        const next = JSON.parse(e.newValue) as CaState;
        dispatch({ type: "__SYNC__", state: next } as unknown as CaAction & { type: "__SYNC__"; state: CaState });
      } catch { /* ignorar */ }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <CaStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </CaStoreContext.Provider>
  );
}

export function useCaStore(): CaStoreContextValue {
  const ctx = useContext(CaStoreContext);
  if (!ctx) {
    throw new Error("useCaStore debe usarse dentro de CaStoreProvider");
  }
  return ctx;
}

