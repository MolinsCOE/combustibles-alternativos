/**
 * Servicio HTTP para el módulo de Combustibles Alternativos.
 * Define schemas Zod que validan las respuestas del backend y expone
 * funciones tipadas para cada operación.
 */
import { z } from "zod";
import { httpClient } from "../../../shared/services/http-client.js";

const BASE = "/api/combustibles";

// ---------------------------------------------------------------------------
// Schemas de respuesta (mirroring domain entities)
// ---------------------------------------------------------------------------

const destinoSchema = z.object({
  id: z.number(),
  nom: z.string(),
  activo: z.boolean(),
});

const materialSchema = z.object({
  id: z.number(),
  nom: z.string(),
  activo: z.boolean(),
});

const proveedorSchema = z.object({
  id: z.number(),
  nom: z.string(),
  tipus: z.enum(["proveedor", "transportista", "ambos"]),
  emails: z.array(z.string()),
  bcc: z.array(z.string()),
  activo: z.boolean(),
});

const asignacionSchema = z.object({
  id: z.number(),
  materialId: z.number(),
  proveedorId: z.number(),
  transportistaId: z.number(),
  pct: z.number(),
});

const plantillaDistribucionSchema = z.object({
  id: z.number(),
  materialId: z.number(),
  materialNom: z.string(),
  destino: z.string(),
  activo: z.boolean(),
  createdAt: z.string(),
});

const lineaSolicitudSchema = z.object({
  id: z.number(),
  solicitudId: z.number(),
  materialId: z.number(),
  materialNom: z.string(),
  dl: z.number(),
  dt: z.number(),
  dc: z.number(),
  dj: z.number(),
  dv: z.number(),
  ds: z.number(),
  dg: z.number(),
  destino: z.string(),
  obs: z.string(),
});

const cambioHistorialSchema = z.object({
  id: z.number(),
  solicitudId: z.number(),
  ts: z.string(),
  autor: z.enum(["produccion", "compras"]),
  motivo: z.string(),
  descripcion: z.string(),
});

const solicitudSchema = z.object({
  id: z.number(),
  semana: z.string(),
  ini: z.string(),
  fi: z.string(),
  creadaPor: z.string(),
  estado: z.enum(["borrador", "enviada", "en_distribucion", "confirmada", "cerrada"]),
  comentarioGeneral: z.string(),
  mantenimientosProgramados: z.string(),
  ts: z.string(),
  lineas: z.array(lineaSolicitudSchema),
  historial: z.array(cambioHistorialSchema),
});

const cantidadesDiasSchema = z
  .object({
    dl: z.number(),
    dt: z.number(),
    dc: z.number(),
    dj: z.number(),
    dv: z.number(),
    ds: z.number(),
    dg: z.number(),
  })
  .partial()
  .nullable();

const lineaDistribucionSchema = z.object({
  id: z.number(),
  solicitudId: z.number(),
  lineaSolicitudId: z.number(),
  materialId: z.number(),
  materialNom: z.string(),
  proveedorId: z.number(),
  proveedorNom: z.string(),
  transportistaId: z.number(),
  transportistaNom: z.string(),
  destino: z.string(),
  dl: z.number(),
  dt: z.number(),
  dc: z.number(),
  dj: z.number(),
  dv: z.number(),
  ds: z.number(),
  dg: z.number(),
  estado: z.enum(["pendiente", "enviada", "confirmada", "rechazada"]),
  confirmacionProveedor: z.enum(["pendiente", "confirmada", "rechazada"]),
  confirmacionTransportista: z.enum(["pendiente", "confirmada", "rechazada"]),
  cantidadesProveedor: cantidadesDiasSchema,
  comentarioProveedor: z.string().nullable(),
  cantidadesTransportista: cantidadesDiasSchema,
  comentarioTransportista: z.string().nullable(),
  motivoRechazoProveedor: z.string().nullable(),
  motivoRechazoTransportista: z.string().nullable(),
  correoEnviadoEn: z.string().nullable(),
  correoTransportistaEnviadoEn: z.string().nullable(),
});

