import type { RequestHandler } from "express";
import type { GetEstadoCompletoUseCase } from "../application/use-cases/get-estado-completo.use-case.js";
import type { GuardarBorradorUseCase } from "../application/use-cases/guardar-borrador.use-case.js";
import type { EnviarSolicitudUseCase } from "../application/use-cases/enviar-solicitud.use-case.js";
import type { IniciarDistribucionUseCase } from "../application/use-cases/iniciar-distribucion.use-case.js";
import type { EditarSolicitudUseCase } from "../application/use-cases/editar-solicitud.use-case.js";
import type { CrearLineaDistribucionUseCase } from "../application/use-cases/crear-linea-distribucion.use-case.js";
import type { AplicarRepartoAutomaticoUseCase } from "../application/use-cases/aplicar-reparto-automatico.use-case.js";
import type {
  ConfirmarLineaProveedorUseCase,
  ConfirmarLineaTransportistaUseCase,
  RechazarLineaProveedorUseCase,
  RechazarLineaTransportistaUseCase,
} from "../application/use-cases/confirmar-linea.use-case.js";
import type { ReasignarLineaDistribucionUseCase } from "../application/use-cases/reasignar-linea.use-case.js";
import type {
  EnviarCorreoLineaUseCase,
  EnviarCorreoTransportistaLineaUseCase,
} from "../application/use-cases/enviar-correo-linea.use-case.js";
import type { CerrarProgramacionUseCase } from "../application/use-cases/cerrar-programacion.use-case.js";
import type { UpdateLineaDistribucionUseCase } from "../application/use-cases/update-linea-distribucion.use-case.js";
import type { EliminarLineaDistribucionUseCase } from "../application/use-cases/eliminar-linea-distribucion.use-case.js";
import type {
  AddDestinoUseCase,
  ToggleDestinoUseCase,
  AddMaterialUseCase,
  ToggleMaterialUseCase,
  AddProveedorUseCase,
  UpdateProveedorUseCase,
  ToggleProveedorUseCase,
  AddAsignacionUseCase,
  DeleteAsignacionUseCase,
} from "../application/use-cases/maestros.use-cases.js";
import type { AddEntradaRealUseCase } from "../application/use-cases/add-entrada-real.use-case.js";
import type {
  CreatePlantillaDistribucionUseCase,
  DeletePlantillaDistribucionUseCase,
  GetPlantillaDistribucionUseCase,
} from "../application/use-cases/plantilla-distribucion.use-cases.js";
import type {
  DeleteHorarioSlotUseCase,
  UpsertHorarioSlotUseCase,
} from "../application/use-cases/horario-llegada.use-cases.js";
import type {
  DeleteHorarioPlantillaSlotUseCase,
  UpsertHorarioPlantillaSlotUseCase,
} from "../application/use-cases/horario-plantilla.use-cases.js";
import type { GetComparativaUseCase } from "../application/use-cases/comparativa.use-case.js";
import type {
  AddDestinoBody,
  ConfirmarLineaBody,
  CreatePlantillaBody,
  EditarSolicitudBody,
  EnviarSolicitudBody,
  GuardarBorradorBody,
  HorarioPlantillaSlotIdParam,
  HorarioSlotIdParam,
  IdParam,
  ReasignarLineaBody,
  RechazarLineaBody,
  UpdateLineaDistribucionBody,
  AddMaterialBody,
  AddProveedorBody,
  UpdateProveedorBody,
  AddAsignacionBody,
  AddEntradaRealBody,
  CrearLineaDistribucionBody,
  SolicitudLineaParam,
  UpsertHorarioPlantillaSlotBody,
  UpsertHorarioSlotBody,
} from "./combustibles.schemas.js";
import { sseManager } from "./sse-manager.js";

