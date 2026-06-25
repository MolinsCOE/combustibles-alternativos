/**
 * Domain entities for the Combustibles Alternativos module.
 * Pure types — no framework, no ORM, no HTTP dependencies.
 */

export type EstadoSolicitud =
  | "borrador"
  | "enviada"
  | "en_distribucion"
  | "confirmada"
  | "cerrada";

export type EstadoConfirmacion = "pendiente" | "confirmada" | "rechazada";

export type EstadoLineaDistribucion =
  | "pendiente"
  | "enviada"
  | "confirmada"
  | "rechazada";

export type DiaKey = "dl" | "dt" | "dc" | "dj" | "dv" | "ds" | "dg";

export type TipusProveedor = "proveedor" | "transportista" | "ambos";

export type AutorHistorial = "produccion" | "compras";

// ---------------------------------------------------------------------------
// Maestros
// ---------------------------------------------------------------------------

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
  tipus: TipusProveedor;
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
  createdAt: string;
};

export type CreatePlantillaDistribucionInput = {
  materialId: number;
  materialNom: string;
  destino: string;
};

// ---------------------------------------------------------------------------
// Solicitudes
// ---------------------------------------------------------------------------

export type LineaSolicitud = {
  id: number;
  solicitudId: number;
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

export type CambioHistorial = {
  id: number;
  solicitudId: number;
  ts: string;
  autor: AutorHistorial;
  motivo: string;
  descripcion: string;
};

export type Solicitud = {
  id: number;
  semana: string;
  ini: string;
  fi: string;
  creadaPor: string;
  estado: EstadoSolicitud;
  comentarioGeneral: string;
  mantenimientosProgramados: string;
  ts: string;
  lineas: LineaSolicitud[];
  historial: CambioHistorial[];
};

// ---------------------------------------------------------------------------
// Distribución
// ---------------------------------------------------------------------------

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
  confirmacionProveedor: EstadoConfirmacion;
  confirmacionTransportista: EstadoConfirmacion;
  cantidadesProveedor: Partial<Record<DiaKey, number>> | null;
  comentarioProveedor: string | null;
  cantidadesTransportista: Partial<Record<DiaKey, number>> | null;
  comentarioTransportista: string | null;
  motivoRechazoProveedor: string | null;
  motivoRechazoTransportista: string | null;
  correoEnviadoEn: string | null;
  correoTransportistaEnviadoEn: string | null;
};

export type Confirmacion = {
  id: number;
  lineaDistribucionId: number;
  parte: "proveedor" | "transportista";
  estado: EstadoConfirmacion;
  motivo: string | null;
  ts: string;
};

// ---------------------------------------------------------------------------
// Entradas reales
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Prosegur — importación automática
// ---------------------------------------------------------------------------

export type ProsegurImportStatus = "ok" | "error" | "partial";
export type ProsegurEntryStatus = "mapped" | "unmapped";

export type ProsegurImport = {
  id: number;
  filename: string;
  processedAt: string;
  status: ProsegurImportStatus;
  rowsTotal: number | null;
  rowsMapped: number | null;
  rowsUnmapped: number | null;
  errorMessage: string | null;
};

export type ProsegurEntry = {
  id: number;
  importId: number;
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  dni: string | null;
  nombre: string | null;
  tarjeta: string | null;
  tractora: string | null;
  remolque: string | null;
  materialRaw: string;
  destinoRaw: string | null;
  fullSeguimentNo: string | null;
  mappedMaterialId: number | null;
  mappedProveedorId: number | null;
  status: ProsegurEntryStatus;
};

export type ProsegurMaterialMap = {
  id: number;
  prosegurLabel: string;
  materialId: number;
  proveedorId: number;
  createdAt: string;
  updatedAt: string;
};

export type ParsedProsegurRow = {
  fecha: string;          // ISO date yyyy-mm-dd
  horaEntrada: string | null;
  horaSalida: string | null;
  dni: string | null;
  nombre: string | null;
  tarjeta: string | null;
  tractora: string | null;
  remolque: string | null;
  materialRaw: string;
  destinoRaw: string | null;
  fullSeguimentNo: string | null;
};

export type ImportResult = {
  filename: string;
  total: number;
  mapped: number;
  unmapped: number;
};

// ---------------------------------------------------------------------------
// Plantilla de horario
// ---------------------------------------------------------------------------

export type HorarioPlantillaSlot = {
  id: number;
  dia: DiaKey;
  franja: string;
  silo: "silo1" | "silo2";
  materialNom: string;
};

// ---------------------------------------------------------------------------
// Horario de llegadas
// ---------------------------------------------------------------------------

export type HorarioLlegada = {
  id: number;
  solicitudId: number;
  dia: DiaKey;
  franja: string;
  silo: "silo1" | "silo2";
  materialNom: string;
  creadoEn: string;
};

// ---------------------------------------------------------------------------
// Estado completo (equivale a CaState del frontend)
// ---------------------------------------------------------------------------

export type CaEstadoCompleto = {
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