const confirmacionSchema = z.object({
  id: z.number(),
  lineaDistribucionId: z.number(),
  parte: z.enum(["proveedor", "transportista"]),
  estado: z.enum(["pendiente", "confirmada", "rechazada"]),
  motivo: z.string().nullable(),
  ts: z.string(),
});

const entradaRealSchema = z.object({
  id: z.number(),
  solicitudId: z.number().nullable(),
  fecha: z.string(),
  materialId: z.number(),
  materialNom: z.string(),
  proveedorId: z.number(),
  proveedorNom: z.string(),
  transportistaId: z.number(),
  transportistaNom: z.string(),
  viajes: z.number(),
  destino: z.string(),
  obs: z.string(),
});

const horarioLlegadaSchema = z.object({
  id: z.number(),
  solicitudId: z.number(),
  dia: z.enum(["dl", "dt", "dc", "dj", "dv", "ds", "dg"]),
  franja: z.string(),
  silo: z.enum(["silo1", "silo2"]),
  materialNom: z.string(),
  creadoEn: z.string(),
});

const horarioPlantillaSlotSchema = z.object({
  id: z.number(),
  dia: z.enum(["dl", "dt", "dc", "dj", "dv", "ds", "dg"]),
  franja: z.string(),
  silo: z.enum(["silo1", "silo2"]),
  materialNom: z.string(),
});

export const estadoCompletoSchema = z.object({
  solicitudes: z.array(solicitudSchema),
  distribucion: z.array(lineaDistribucionSchema),
  confirmaciones: z.array(confirmacionSchema),
  entradasReales: z.array(entradaRealSchema),
  materiales: z.array(materialSchema),
  destinos: z.array(destinoSchema),
  proveedores: z.array(proveedorSchema),
  asignaciones: z.array(asignacionSchema),
  plantillaDistribucion: z.array(plantillaDistribucionSchema),
  horarioLlegadas: z.array(horarioLlegadaSchema),
  horarioPlantilla: z.array(horarioPlantillaSlotSchema),
});

export type EstadoCompleto = z.infer<typeof estadoCompletoSchema>;
export type DestinoApi = z.infer<typeof destinoSchema>;
export type MaterialApi = z.infer<typeof materialSchema>;
export type ProveedorApi = z.infer<typeof proveedorSchema>;
export type AsignacionApi = z.infer<typeof asignacionSchema>;
export type PlantillaDistribucionApi = z.infer<typeof plantillaDistribucionSchema>;
export type LineaSolicitudApi = z.infer<typeof lineaSolicitudSchema>;
export type CambioHistorialApi = z.infer<typeof cambioHistorialSchema>;
export type SolicitudApi = z.infer<typeof solicitudSchema>;
export type LineaDistribucionApi = z.infer<typeof lineaDistribucionSchema>;
export type ConfirmacionApi = z.infer<typeof confirmacionSchema>;
export type EntradaRealApi = z.infer<typeof entradaRealSchema>;
export type HorarioLlegadaApi = z.infer<typeof horarioLlegadaSchema>;
export type HorarioPlantillaSlotApi = z.infer<typeof horarioPlantillaSlotSchema>;

// ---------------------------------------------------------------------------
// Input types (lo que se envía al backend)
// ---------------------------------------------------------------------------