export type CombustiblesControllerDeps = {
  getEstadoCompleto: GetEstadoCompletoUseCase;
  addDestino: AddDestinoUseCase;
  toggleDestino: ToggleDestinoUseCase;
  guardarBorrador: GuardarBorradorUseCase;
  enviarSolicitud: EnviarSolicitudUseCase;
  iniciarDistribucion: IniciarDistribucionUseCase;
  crearLineaDistribucion: CrearLineaDistribucionUseCase;
  aplicarRepartoAutomatico: AplicarRepartoAutomaticoUseCase;
  editarSolicitud: EditarSolicitudUseCase;
  confirmarLineaProveedor: ConfirmarLineaProveedorUseCase;
  rechazarLineaProveedor: RechazarLineaProveedorUseCase;
  confirmarLineaTransportista: ConfirmarLineaTransportistaUseCase;
  rechazarLineaTransportista: RechazarLineaTransportistaUseCase;
  reasignarLinea: ReasignarLineaDistribucionUseCase;
  enviarCorreoLinea: EnviarCorreoLineaUseCase;
  enviarCorreoTransportistaLinea: EnviarCorreoTransportistaLineaUseCase;
  cerrarProgramacion: CerrarProgramacionUseCase;
  updateLineaDistribucion: UpdateLineaDistribucionUseCase;
  eliminarLineaDistribucion: EliminarLineaDistribucionUseCase;
  addMaterial: AddMaterialUseCase;
  toggleMaterial: ToggleMaterialUseCase;
  addProveedor: AddProveedorUseCase;
  updateProveedor: UpdateProveedorUseCase;
  toggleProveedor: ToggleProveedorUseCase;
  addAsignacion: AddAsignacionUseCase;
  deleteAsignacion: DeleteAsignacionUseCase;
  addEntradaReal: AddEntradaRealUseCase;
  getPlantilla: GetPlantillaDistribucionUseCase;
  createPlantilla: CreatePlantillaDistribucionUseCase;
  deletePlantilla: DeletePlantillaDistribucionUseCase;
  upsertHorarioSlot: UpsertHorarioSlotUseCase;
  deleteHorarioSlot: DeleteHorarioSlotUseCase;
  upsertHorarioPlantillaSlot: UpsertHorarioPlantillaSlotUseCase;
  deleteHorarioPlantillaSlot: DeleteHorarioPlantillaSlotUseCase;
  getComparativa: GetComparativaUseCase;
};

export class CombustiblesController {
  constructor(private readonly deps: CombustiblesControllerDeps) {}

  // ── SSE ──────────────────────────────────────────────────────────────────

