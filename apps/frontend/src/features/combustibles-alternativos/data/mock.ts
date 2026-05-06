// Datos de ejemplo para la demo visual. Se reemplazarán por llamadas a la API en Fase 2.

export type EstadoPlanificacion =
  | "borrador"
  | "pendiente_distribucion"
  | "en_distribucion"
  | "enviada"
  | "confirmada"
  | "cerrada";

export type EstadoConfirmacion = "pendiente" | "confirmada" | "rechazada";

export type TipoIncidencia = "incidencia" | "aviso";

export type Destino = {
  id: string;
  nombre: string;
  activo: boolean;
};

export type Material = {
  id: string;
  nombre: string;
  destinoId: string;
  destinoNombre: string;
  horaInicioRestriccion: string | null;
  horaFinRestriccion: string | null;
  activo: boolean;
};

export type Proveedor = {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
};

export type Transportista = {
  id: string;
  nombre: string;
  emails: string[];
  activo: boolean;
};

export type Asignacion = {
  id: string;
  materialId: string;
  materialNombre: string;
  proveedorId: string;
  proveedorNombre: string;
  transportistaId: string;
  transportistaNombre: string;
  porcentaje: number;
};

export type LineaSolicitud = {
  id: string;
  materialId: string;
  materialNombre: string;
  destinoId: string;
  destinoNombre: string;
  viajesLunes: number;
  viajesMartes: number;
  viajesMiercoles: number;
  viajesJueves: number;
  viajesViernes: number;
  viajesSabado: number;
  viajesDomingo: number;
  totalViajes: number;
  comentarioLinea: string;
};

export type PlanificacionSemanal = {
  id: string;
  anyo: number;
  semana: number;
  estado: EstadoPlanificacion;
  comentarioGeneral: string;
  creadoPorNombre: string;
  creadoEn: string;
};

export type LineaDistribucion = {
  id: string;
  planificacionId: string;
  lineaSolicitudId: string;
  materialId: string;
  materialNombre: string;
  proveedorId: string;
  proveedorNombre: string;
  transportistaId: string;
  transportistaNombre: string;
  destinoId: string;
  destinoNombre: string;
  viajesLunes: number;
  viajesMartes: number;
  viajesMiercoles: number;
  viajesJueves: number;
  viajesViernes: number;
  viajesSabado: number;
  viajesDomingo: number;
  totalViajes: number;
  correoEnviadoEn: string | null;
  confirmacionProveedor: EstadoConfirmacion;
  confirmacionTransportista: EstadoConfirmacion;
  motivoRechazoProveedor: string | null;
  motivoRechazoTransportista: string | null;
};

export type ViajeReal = {
  id: string;
  planificacionId: string;
  fecha: string;
  materialId: string;
  materialNombre: string;
  proveedorId: string;
  proveedorNombre: string;
  transportistaId: string;
  transportistaNombre: string;
  viajesReales: number;
};

export type Incidencia = {
  id: string;
  fecha: string;
  materialNombre: string;
  proveedorNombre: string;
  transportistaNombre: string;
  viajesPrevistos: number;
  viajesRealizados: number;
  desviacion: number;
  tipo: TipoIncidencia;
  comentarioInterno: string;
};

export type FilaCruce = {
  materialNombre: string;
  proveedorNombre: string;
  transportistaNombre: string;
  planificado: number;
  confirmado: number;
  real: number;
  desviacion: number;
  tipo: TipoIncidencia | "ok";
  motivoRechazo: string | null;
};

// -----------------------------------------------------------------------
// Catálogos maestros
// -----------------------------------------------------------------------

export const DESTINOS_MOCK: Destino[] = [
  { id: "d1", nombre: "QUEMADOR SILO 1", activo: true },
  { id: "d2", nombre: "QUEMADOR SILO 2", activo: true },
  { id: "d3", nombre: "BUNKERS", activo: true },
  { id: "d4", nombre: "PISOS MOVILES", activo: true },
  { id: "d5", nombre: "A DEPOSITO", activo: true },
  { id: "d6", nombre: "A C-31/C-35", activo: true }
];