type LineaSolicitudInput = {
  id?: number;
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

type GuardarBorradorInput = {
  id?: number;
  semana: string;
  ini: string;
  fi: string;
  creadaPor: string;
  comentarioGeneral: string;
  mantenimientosProgramados: string;
  lineas: LineaSolicitudInput[];
};

type ConfirmarLineaInput = {
  comentario?: string | null;
  cantidades?: Partial<Record<string, number>>;
};

type ReasignarLineaInput = {
  solicitudId: number;
  proveedorId?: number;
  proveedorNom?: string;
  transportistaId?: number;
  transportistaNom?: string;
  motivo: string;
};

type CrearLineaDistribucionInput = {
  proveedorId: number;
  proveedorNom: string;
  transportistaId: number;
  transportistaNom: string;
  destino?: string;
  dl: number;
  dt: number;
  dc: number;
  dj: number;
  dv: number;
  ds: number;
  dg: number;
};

type UpdateLineaDistribucionInput = {
  proveedorId?: number;
  proveedorNom?: string;
  transportistaId?: number;
  transportistaNom?: string;
  destino?: string;
  dl?: number;
  dt?: number;
  dc?: number;
  dj?: number;
  dv?: number;
  ds?: number;
  dg?: number;
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const combustiblesService = {
  // Estado completo
  getState: () =>
    httpClient.get(`${BASE}/state`, estadoCompletoSchema),

  // Solicitudes
  guardarBorrador: (input: GuardarBorradorInput) =>
    httpClient.post(`${BASE}/solicitudes/borrador`, input, solicitudSchema),

  enviarSolicitud: (input: GuardarBorradorInput) =>
    httpClient.post(`${BASE}/solicitudes/enviar`, input, solicitudSchema),

  iniciarDistribucion: (id: number) =>
    httpClient.post(`${BASE}/solicitudes/${id}/iniciar-distribucion`, {}, solicitudSchema),

  crearLineaDistribucion: (
    solicitudId: number,
    lineaSolicitudId: number,
    data: CrearLineaDistribucionInput
  ) =>
    httpClient.post(
      `${BASE}/solicitudes/${solicitudId}/lineas/${lineaSolicitudId}/distribucion`,
      data,
      lineaDistribucionSchema
    ),

  aplicarRepartoAutomatico: (solicitudId: number, lineaSolicitudId: number) =>
    httpClient.post(
      `${BASE}/solicitudes/${solicitudId}/lineas/${lineaSolicitudId}/reparto-automatico`,
      {},
      z.array(lineaDistribucionSchema)
    ),

  editarSolicitud: (
    id: number,
    data: {
      lineas: Array<{
        id: number;
        dl: number; dt: number; dc: number; dj: number; dv: number; ds: number; dg: number;
        destino?: string;
      }>;
      motivo: string;
      comentarioGeneral?: string;
      mantenimientosProgramados?: string;
    }
  ) => httpClient.patch(`${BASE}/solicitudes/${id}/editar`, data, solicitudSchema),

  cerrarProgramacion: (id: number) =>
    httpClient.post(`${BASE}/solicitudes/${id}/cerrar`, {}, z.unknown()),

  // Distribución
  updateLineaDistribucion: (id: number, data: UpdateLineaDistribucionInput) =>
    httpClient.patch(`${BASE}/distribucion/${id}`, data, lineaDistribucionSchema),

  eliminarLineaDistribucion: (id: number) =>
    httpClient.delete(`${BASE}/distribucion/${id}`),

  confirmarLineaProveedor: (id: number, data: ConfirmarLineaInput) =>
    httpClient.post(`${BASE}/distribucion/${id}/confirmar-proveedor`, data, lineaDistribucionSchema),

  rechazarLineaProveedor: (id: number, motivo: string) =>
    httpClient.post(`${BASE}/distribucion/${id}/rechazar-proveedor`, { motivo }, lineaDistribucionSchema),

  confirmarLineaTransportista: (id: number, data: ConfirmarLineaInput) =>
    httpClient.post(`${BASE}/distribucion/${id}/confirmar-transportista`, data, lineaDistribucionSchema),

  rechazarLineaTransportista: (id: number, motivo: string) =>
    httpClient.post(`${BASE}/distribucion/${id}/rechazar-transportista`, { motivo }, lineaDistribucionSchema),

  reasignarLinea: (id: number, data: ReasignarLineaInput) =>
    httpClient.post(`${BASE}/distribucion/${id}/reasignar`, data, lineaDistribucionSchema),

  enviarCorreoLinea: (id: number) =>
    httpClient.post(`${BASE}/distribucion/${id}/enviar-correo`, {}, lineaDistribucionSchema),

  enviarCorreoTransportistaLinea: (id: number) =>
    httpClient.post(`${BASE}/distribucion/${id}/enviar-correo-transportista`, {}, lineaDistribucionSchema),

  // Maestros — materiales
  addMaterial: (nom: string) =>
    httpClient.post(`${BASE}/materiales`, { nom }, materialSchema),

  toggleMaterial: (id: number) =>
    httpClient.post(`${BASE}/materiales/${id}/toggle`, {}, materialSchema),

  // Maestros — proveedores
  addProveedor: (data: { nom: string; tipus: "proveedor" | "transportista" | "ambos"; emails: string[]; bcc: string[] }) =>
    httpClient.post(`${BASE}/proveedores`, data, proveedorSchema),

  updateProveedor: (id: number, data: { nom?: string; tipus?: "proveedor" | "transportista" | "ambos"; emails?: string[]; bcc?: string[] }) =>
    httpClient.patch(`${BASE}/proveedores/${id}`, data, proveedorSchema),

  toggleProveedor: (id: number) =>
    httpClient.post(`${BASE}/proveedores/${id}/toggle`, {}, proveedorSchema),

  // Maestros — asignaciones
  addAsignacion: (data: { materialId: number; proveedorId: number; transportistaId: number; pct: number }) =>
    httpClient.post(`${BASE}/asignaciones`, data, asignacionSchema),

  deleteAsignacion: (id: number) =>
    httpClient.delete(`${BASE}/asignaciones/${id}`),

  // Maestros — destinos
  addDestino: (nom: string) =>
    httpClient.post(`${BASE}/destinos`, { nom }, destinoSchema),

  toggleDestino: (id: number) =>
    httpClient.patch(`${BASE}/destinos/${id}/toggle`, {}, destinoSchema),

  // Entradas reales
  addEntradaReal: (data: {
    solicitudId?: number | null;
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
  }) => httpClient.post(`${BASE}/entradas-reales`, data, entradaRealSchema),

  // Horario de llegadas
  upsertHorarioSlot: (data: {
    solicitudId: number;
    dia: "dl" | "dt" | "dc" | "dj" | "dv" | "ds" | "dg";
    franja: string;
    silo: "silo1" | "silo2";
    materialNom: string;
  }) => httpClient.put(`${BASE}/horario`, data, horarioLlegadaSchema),

  deleteHorarioSlot: (solicitudId: number, slotId: number) =>
    httpClient.delete(`${BASE}/horario/${solicitudId}/${slotId}`),

  // Comparativa planificado vs Prosegur
  getComparativa: (solicitudId: number) =>
    httpClient.get(
      `${BASE}/solicitudes/${solicitudId}/comparativa`,
      z.array(z.object({
        materialId: z.number(),
        materialNom: z.string(),
        proveedorId: z.number(),
        proveedorNom: z.string(),
        dias: z.array(z.object({
          fecha: z.string(),
          diaKey: z.enum(["dl","dt","dc","dj","dv","ds","dg"]),
          planificado: z.number(),
          real: z.number(),
          desviacion: z.number(),
        })),
        totalPlanificado: z.number(),
        totalReal: z.number(),
      }))
    ),

  // Plantilla de horario
  upsertHorarioPlantillaSlot: (data: {
    dia: "dl" | "dt" | "dc" | "dj" | "dv" | "ds" | "dg";
    franja: string;
    silo: "silo1" | "silo2";
    materialNom: string;
  }) => httpClient.put(`${BASE}/horario-plantilla`, data, horarioPlantillaSlotSchema),

  deleteHorarioPlantillaSlot: (slotId: number) =>
    httpClient.delete(`${BASE}/horario-plantilla/${slotId}`),
};