  readonly events: RequestHandler = (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    sseManager.subscribe(res);

    // Keep-alive ping every 30 s
    const ping = globalThis.setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch {
        globalThis.clearInterval(ping);
      }
    }, 30_000);

    req.on("close", () => globalThis.clearInterval(ping));
  };

  // ── Estado completo ──────────────────────────────────────────────────────

  readonly getState: RequestHandler = async (_req, res, next) => {
    try {
      const estado = await this.deps.getEstadoCompleto.execute();
      res.status(200).json(estado);
    } catch (err) {
      next(err);
    }
  };

  // ── Maestros: destinos ────────────────────────────────────────────────────

  readonly addDestino: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as AddDestinoBody;
      const result = await this.deps.addDestino.execute(body);
      sseManager.notifyAll();
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly toggleDestino: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const result = await this.deps.toggleDestino.execute(id);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // ── Solicitudes ──────────────────────────────────────────────────────────

  readonly guardarBorrador: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as GuardarBorradorBody;
      const result = await this.deps.guardarBorrador.execute(body);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly enviarSolicitud: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as EnviarSolicitudBody;
      const result = await this.deps.enviarSolicitud.execute(body);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly iniciarDistribucion: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const result = await this.deps.iniciarDistribucion.execute(id);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly crearLineaDistribucion: RequestHandler = async (req, res, next) => {
    try {
      const { id, lineaSolicitudId } = req.params as unknown as SolicitudLineaParam;
      const body = req.body as CrearLineaDistribucionBody;
      const result = await this.deps.crearLineaDistribucion.execute({
        solicitudId: id,
        lineaSolicitudId,
        proveedorId: body.proveedorId,
        proveedorNom: body.proveedorNom,
        transportistaId: body.transportistaId,
        transportistaNom: body.transportistaNom,
        destino: body.destino,
        dl: body.dl,
        dt: body.dt,
        dc: body.dc,
        dj: body.dj,
        dv: body.dv,
        ds: body.ds,
        dg: body.dg,
      });
      sseManager.notifyAll();
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly aplicarRepartoAutomatico: RequestHandler = async (req, res, next) => {
    try {
      const { id, lineaSolicitudId } = req.params as unknown as SolicitudLineaParam;
      const result = await this.deps.aplicarRepartoAutomatico.execute(id, lineaSolicitudId);
      sseManager.notifyAll();
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly editarSolicitud: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const body = req.body as EditarSolicitudBody;
      const result = await this.deps.editarSolicitud.execute({
        solicitudId: id,
        lineas: body.lineas,
        motivo: body.motivo,
      });
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly cerrarProgramacion: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      await this.deps.cerrarProgramacion.execute(id);
      sseManager.notifyAll();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ── Distribución ─────────────────────────────────────────────────────────

  readonly updateLineaDistribucion: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const body = req.body as UpdateLineaDistribucionBody;
      const result = await this.deps.updateLineaDistribucion.execute(id, body);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly eliminarLineaDistribucion: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      await this.deps.eliminarLineaDistribucion.execute(id);
      sseManager.notifyAll();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  readonly confirmarLineaProveedor: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const body = req.body as ConfirmarLineaBody;
      const result = await this.deps.confirmarLineaProveedor.execute({
        lineaId: id,
        comentario: body.comentario,
        cantidades: body.cantidades,
      });
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly rechazarLineaProveedor: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const body = req.body as RechazarLineaBody;
      const result = await this.deps.rechazarLineaProveedor.execute({
        lineaId: id,
        motivo: body.motivo,
      });
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly confirmarLineaTransportista: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const body = req.body as ConfirmarLineaBody;
      const result = await this.deps.confirmarLineaTransportista.execute({
        lineaId: id,
        comentario: body.comentario,
        cantidades: body.cantidades,
      });
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly rechazarLineaTransportista: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const body = req.body as RechazarLineaBody;
      const result = await this.deps.rechazarLineaTransportista.execute({
        lineaId: id,
        motivo: body.motivo,
      });
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly reasignarLinea: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const body = req.body as ReasignarLineaBody;
      const result = await this.deps.reasignarLinea.execute({
        lineaId: id,
        solicitudId: body.solicitudId,
        proveedorId: body.proveedorId,
        proveedorNom: body.proveedorNom,
        transportistaId: body.transportistaId,
        transportistaNom: body.transportistaNom,
        motivo: body.motivo,
      });
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly enviarCorreoLinea: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const result = await this.deps.enviarCorreoLinea.execute(id);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly enviarCorreoTransportistaLinea: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const result = await this.deps.enviarCorreoTransportistaLinea.execute(id);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // ── Maestros ─────────────────────────────────────────────────────────────

  readonly addMaterial: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as AddMaterialBody;
      const result = await this.deps.addMaterial.execute(body);
      sseManager.notifyAll();
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly toggleMaterial: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const result = await this.deps.toggleMaterial.execute(id);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly addProveedor: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as AddProveedorBody;
      const result = await this.deps.addProveedor.execute(body);
      sseManager.notifyAll();
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly updateProveedor: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const body = req.body as UpdateProveedorBody;
      const result = await this.deps.updateProveedor.execute(id, body);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly toggleProveedor: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const result = await this.deps.toggleProveedor.execute(id);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly addAsignacion: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as AddAsignacionBody;
      const result = await this.deps.addAsignacion.execute(body);
      sseManager.notifyAll();
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly deleteAsignacion: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      await this.deps.deleteAsignacion.execute(id);
      sseManager.notifyAll();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ── Entradas reales ──────────────────────────────────────────────────────

  readonly addEntradaReal: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as AddEntradaRealBody;
      const result = await this.deps.addEntradaReal.execute({
        solicitudId: body.solicitudId ?? null,
        fecha: body.fecha,
        materialId: body.materialId,
        materialNom: body.materialNom,
        proveedorId: body.proveedorId,
        proveedorNom: body.proveedorNom,
        transportistaId: body.transportistaId,
        transportistaNom: body.transportistaNom,
        viajes: body.viajes,
        destino: body.destino,
        obs: body.obs,
      });
      sseManager.notifyAll();
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  // ── Plantilla de distribución ─────────────────────────────────────────────

  readonly getPlantilla: RequestHandler = async (_req, res, next) => {
    try {
      const result = await this.deps.getPlantilla.execute();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly createPlantilla: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as CreatePlantillaBody;
      const result = await this.deps.createPlantilla.execute(body);
      sseManager.notifyAll();
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly deletePlantilla: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      await this.deps.deletePlantilla.execute(id);
      sseManager.notifyAll();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ── Horario de llegadas ───────────────────────────────────────────────────

  readonly upsertHorarioSlot: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as UpsertHorarioSlotBody;
      const result = await this.deps.upsertHorarioSlot.execute(body);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly deleteHorarioSlot: RequestHandler = async (req, res, next) => {
    try {
      const { slotId } = req.params as unknown as HorarioSlotIdParam;
      await this.deps.deleteHorarioSlot.execute(slotId);
      sseManager.notifyAll();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ── Plantilla de horario ──────────────────────────────────────────────────

  readonly upsertHorarioPlantillaSlot: RequestHandler = async (req, res, next) => {
    try {
      const body = req.body as UpsertHorarioPlantillaSlotBody;
      const result = await this.deps.upsertHorarioPlantillaSlot.execute(body);
      sseManager.notifyAll();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  readonly deleteHorarioPlantillaSlot: RequestHandler = async (req, res, next) => {
    try {
      const { slotId } = req.params as unknown as HorarioPlantillaSlotIdParam;
      await this.deps.deleteHorarioPlantillaSlot.execute(slotId);
      sseManager.notifyAll();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // ── Comparativa planificado vs Prosegur ──────────────────────────────────

  readonly getComparativa: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const result = await this.deps.getComparativa.execute(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
