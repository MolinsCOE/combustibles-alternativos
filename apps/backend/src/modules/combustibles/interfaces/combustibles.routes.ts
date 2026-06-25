import { Router } from "express";
import { validate } from "../../../shared/interfaces/http/middleware/validate.js";
import type { CombustiblesController } from "./combustibles.controller.js";
import {
  addAsignacionSchema,
  addDestinoSchema,
  addEntradaRealSchema,
  addMaterialSchema,
  addProveedorSchema,
  confirmarLineaSchema,
  createPlantillaSchema,
  crearLineaDistribucionSchema,
  editarSolicitudSchema,
  enviarSolicitudSchema,
  guardarBorradorSchema,
  horarioPlantillaSlotIdParamSchema,
  horarioSlotIdParamSchema,
  idParamSchema,
  reasignarLineaSchema,
  rechazarLineaSchema,
  solicitudLineaParamSchema,
  updateLineaDistribucionSchema,
  updateProveedorSchema,
  upsertHorarioPlantillaSlotSchema,
  upsertHorarioSlotSchema,
} from "./combustibles.schemas.js";

export function buildCombustiblesRouter(
  controller: CombustiblesController
): Router {
  const r = Router();

  // ── SSE ──────────────────────────────────────────────────────────────────
  r.get("/api/combustibles/events", controller.events);

  // ── Estado completo ──────────────────────────────────────────────────────
  r.get("/api/combustibles/state", controller.getState);

  // ── Solicitudes ──────────────────────────────────────────────────────────
  r.post(
    "/api/combustibles/solicitudes/borrador",
    validate("body", guardarBorradorSchema),
    controller.guardarBorrador
  );
  r.post(
    "/api/combustibles/solicitudes/enviar",
    validate("body", enviarSolicitudSchema),
    controller.enviarSolicitud
  );
  r.post(
    "/api/combustibles/solicitudes/:id/iniciar-distribucion",
    validate("params", idParamSchema),
    controller.iniciarDistribucion
  );
  r.post(
    "/api/combustibles/solicitudes/:id/lineas/:lineaSolicitudId/distribucion",
    validate("params", solicitudLineaParamSchema),
    validate("body", crearLineaDistribucionSchema),
    controller.crearLineaDistribucion
  );
  r.post(
    "/api/combustibles/solicitudes/:id/lineas/:lineaSolicitudId/reparto-automatico",
    validate("params", solicitudLineaParamSchema),
    controller.aplicarRepartoAutomatico
  );
  r.patch(
    "/api/combustibles/solicitudes/:id/editar",
    validate("params", idParamSchema),
    validate("body", editarSolicitudSchema),
    controller.editarSolicitud
  );
  r.post(
    "/api/combustibles/solicitudes/:id/cerrar",
    validate("params", idParamSchema),
    controller.cerrarProgramacion
  );

  // ── Distribución ─────────────────────────────────────────────────────────
  r.patch(
    "/api/combustibles/distribucion/:id",
    validate("params", idParamSchema),
    validate("body", updateLineaDistribucionSchema),
    controller.updateLineaDistribucion
  );
  r.post(
    "/api/combustibles/distribucion/:id/confirmar-proveedor",
    validate("params", idParamSchema),
    validate("body", confirmarLineaSchema),
    controller.confirmarLineaProveedor
  );
  r.post(
    "/api/combustibles/distribucion/:id/rechazar-proveedor",
    validate("params", idParamSchema),
    validate("body", rechazarLineaSchema),
    controller.rechazarLineaProveedor
  );
  r.post(
    "/api/combustibles/distribucion/:id/confirmar-transportista",
    validate("params", idParamSchema),
    validate("body", confirmarLineaSchema),
    controller.confirmarLineaTransportista
  );
  r.post(
    "/api/combustibles/distribucion/:id/rechazar-transportista",
    validate("params", idParamSchema),
    validate("body", rechazarLineaSchema),
    controller.rechazarLineaTransportista
  );
  r.post(
    "/api/combustibles/distribucion/:id/reasignar",
    validate("params", idParamSchema),
    validate("body", reasignarLineaSchema),
    controller.reasignarLinea
  );
  r.post(
    "/api/combustibles/distribucion/:id/enviar-correo",
    validate("params", idParamSchema),
    controller.enviarCorreoLinea
  );
  r.post(
    "/api/combustibles/distribucion/:id/enviar-correo-transportista",
    validate("params", idParamSchema),
    controller.enviarCorreoTransportistaLinea
  );
  r.delete(
    "/api/combustibles/distribucion/:id",
    validate("params", idParamSchema),
    controller.eliminarLineaDistribucion
  );

  // ── Maestros: destinos ───────────────────────────────────────────────────
  r.post(
    "/api/combustibles/destinos",
    validate("body", addDestinoSchema),
    controller.addDestino
  );
  r.patch(
    "/api/combustibles/destinos/:id/toggle",
    validate("params", idParamSchema),
    controller.toggleDestino
  );

  // ── Maestros: materiales ─────────────────────────────────────────────────
  r.post(
    "/api/combustibles/materiales",
    validate("body", addMaterialSchema),
    controller.addMaterial
  );
  r.post(
    "/api/combustibles/materiales/:id/toggle",
    validate("params", idParamSchema),
    controller.toggleMaterial
  );

  // ── Maestros: proveedores ────────────────────────────────────────────────
  r.post(
    "/api/combustibles/proveedores",
    validate("body", addProveedorSchema),
    controller.addProveedor
  );
  r.patch(
    "/api/combustibles/proveedores/:id",
    validate("params", idParamSchema),
    validate("body", updateProveedorSchema),
    controller.updateProveedor
  );
  r.post(
    "/api/combustibles/proveedores/:id/toggle",
    validate("params", idParamSchema),
    controller.toggleProveedor
  );

  // ── Maestros: asignaciones ───────────────────────────────────────────────
  r.post(
    "/api/combustibles/asignaciones",
    validate("body", addAsignacionSchema),
    controller.addAsignacion
  );
  r.delete(
    "/api/combustibles/asignaciones/:id",
    validate("params", idParamSchema),
    controller.deleteAsignacion
  );

  // ── Entradas reales ──────────────────────────────────────────────────────
  r.post(
    "/api/combustibles/entradas-reales",
    validate("body", addEntradaRealSchema),
    controller.addEntradaReal
  );

  // ── Plantilla de distribución ─────────────────────────────────────────────
  r.get("/api/combustibles/plantilla", controller.getPlantilla);
  r.post(
    "/api/combustibles/plantilla",
    validate("body", createPlantillaSchema),
    controller.createPlantilla
  );
  r.delete(
    "/api/combustibles/plantilla/:id",
    validate("params", idParamSchema),
    controller.deletePlantilla
  );

  // ── Horario de llegadas ───────────────────────────────────────────────────
  r.put(
    "/api/combustibles/horario",
    validate("body", upsertHorarioSlotSchema),
    controller.upsertHorarioSlot
  );
  r.delete(
    "/api/combustibles/horario/:id/:slotId",
    validate("params", horarioSlotIdParamSchema),
    controller.deleteHorarioSlot
  );

  // ── Plantilla de horario ──────────────────────────────────────────────────
  r.put(
    "/api/combustibles/horario-plantilla",
    validate("body", upsertHorarioPlantillaSlotSchema),
    controller.upsertHorarioPlantillaSlot
  );
  r.delete(
    "/api/combustibles/horario-plantilla/:slotId",
    validate("params", horarioPlantillaSlotIdParamSchema),
    controller.deleteHorarioPlantillaSlot
  );

  return r;
}
