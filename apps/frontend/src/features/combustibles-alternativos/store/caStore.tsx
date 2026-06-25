// Este fichero exporta un Provider (componente), un hook y una función helper.
// La regla react-refresh/only-export-components genera warnings esperados en ficheros de store.
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { combustiblesService } from "../services/combustibles.service.js";
import type { EstadoCompleto } from "../services/combustibles.service.js";

// ---------------------------------------------------------------------------
// Tipos del dominio — se mantienen para compatibilidad con las páginas
// ---------------------------------------------------------------------------

export type CambioHistorial = {
  id: number;
  ts: string;
  autor: "produccion" | "compras";
  motivo: string;
  descripcion: string;
};

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
  destino: string;
  obs: string;
};

export type Solicitud = {
  id: number;
  semana: string;
  ini: string;
  fi: string;
  creadaPor: string;
  estado: EstadoSolicitud;
  ts: string;
  comentarioGeneral: string;
  mantenimientosProgramados: string;
  lineas: LineaSolicitud[];
  historial: CambioHistorial[];
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
  destino: string;
  dl: number;
  dt: number;
  dc: number;
  dj: number;
  dv: number;
  ds: number;
  dg: number;
  estado: EstadoLineaDistribucion;
  correoEnviadoEn: string | null;
  correoTransportistaEnviadoEn?: string | null;
  confirmacionProveedor: EstadoConfirmacion;
  confirmacionTransportista: EstadoConfirmacion;
  cantidadesProveedor?: Partial<Record<DiaKey, number>>;
  comentarioProveedor?: string | null;
  cantidadesTransportista?: Partial<Record<DiaKey, number>>;
  comentarioTransportista?: string | null;
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

export type Destino = {
  id: number;
  nom: string;
  activo: boolean;
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
  emails: string[];
  bcc: string[];
  activo: boolean;
};

export type Asignacion = {
  id: number;
  materialId: number;
  proveedorId: number;
  transportistaId: number;
  pct: number;
};

export type PlantillaDistribucion = {
  id: number;
  materialId: number;
  materialNom: string;
  destino: string;
  activo: boolean;
};

export type HorarioLlegada = {
  id: number;
  solicitudId: number;
  dia: DiaKey;
  franja: string;
  silo: "silo1" | "silo2";
  materialNom: string;
  creadoEn: string;
};

export type HorarioPlantillaSlot = {
  id: number;
  dia: DiaKey;
  franja: string;
  silo: "silo1" | "silo2";
  materialNom: string;
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
  destinos: Destino[];
  proveedores: Proveedor[];
  asignaciones: Asignacion[];
  plantillaDistribucion: PlantillaDistribucion[];
  horarioLlegadas: HorarioLlegada[];
  horarioPlantilla: HorarioPlantillaSlot[];
};

// ---------------------------------------------------------------------------
// Estado vacío inicial (mientras carga desde la API)
// ---------------------------------------------------------------------------

const emptyState: CaState = {
  solicitudes: [],
  distribucion: [],
  confirmaciones: [],
  entradasReales: [],
  materiales: [],
  destinos: [],
  proveedores: [],
  asignaciones: [],
  plantillaDistribucion: [],
  horarioLlegadas: [],
  horarioPlantilla: [],
};

// ---------------------------------------------------------------------------
// Acciones — se mantiene exactamente la misma forma para compatibilidad
// ---------------------------------------------------------------------------

export type CaAction =
  // Solicitudes
  | { type: "GUARDAR_BORRADOR"; solicitud: Omit<Solicitud, "id" | "estado" | "ts"> & { id?: number } }
  | { type: "ENVIAR_SOLICITUD"; solicitudId: number }
  | { type: "GUARDAR_Y_ENVIAR"; solicitud: Omit<Solicitud, "id" | "estado" | "ts"> & { id?: number } }
  | { type: "INICIAR_DISTRIBUCION"; solicitudId: number }
  // Distribución
  | { type: "ADD_LINEA_DISTRIBUCION"; linea: Omit<LineaDistribucion, "id"> & { estado?: EstadoLineaDistribucion } }
  | { type: "APLICAR_REPARTO_AUTOMATICO"; solicitudId: number; lineaSolicitudId: number }
  | { type: "UPDATE_LINEA_DISTRIBUCION"; lineaId: number; changes: Partial<LineaDistribucion> }
  | { type: "ELIMINAR_LINEA_DISTRIBUCION"; lineaId: number }
  | { type: "ENVIAR_CORREO_LINEA"; lineaId: number }
  | { type: "ENVIAR_TODOS_CORREOS"; solicitudId: number }
  // Confirmaciones proveedor
  | { type: "CONFIRMAR_LINEA_PROVEEDOR"; lineaId: number; proveedorId: number; comentario?: string | null; cantidades?: Partial<Record<DiaKey, number>> }
  | { type: "RECHAZAR_LINEA_PROVEEDOR"; lineaId: number; proveedorId: number; motivo: string }
  // Confirmaciones transportista
  | { type: "CONFIRMAR_LINEA_TRANSPORTISTA"; lineaId: number; transportistaId: number; comentario?: string | null; cantidades?: Partial<Record<DiaKey, number>> }
  | { type: "RECHAZAR_LINEA_TRANSPORTISTA"; lineaId: number; transportistaId: number; motivo: string }
  // Envío de correo a transportista
  | { type: "ENVIAR_CORREO_TRANSPORTISTA"; lineaId: number }
  // Entradas reales
  | { type: "ADD_ENTRADA_REAL"; entrada: Omit<EntradaReal, "id"> }
  // Maestros — destinos
  | { type: "ADD_DESTINO"; nom: string }
  | { type: "TOGGLE_DESTINO"; id: number }
  // Maestros
  | { type: "ADD_MATERIAL"; nom: string }
  | { type: "TOGGLE_MATERIAL"; id: number }
  | { type: "ADD_PROVEEDOR"; nom: string; tipus: Proveedor["tipus"]; emails: string[]; bcc: string[] }
  | { type: "UPDATE_PROVEEDOR"; id: number; changes: Partial<Pick<Proveedor, "nom" | "tipus" | "emails" | "bcc">> }
  | { type: "TOGGLE_PROVEEDOR"; id: number }
  | { type: "ADD_ASIGNACION"; materialId: number; proveedorId: number; transportistaId: number; pct: number }
  | { type: "DELETE_ASIGNACION"; id: number }
  | { type: "ADD_PLANTILLA_ROW"; row: Omit<PlantillaDistribucion, "id"> }
  | { type: "REMOVE_PLANTILLA_ROW"; id: number }
  | { type: "CERRAR_PROGRAMACION"; solicitudId: number }
  | {
      type: "UPSERT_HORARIO_SLOT";
      solicitudId: number;
      dia: DiaKey;
      franja: string;
      silo: "silo1" | "silo2";
      materialNom: string;
    }
  | { type: "DELETE_HORARIO_SLOT"; solicitudId: number; slotId: number }
  | {
      type: "UPSERT_HORARIO_PLANTILLA_SLOT";
      dia: DiaKey;
      franja: string;
      silo: "silo1" | "silo2";
      materialNom: string;
    }
  | { type: "DELETE_HORARIO_PLANTILLA_SLOT"; slotId: number }
  | {
      type: "EDITAR_SOLICITUD";
      solicitudId: number;
      lineas: Array<{
        id: number;
        dl: number; dt: number; dc: number; dj: number; dv: number; ds: number; dg: number;
        destino?: string;
      }>;
      motivo: string;
      comentarioGeneral?: string;
      mantenimientosProgramados?: string;
    }
  | {
      type: "REASIGNAR_LINEA_DISTRIBUCION";
      solicitudId: number;
      lineaId: number;
      proveedorId?: number;
      proveedorNom?: string;
      transportistaId?: number;
      transportistaNom?: string;
      motivo: string;
    };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function sumaViajes(l: Pick<LineaSolicitud, "dl" | "dt" | "dc" | "dj" | "dv" | "ds" | "dg">): number {
  return l.dl + l.dt + l.dc + l.dj + l.dv + l.ds + l.dg;
}

// ---------------------------------------------------------------------------
// Mapper: API response → CaState
// ---------------------------------------------------------------------------

function mapEstadoToState(api: EstadoCompleto): CaState {
  return {
    solicitudes: api.solicitudes.map((s) => ({
      id: s.id,
      semana: s.semana,
      ini: s.ini,
      fi: s.fi,
      creadaPor: s.creadaPor,
      estado: s.estado,
      comentarioGeneral: s.comentarioGeneral,
      mantenimientosProgramados: s.mantenimientosProgramados ?? "",
      ts: s.ts,
      lineas: s.lineas.map((l): LineaSolicitud => ({
        id: l.id,
        materialId: l.materialId,
        materialNom: l.materialNom,
        dl: l.dl,
        dt: l.dt,
        dc: l.dc,
        dj: l.dj,
        dv: l.dv,
        ds: l.ds,
        dg: l.dg,
        destino: typeof l.destino === "string" ? l.destino : "",
        obs: l.obs,
      })),
      historial: s.historial.map((h) => ({
        id: h.id,
        ts: h.ts,
        autor: h.autor,
        motivo: h.motivo,
        descripcion: h.descripcion,
      })),
    })),
    distribucion: api.distribucion.map((l) => ({
      id: l.id,
      solicitudId: l.solicitudId,
      lineaSolicitudId: l.lineaSolicitudId,
      materialId: l.materialId,
      materialNom: l.materialNom,
      proveedorId: l.proveedorId,
      proveedorNom: l.proveedorNom,
      transportistaId: l.transportistaId,
      transportistaNom: l.transportistaNom,
      destino: l.destino,
      dl: l.dl,
      dt: l.dt,
      dc: l.dc,
      dj: l.dj,
      dv: l.dv,
      ds: l.ds,
      dg: l.dg,
      estado: l.estado,
      correoEnviadoEn: l.correoEnviadoEn,
      correoTransportistaEnviadoEn: l.correoTransportistaEnviadoEn ?? null,
      confirmacionProveedor: l.confirmacionProveedor,
      confirmacionTransportista: l.confirmacionTransportista,
      cantidadesProveedor: l.cantidadesProveedor ?? undefined,
      comentarioProveedor: l.comentarioProveedor,
      cantidadesTransportista: l.cantidadesTransportista ?? undefined,
      comentarioTransportista: l.comentarioTransportista,
      motivoRechazoProveedor: l.motivoRechazoProveedor,
      motivoRechazoTransportista: l.motivoRechazoTransportista,
    })),
    confirmaciones: api.confirmaciones,
    entradasReales: api.entradasReales,
    materiales: api.materiales,
    destinos: api.destinos,
    proveedores: api.proveedores,
    asignaciones: api.asignaciones,
    plantillaDistribucion: api.plantillaDistribucion.map((p) => ({
      id: p.id,
      materialId: p.materialId,
      materialNom: p.materialNom,
      destino: p.destino,
      activo: p.activo,
    })),
    horarioLlegadas: api.horarioLlegadas.map((h) => ({
      id: h.id,
      solicitudId: h.solicitudId,
      dia: h.dia,
      franja: h.franja,
      silo: h.silo,
      materialNom: h.materialNom,
      creadoEn: h.creadoEn,
    })),
    horarioPlantilla: api.horarioPlantilla.map((h) => ({
      id: h.id,
      dia: h.dia,
      franja: h.franja,
      silo: h.silo,
      materialNom: h.materialNom,
    })),
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type CaStoreContextValue = {
  state: CaState;
  dispatch: (action: CaAction) => void;
  loading: boolean;
  error: string | null;
};

const CaStoreContext = createContext<CaStoreContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CaStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CaState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Carga el estado completo desde la API
  const fetchState = useCallback(async () => {
    try {
      const data = await combustiblesService.getState();
      setState(mapEstadoToState(data));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    setLoading(true);
    void fetchState().finally(() => setLoading(false));
  }, [fetchState]);

  // SSE: re-fetch cuando el servidor notifica un cambio
  useEffect(() => {
    const es = new EventSource("/api/combustibles/events");

    es.addEventListener("update", () => {
      void fetchState();
    });

    es.onerror = () => {
      // El EventSource reintenta automáticamente; no hacemos nada
    };

    return () => {
      es.close();
    };
  }, [fetchState]);

  // dispatch: traduce cada acción en la llamada HTTP correspondiente
  // y hace re-fetch tras la respuesta (el SSE también lo dispara, pero
  // hacer re-fetch aquí da feedback inmediato en la misma pestaña)
  const dispatch = useCallback(
    (action: CaAction) => {
      void (async () => {
        try {
          switch (action.type) {
            // Solicitudes
            case "GUARDAR_BORRADOR": {
              const { id, semana, ini, fi, creadaPor, comentarioGeneral, mantenimientosProgramados, lineas } = action.solicitud;
              await combustiblesService.guardarBorrador({
                id,
                semana,
                ini,
                fi,
                creadaPor,
                comentarioGeneral,
                mantenimientosProgramados,
                lineas: lineas.map((l) => ({
                  id: l.id > 0 ? l.id : undefined,
                  materialId: l.materialId,
                  materialNom: l.materialNom,
                  dl: l.dl,
                  dt: l.dt,
                  dc: l.dc,
                  dj: l.dj,
                  dv: l.dv,
                  ds: l.ds,
                  dg: l.dg,
                  destino: l.destino,
                  obs: l.obs,
                })),
              });
              break;
            }
            case "GUARDAR_Y_ENVIAR": {
              const { id, semana, ini, fi, creadaPor, comentarioGeneral, mantenimientosProgramados, lineas } = action.solicitud;
              await combustiblesService.enviarSolicitud({
                id,
                semana,
                ini,
                fi,
                creadaPor,
                comentarioGeneral,
                mantenimientosProgramados,
                lineas: lineas.map((l) => ({
                  id: l.id > 0 ? l.id : undefined,
                  materialId: l.materialId,
                  materialNom: l.materialNom,
                  dl: l.dl,
                  dt: l.dt,
                  dc: l.dc,
                  dj: l.dj,
                  dv: l.dv,
                  ds: l.ds,
                  dg: l.dg,
                  destino: l.destino,
                  obs: l.obs,
                })),
              });
              break;
            }
            case "ENVIAR_SOLICITUD": {
              // Enviar una solicitud existente (solo cambio de estado)
              // Buscamos los datos de la solicitud actual para reenviar
              const sol = stateRef.current.solicitudes.find((s) => s.id === action.solicitudId);
              if (sol) {
                await combustiblesService.enviarSolicitud({
                  id: sol.id,
                  semana: sol.semana,
                  ini: sol.ini,
                  fi: sol.fi,
                  creadaPor: sol.creadaPor,
                  comentarioGeneral: sol.comentarioGeneral,
                  mantenimientosProgramados: sol.mantenimientosProgramados,
                  lineas: sol.lineas.map((l) => ({
                    id: l.id,
                    materialId: l.materialId,
                    materialNom: l.materialNom,
                    dl: l.dl,
                    dt: l.dt,
                    dc: l.dc,
                    dj: l.dj,
                    dv: l.dv,
                    ds: l.ds,
                    dg: l.dg,
                    destino: l.destino,
                    obs: l.obs,
                  })),
                });
              }
              break;
            }
            case "INICIAR_DISTRIBUCION":
              await combustiblesService.iniciarDistribucion(action.solicitudId);
              break;

            case "CERRAR_PROGRAMACION":
              await combustiblesService.cerrarProgramacion(action.solicitudId);
              break;

            case "EDITAR_SOLICITUD":
              await combustiblesService.editarSolicitud(action.solicitudId, {
                lineas: action.lineas,
                motivo: action.motivo,
                ...(action.comentarioGeneral !== undefined && { comentarioGeneral: action.comentarioGeneral }),
                ...(action.mantenimientosProgramados !== undefined && { mantenimientosProgramados: action.mantenimientosProgramados }),
              });
              break;

            // Distribución
            case "ADD_LINEA_DISTRIBUCION": {
              const { linea } = action;
              await combustiblesService.crearLineaDistribucion(
                linea.solicitudId,
                linea.lineaSolicitudId,
                {
                  proveedorId: linea.proveedorId,
                  proveedorNom: linea.proveedorNom,
                  transportistaId: linea.transportistaId,
                  transportistaNom: linea.transportistaNom,
                  destino: linea.destino,
                  dl: linea.dl,
                  dt: linea.dt,
                  dc: linea.dc,
                  dj: linea.dj,
                  dv: linea.dv,
                  ds: linea.ds,
                  dg: linea.dg,
                }
              );
              break;
            }

            case "APLICAR_REPARTO_AUTOMATICO":
              await combustiblesService.aplicarRepartoAutomatico(
                action.solicitudId,
                action.lineaSolicitudId
              );
              break;

            case "UPDATE_LINEA_DISTRIBUCION": {
              const { lineaId, changes } = action;
              await combustiblesService.updateLineaDistribucion(lineaId, {
                proveedorId: changes.proveedorId,
                proveedorNom: changes.proveedorNom,
                transportistaId: changes.transportistaId,
                transportistaNom: changes.transportistaNom,
                destino: changes.destino,
                dl: changes.dl,
                dt: changes.dt,
                dc: changes.dc,
                dj: changes.dj,
                dv: changes.dv,
                ds: changes.ds,
                dg: changes.dg,
              });
              break;
            }

            case "ELIMINAR_LINEA_DISTRIBUCION":
              await combustiblesService.eliminarLineaDistribucion(action.lineaId);
              break;

            case "ENVIAR_CORREO_LINEA":
              await combustiblesService.enviarCorreoLinea(action.lineaId);
              break;

            case "ENVIAR_CORREO_TRANSPORTISTA":
              await combustiblesService.enviarCorreoTransportistaLinea(action.lineaId);
              break;

            case "ENVIAR_TODOS_CORREOS": {
              // Enviar correo a todas las líneas de una solicitud
              const lineas = stateRef.current.distribucion.filter(
                (l) => l.solicitudId === action.solicitudId
              );
              await Promise.all(lineas.map((l) => combustiblesService.enviarCorreoLinea(l.id)));
              break;
            }

            case "CONFIRMAR_LINEA_PROVEEDOR":
              await combustiblesService.confirmarLineaProveedor(action.lineaId, {
                comentario: action.comentario,
                cantidades: action.cantidades,
              });
              break;

            case "RECHAZAR_LINEA_PROVEEDOR":
              await combustiblesService.rechazarLineaProveedor(action.lineaId, action.motivo);
              break;

            case "CONFIRMAR_LINEA_TRANSPORTISTA":
              await combustiblesService.confirmarLineaTransportista(action.lineaId, {
                comentario: action.comentario,
                cantidades: action.cantidades,
              });
              break;

            case "RECHAZAR_LINEA_TRANSPORTISTA":
              await combustiblesService.rechazarLineaTransportista(action.lineaId, action.motivo);
              break;

            case "REASIGNAR_LINEA_DISTRIBUCION":
              await combustiblesService.reasignarLinea(action.lineaId, {
                solicitudId: action.solicitudId,
                proveedorId: action.proveedorId,
                proveedorNom: action.proveedorNom,
                transportistaId: action.transportistaId,
                transportistaNom: action.transportistaNom,
                motivo: action.motivo,
              });
              break;

            // Maestros — destinos
            case "ADD_DESTINO":
              await combustiblesService.addDestino(action.nom);
              break;

            case "TOGGLE_DESTINO":
              await combustiblesService.toggleDestino(action.id);
              break;

            // Maestros — materiales
            case "ADD_MATERIAL":
              await combustiblesService.addMaterial(action.nom);
              break;

            case "TOGGLE_MATERIAL":
              await combustiblesService.toggleMaterial(action.id);
              break;

            // Maestros — proveedores
            case "ADD_PROVEEDOR":
              await combustiblesService.addProveedor({
                nom: action.nom,
                tipus: action.tipus,
                emails: action.emails,
                bcc: action.bcc,
              });
              break;

            case "UPDATE_PROVEEDOR":
              await combustiblesService.updateProveedor(action.id, action.changes);
              break;

            case "TOGGLE_PROVEEDOR":
              await combustiblesService.toggleProveedor(action.id);
              break;

            // Maestros — asignaciones
            case "ADD_ASIGNACION":
              await combustiblesService.addAsignacion({
                materialId: action.materialId,
                proveedorId: action.proveedorId,
                transportistaId: action.transportistaId,
                pct: action.pct,
              });
              break;

            case "DELETE_ASIGNACION":
              await combustiblesService.deleteAsignacion(action.id);
              break;

            // Plantilla de distribución — gestionada por usePlantillaDistribucion hook
            case "ADD_PLANTILLA_ROW":
            case "REMOVE_PLANTILLA_ROW":
              // La plantilla tiene su propio hook (use-plantilla-distribucion)
              // que gestiona las operaciones directamente. Estos cases son no-op aquí.
              break;

            // Entradas reales
            case "ADD_ENTRADA_REAL":
              await combustiblesService.addEntradaReal({
                solicitudId: action.entrada.solicitudId,
                fecha: action.entrada.fecha,
                materialId: action.entrada.materialId,
                materialNom: action.entrada.materialNom,
                proveedorId: action.entrada.proveedorId,
                proveedorNom: action.entrada.proveedorNom,
                transportistaId: action.entrada.transportistaId,
                transportistaNom: action.entrada.transportistaNom,
                viajes: action.entrada.viajes,
                destino: action.entrada.destino,
                obs: action.entrada.obs,
              });
              break;

            // Horario de llegadas
            case "UPSERT_HORARIO_SLOT":
              await combustiblesService.upsertHorarioSlot({
                solicitudId: action.solicitudId,
                dia: action.dia,
                franja: action.franja,
                silo: action.silo,
                materialNom: action.materialNom,
              });
              break;

            case "DELETE_HORARIO_SLOT":
              await combustiblesService.deleteHorarioSlot(action.solicitudId, action.slotId);
              break;

            case "UPSERT_HORARIO_PLANTILLA_SLOT":
              await combustiblesService.upsertHorarioPlantillaSlot({
                dia: action.dia,
                franja: action.franja,
                silo: action.silo,
                materialNom: action.materialNom,
              });
              break;

            case "DELETE_HORARIO_PLANTILLA_SLOT":
              await combustiblesService.deleteHorarioPlantillaSlot(action.slotId);
              break;

            default:
              break;
          }
          // Tras cualquier mutación, re-fetch el estado completo
          await fetchState();
        } catch (err) {
          console.error("[CaStore] dispatch error:", err);
          // Re-lanza para que las páginas puedan mostrar el error si hacen try/catch
          throw err;
        }
      })();
    },
    [fetchState]
  );

  return (
    <CaStoreContext.Provider value={{ state, dispatch, loading, error }}>
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

export function labelEstadoSolicitud(estado: EstadoSolicitud): string {
  switch (estado) {
    case "borrador": return "Borrador";
    case "enviada": return "Enviado a Compras";
    case "en_distribucion": return "En distribución";
    case "confirmada": return "Confirmado";
    case "cerrada": return "Cerrado";
    default: return estado;
  }
}

export function labelConfirmacion(estado: "pendiente" | "confirmada" | "rechazada"): string {
  switch (estado) {
    case "pendiente": return "Pendiente";
    case "confirmada": return "Confirmado";
    case "rechazada": return "Rechazado";
    default: return estado;
  }
}