export const MATERIALES_MOCK: Material[] = [
  { id: "m1", nombre: "Madera Fina", destinoId: "d1", destinoNombre: "QUEMADOR SILO 1", horaInicioRestriccion: null, horaFinRestriccion: null, activo: true },
  { id: "m2", nombre: "Cáscaras de Anacardo", destinoId: "d1", destinoNombre: "QUEMADOR SILO 1", horaInicioRestriccion: null, horaFinRestriccion: null, activo: true },
  { id: "m3", nombre: "CSR Fino", destinoId: "d4", destinoNombre: "PISOS MOVILES", horaInicioRestriccion: null, horaFinRestriccion: null, activo: true },
  { id: "m4", nombre: "CSR Grueso Bunkers", destinoId: "d3", destinoNombre: "BUNKERS", horaInicioRestriccion: null, horaFinRestriccion: null, activo: true },
  { id: "m5", nombre: "Biomasa Gruesa", destinoId: "d2", destinoNombre: "QUEMADOR SILO 2", horaInicioRestriccion: null, horaFinRestriccion: null, activo: true },
  { id: "m6", nombre: "NFU", destinoId: "d4", destinoNombre: "PISOS MOVILES", horaInicioRestriccion: null, horaFinRestriccion: null, activo: true },
  { id: "m7", nombre: "Amoniaco", destinoId: "d5", destinoNombre: "A DEPOSITO", horaInicioRestriccion: "09:00", horaFinRestriccion: "14:00", activo: true },
  { id: "m8", nombre: "Sulfato Ferroso", destinoId: "d6", destinoNombre: "A C-31/C-35", horaInicioRestriccion: null, horaFinRestriccion: null, activo: true }
];

export const PROVEEDORES_MOCK: Proveedor[] = [
  { id: "p1", nombre: "FOMENT", email: "foment@foment.es", activo: true },
  { id: "p2", nombre: "RUMO", email: "logistica@rumo.es", activo: true },
  { id: "p3", nombre: "GREEN FUELS", email: "comercial@greenfuels.com", activo: true },
  { id: "p4", nombre: "BIOMASA IBERICA", email: "ventas@biomasaiberica.es", activo: true }
];

export const TRANSPORTISTAS_MOCK: Transportista[] = [
  { id: "t1", nombre: "RUIZ MILA", emails: ["operaciones@ruizmila.es", "conductores@ruizmila.es"], activo: true },
  { id: "t2", nombre: "TRANSAGIL", emails: ["info@transagil.es"], activo: true },
  { id: "t3", nombre: "LOGISTICA CENTRO", emails: ["logistica@logisticacentro.es"], activo: true }
];

export const ASIGNACIONES_MOCK: Asignacion[] = [
  { id: "a1", materialId: "m1", materialNombre: "Madera Fina", proveedorId: "p1", proveedorNombre: "FOMENT", transportistaId: "t1", transportistaNombre: "RUIZ MILA", porcentaje: 70 },
  { id: "a2", materialId: "m1", materialNombre: "Madera Fina", proveedorId: "p1", proveedorNombre: "FOMENT", transportistaId: "t2", transportistaNombre: "TRANSAGIL", porcentaje: 30 },
  { id: "a3", materialId: "m2", materialNombre: "Cáscaras de Anacardo", proveedorId: "p2", proveedorNombre: "RUMO", transportistaId: "t1", transportistaNombre: "RUIZ MILA", porcentaje: 100 },
  { id: "a4", materialId: "m3", materialNombre: "CSR Fino", proveedorId: "p3", proveedorNombre: "GREEN FUELS", transportistaId: "t2", transportistaNombre: "TRANSAGIL", porcentaje: 100 },
  { id: "a5", materialId: "m4", materialNombre: "CSR Grueso Bunkers", proveedorId: "p3", proveedorNombre: "GREEN FUELS", transportistaId: "t3", transportistaNombre: "LOGISTICA CENTRO", porcentaje: 100 },
  { id: "a6", materialId: "m5", materialNombre: "Biomasa Gruesa", proveedorId: "p4", proveedorNombre: "BIOMASA IBERICA", transportistaId: "t2", transportistaNombre: "TRANSAGIL", porcentaje: 60 },
  { id: "a7", materialId: "m5", materialNombre: "Biomasa Gruesa", proveedorId: "p4", proveedorNombre: "BIOMASA IBERICA", transportistaId: "t3", transportistaNombre: "LOGISTICA CENTRO", porcentaje: 40 }
];

// -----------------------------------------------------------------------
// Planificación semanal activa (semana 19/2026)
// -----------------------------------------------------------------------

export const PLANIFICACION_ACTIVA_MOCK: PlanificacionSemanal = {
  id: "ps1",
  anyo: 2026,
  semana: 19,
  estado: "enviada",
  comentarioGeneral: "Semana con festivo el jueves. Reducir viajes de NFU ese día.",
  creadoPorNombre: "Producción",
  creadoEn: "2026-04-28T08:00:00Z"
};

export const PLANIFICACIONES_HISTORIAL_MOCK: PlanificacionSemanal[] = [
  { id: "ps2", anyo: 2026, semana: 18, estado: "cerrada", comentarioGeneral: "", creadoPorNombre: "Producción", creadoEn: "2026-04-21T08:00:00Z" },
  { id: "ps3", anyo: 2026, semana: 17, estado: "cerrada", comentarioGeneral: "", creadoPorNombre: "Producción", creadoEn: "2026-04-14T08:00:00Z" },
  PLANIFICACION_ACTIVA_MOCK
];

export const LINEAS_SOLICITUD_MOCK: LineaSolicitud[] = [
  { id: "ls1", materialId: "m1", materialNombre: "Madera Fina", destinoId: "d1", destinoNombre: "QUEMADOR SILO 1", viajesLunes: 3, viajesMartes: 3, viajesMiercoles: 3, viajesJueves: 2, viajesViernes: 3, viajesSabado: 0, viajesDomingo: 0, totalViajes: 14, comentarioLinea: "" },
  { id: "ls2", materialId: "m2", materialNombre: "Cáscaras de Anacardo", destinoId: "d1", destinoNombre: "QUEMADOR SILO 1", viajesLunes: 2, viajesMartes: 2, viajesMiercoles: 2, viajesJueves: 1, viajesViernes: 2, viajesSabado: 0, viajesDomingo: 0, totalViajes: 9, comentarioLinea: "" },
  { id: "ls3", materialId: "m3", materialNombre: "CSR Fino", destinoId: "d4", destinoNombre: "PISOS MOVILES", viajesLunes: 4, viajesMartes: 4, viajesMiercoles: 4, viajesJueves: 3, viajesViernes: 4, viajesSabado: 2, viajesDomingo: 0, totalViajes: 21, comentarioLinea: "Incluir sábado si es posible" },
  { id: "ls4", materialId: "m4", materialNombre: "CSR Grueso Bunkers", destinoId: "d3", destinoNombre: "BUNKERS", viajesLunes: 2, viajesMartes: 2, viajesMiercoles: 2, viajesJueves: 0, viajesViernes: 2, viajesSabado: 0, viajesDomingo: 0, totalViajes: 8, comentarioLinea: "" },
  { id: "ls5", materialId: "m5", materialNombre: "Biomasa Gruesa", destinoId: "d2", destinoNombre: "QUEMADOR SILO 2", viajesLunes: 1, viajesMartes: 1, viajesMiercoles: 1, viajesJueves: 0, viajesViernes: 1, viajesSabado: 0, viajesDomingo: 0, totalViajes: 4, comentarioLinea: "" }
];

export const LINEAS_DISTRIBUCION_MOCK: LineaDistribucion[] = [
  {
    id: "ld1", planificacionId: "ps1", lineaSolicitudId: "ls1",
    materialId: "m1", materialNombre: "Madera Fina",
    proveedorId: "p1", proveedorNombre: "FOMENT",
    transportistaId: "t1", transportistaNombre: "RUIZ MILA",
    destinoId: "d1", destinoNombre: "QUEMADOR SILO 1",
    viajesLunes: 2, viajesMartes: 2, viajesMiercoles: 2, viajesJueves: 2, viajesViernes: 2, viajesSabado: 0, viajesDomingo: 0,
    totalViajes: 10,
    correoEnviadoEn: "2026-04-28T10:30:00Z",
    confirmacionProveedor: "confirmada",
    confirmacionTransportista: "pendiente",
    motivoRechazoProveedor: null,
    motivoRechazoTransportista: null
  },
  {
    id: "ld2", planificacionId: "ps1", lineaSolicitudId: "ls1",
    materialId: "m1", materialNombre: "Madera Fina",
    proveedorId: "p1", proveedorNombre: "FOMENT",
    transportistaId: "t2", transportistaNombre: "TRANSAGIL",
    destinoId: "d1", destinoNombre: "QUEMADOR SILO 1",
    viajesLunes: 1, viajesMartes: 1, viajesMiercoles: 1, viajesJueves: 0, viajesViernes: 1, viajesSabado: 0, viajesDomingo: 0,
    totalViajes: 4,
    correoEnviadoEn: "2026-04-28T10:30:00Z",
    confirmacionProveedor: "confirmada",
    confirmacionTransportista: "rechazada",
    motivoRechazoProveedor: null,
    motivoRechazoTransportista: "No hay disponibilidad de camiones el miércoles"
  },
  {
    id: "ld3", planificacionId: "ps1", lineaSolicitudId: "ls2",
    materialId: "m2", materialNombre: "Cáscaras de Anacardo",
    proveedorId: "p2", proveedorNombre: "RUMO",
    transportistaId: "t1", transportistaNombre: "RUIZ MILA",
    destinoId: "d1", destinoNombre: "QUEMADOR SILO 1",
    viajesLunes: 2, viajesMartes: 2, viajesMiercoles: 2, viajesJueves: 1, viajesViernes: 2, viajesSabado: 0, viajesDomingo: 0,
    totalViajes: 9,
    correoEnviadoEn: "2026-04-28T10:30:00Z",
    confirmacionProveedor: "pendiente",
    confirmacionTransportista: "pendiente",
    motivoRechazoProveedor: null,
    motivoRechazoTransportista: null
  },
  {
    id: "ld4", planificacionId: "ps1", lineaSolicitudId: "ls3",
    materialId: "m3", materialNombre: "CSR Fino",
    proveedorId: "p3", proveedorNombre: "GREEN FUELS",
    transportistaId: "t2", transportistaNombre: "TRANSAGIL",
    destinoId: "d4", destinoNombre: "PISOS MOVILES",
    viajesLunes: 4, viajesMartes: 4, viajesMiercoles: 4, viajesJueves: 3, viajesViernes: 4, viajesSabado: 2, viajesDomingo: 0,
    totalViajes: 21,
    correoEnviadoEn: "2026-04-28T10:30:00Z",
    confirmacionProveedor: "confirmada",
    confirmacionTransportista: "confirmada",
    motivoRechazoProveedor: null,
    motivoRechazoTransportista: null
  }
];

// -----------------------------------------------------------------------
// Cruce real vs planificado (lunes 05/05/2026)
// -----------------------------------------------------------------------

export const FILAS_CRUCE_MOCK: FilaCruce[] = [
  { materialNombre: "Madera Fina", proveedorNombre: "FOMENT", transportistaNombre: "RUIZ MILA", planificado: 2, confirmado: 2, real: 2, desviacion: 0, tipo: "ok", motivoRechazo: null },
  { materialNombre: "Madera Fina", proveedorNombre: "FOMENT", transportistaNombre: "TRANSAGIL", planificado: 1, confirmado: 1, real: 0, desviacion: -1, tipo: "incidencia", motivoRechazo: "No hay disponibilidad de camiones el miércoles" },
  { materialNombre: "Cáscaras de Anacardo", proveedorNombre: "RUMO", transportistaNombre: "RUIZ MILA", planificado: 2, confirmado: 2, real: 3, desviacion: 1, tipo: "aviso", motivoRechazo: null },
  { materialNombre: "CSR Fino", proveedorNombre: "GREEN FUELS", transportistaNombre: "TRANSAGIL", planificado: 4, confirmado: 4, real: 4, desviacion: 0, tipo: "ok", motivoRechazo: null }
];

export const INCIDENCIAS_MOCK: Incidencia[] = [
  {
    id: "i1",
    fecha: "2026-05-05",
    materialNombre: "Madera Fina",
    proveedorNombre: "FOMENT",
    transportistaNombre: "TRANSAGIL",
    viajesPrevistos: 1,
    viajesRealizados: 0,
    desviacion: -1,
    tipo: "incidencia",
    comentarioInterno: "Pendiente de gestionar con el transportista"
  }
];

// -----------------------------------------------------------------------
// KPIs dashboard
// -----------------------------------------------------------------------

export const DASHBOARD_KPIS_MOCK = {
  viajesHoy: 9,
  viajesPlanHoy: 10,
  desviacionHoy: -1,
  pendientesEnvio: 1,
  incidenciasActivas: 1,
  lineasPendientesConfirmacion: 4,
  cumplimientoSemana: 87,
  semana: 19,
  anyo: 2026
};

export const RESUMEN_SEMANA_MOCK = [
  { material: "Madera Fina", planificados: 14, confirmados: 10, reales: 8, desviacion: -2 },
  { material: "Cáscaras de Anacardo", planificados: 9, confirmados: 9, reales: 7, desviacion: -2 },
  { material: "CSR Fino", planificados: 21, confirmados: 21, reales: 20, desviacion: -1 },
  { material: "CSR Grueso Bunkers", planificados: 8, confirmados: 0, reales: 0, desviacion: 0 },
  { material: "Biomasa Gruesa", planificados: 4, confirmados: 0, reales: 0, desviacion: 0 }
];
