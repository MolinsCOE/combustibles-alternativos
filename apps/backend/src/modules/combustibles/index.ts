import { Router, type Router as ExpressRouter } from "express";
import type { Db } from "../../shared/infrastructure/db/client.js";
import type { Env } from "../../main/config/env.js";
import { GetEstadoCompletoUseCase } from "./application/use-cases/get-estado-completo.use-case.js";
import { GuardarBorradorUseCase } from "./application/use-cases/guardar-borrador.use-case.js";
import { EnviarSolicitudUseCase } from "./application/use-cases/enviar-solicitud.use-case.js";
import { IniciarDistribucionUseCase } from "./application/use-cases/iniciar-distribucion.use-case.js";
import { CrearLineaDistribucionUseCase } from "./application/use-cases/crear-linea-distribucion.use-case.js";
import { AplicarRepartoAutomaticoUseCase } from "./application/use-cases/aplicar-reparto-automatico.use-case.js";
import { EditarSolicitudUseCase } from "./application/use-cases/editar-solicitud.use-case.js";
import {
  ConfirmarLineaProveedorUseCase,
  ConfirmarLineaTransportistaUseCase,
  RechazarLineaProveedorUseCase,
  RechazarLineaTransportistaUseCase,
} from "./application/use-cases/confirmar-linea.use-case.js";
import { ReasignarLineaDistribucionUseCase } from "./application/use-cases/reasignar-linea.use-case.js";
import {
  EnviarCorreoLineaUseCase,
  EnviarCorreoTransportistaLineaUseCase,
} from "./application/use-cases/enviar-correo-linea.use-case.js";
import { CerrarProgramacionUseCase } from "./application/use-cases/cerrar-programacion.use-case.js";
import { UpdateLineaDistribucionUseCase } from "./application/use-cases/update-linea-distribucion.use-case.js";
import { EliminarLineaDistribucionUseCase } from "./application/use-cases/eliminar-linea-distribucion.use-case.js";
import {
  AddAsignacionUseCase,
  AddDestinoUseCase,
  AddMaterialUseCase,
  AddProveedorUseCase,
  DeleteAsignacionUseCase,
  ToggleDestinoUseCase,
  ToggleMaterialUseCase,
  ToggleProveedorUseCase,
  UpdateProveedorUseCase,
} from "./application/use-cases/maestros.use-cases.js";
import { AddEntradaRealUseCase } from "./application/use-cases/add-entrada-real.use-case.js";
import {
  CreatePlantillaDistribucionUseCase,
  DeletePlantillaDistribucionUseCase,
  GetPlantillaDistribucionUseCase,
} from "./application/use-cases/plantilla-distribucion.use-cases.js";
import {
  DeleteHorarioSlotUseCase,
  UpsertHorarioSlotUseCase,
} from "./application/use-cases/horario-llegada.use-cases.js";
import {
  DeleteHorarioPlantillaSlotUseCase,
  UpsertHorarioPlantillaSlotUseCase,
} from "./application/use-cases/horario-plantilla.use-cases.js";
import {
  DeleteMapUseCase,
  GetDailySummaryUseCase,
  GetMapsUseCase,
  GetProsegurImportDetailUseCase,
  GetProsegurImportsUseCase,
  GetUnmappedEntriesUseCase,
  GetWeeklySummaryUseCase,
  ImportProsegurFilesUseCase,
  MapEntryUseCase,
  RunProsegurImportUseCase,
  UpsertMapUseCase,
} from "./application/use-cases/prosegur.use-cases.js";
import {
  PostgresCombustiblesAsignacionesRepository,
  PostgresCombustiblesDestinosRepository,
  PostgresCombustiblesDistribucionRepository,
  PostgresCombustiblesEntradasRepository,
  PostgresCombustiblesHorarioPlantillaRepository,
  PostgresCombustiblesHorarioRepository,
  PostgresCombustiblesMaterialesRepository,
  PostgresCombustiblesPlantillaRepository,
  PostgresCombustiblesProveedoresRepository,
  PostgresCombustiblesReadRepository,
  PostgresCombustiblesSeedRepository,
  PostgresCombustiblesSolicitudesRepository,
} from "./infrastructure/postgres-combustibles.repository.js";
import {
  PostgresProsegurEntriesRepository,
  PostgresProsegurImportsRepository,
  PostgresProsegurMaterialMapRepository,
} from "./infrastructure/postgres-prosegur.repository.js";
import { parseProsegurDirectory } from "./infrastructure/prosegur/prosegur-excel.parser.js";
import { startProsegurCron } from "./infrastructure/cron/prosegur.cron.js";
import { CombustiblesController } from "./interfaces/combustibles.controller.js";
import { buildCombustiblesRouter } from "./interfaces/combustibles.routes.js";
import { combustiblesEmailRouter } from "./interfaces/email.routes.js";
import { ProsegurController } from "./interfaces/prosegur.controller.js";
import { buildProsegurRouter } from "./interfaces/prosegur.routes.js";

export type CombustiblesModule = {
  router: ExpressRouter;
  seed: PostgresCombustiblesSeedRepository;
};

/**
 * Builds the combustibles module. Called from the composition root.
 * Returns a single router with all combustibles endpoints.
 */
export function buildCombustiblesModule(db: Db, env: Env): CombustiblesModule {
  // ── Repositories ──────────────────────────────────────────────────────────
  const destinosRepo = new PostgresCombustiblesDestinosRepository(db);
  const materialesRepo = new PostgresCombustiblesMaterialesRepository(db);
  const proveedoresRepo = new PostgresCombustiblesProveedoresRepository(db);
  const asignacionesRepo = new PostgresCombustiblesAsignacionesRepository(db);
  const solicitudesRepo = new PostgresCombustiblesSolicitudesRepository(db);
  const distribucionRepo = new PostgresCombustiblesDistribucionRepository(db);
  const entradasRepo = new PostgresCombustiblesEntradasRepository(db);
  const plantillaRepo = new PostgresCombustiblesPlantillaRepository(db);
  const horarioRepo = new PostgresCombustiblesHorarioRepository(db);
  const horarioPlantillaRepo = new PostgresCombustiblesHorarioPlantillaRepository(db);
  const readRepo = new PostgresCombustiblesReadRepository(
    materialesRepo,
    destinosRepo,
    proveedoresRepo,
    asignacionesRepo,
    solicitudesRepo,
    distribucionRepo,
    entradasRepo,
    plantillaRepo,
    horarioRepo,
    horarioPlantillaRepo
  );
  const seedRepo = new PostgresCombustiblesSeedRepository(
    db,
    destinosRepo,
    materialesRepo,
    proveedoresRepo,
    asignacionesRepo,
    plantillaRepo
  );

  // ── Use cases ─────────────────────────────────────────────────────────────
  const getEstadoCompleto = new GetEstadoCompletoUseCase(readRepo);
  const guardarBorrador = new GuardarBorradorUseCase(solicitudesRepo);
  const enviarSolicitud = new EnviarSolicitudUseCase(solicitudesRepo);
  const iniciarDistribucion = new IniciarDistribucionUseCase(solicitudesRepo, horarioRepo, horarioPlantillaRepo);
  const crearLineaDistribucion = new CrearLineaDistribucionUseCase(
    solicitudesRepo,
    distribucionRepo
  );
  const aplicarRepartoAutomatico = new AplicarRepartoAutomaticoUseCase(
    solicitudesRepo,
    distribucionRepo,
    asignacionesRepo,
    proveedoresRepo
  );
  const editarSolicitud = new EditarSolicitudUseCase(
    solicitudesRepo,
    distribucionRepo
  );
  const confirmarLineaProveedor = new ConfirmarLineaProveedorUseCase(
    distribucionRepo,
    solicitudesRepo
  );
  const rechazarLineaProveedor = new RechazarLineaProveedorUseCase(
    distribucionRepo
  );
  const confirmarLineaTransportista = new ConfirmarLineaTransportistaUseCase(
    distribucionRepo,
    solicitudesRepo
  );
  const rechazarLineaTransportista = new RechazarLineaTransportistaUseCase(
    distribucionRepo
  );
  const reasignarLinea = new ReasignarLineaDistribucionUseCase(
    distribucionRepo,
    solicitudesRepo
  );
  const enviarCorreoLinea = new EnviarCorreoLineaUseCase(distribucionRepo);
  const enviarCorreoTransportistaLinea =
    new EnviarCorreoTransportistaLineaUseCase(distribucionRepo);
  const cerrarProgramacion = new CerrarProgramacionUseCase(solicitudesRepo);
  const updateLineaDistribucion = new UpdateLineaDistribucionUseCase(
    distribucionRepo
  );
  const eliminarLineaDistribucion = new EliminarLineaDistribucionUseCase(
    distribucionRepo
  );
  const addDestino = new AddDestinoUseCase(destinosRepo);
  const toggleDestino = new ToggleDestinoUseCase(destinosRepo);
  const addMaterial = new AddMaterialUseCase(materialesRepo);
  const toggleMaterial = new ToggleMaterialUseCase(materialesRepo);
  const addProveedor = new AddProveedorUseCase(proveedoresRepo);
  const updateProveedor = new UpdateProveedorUseCase(proveedoresRepo);
  const toggleProveedor = new ToggleProveedorUseCase(proveedoresRepo);
  const addAsignacion = new AddAsignacionUseCase(asignacionesRepo);
  const deleteAsignacion = new DeleteAsignacionUseCase(asignacionesRepo);
  const addEntradaReal = new AddEntradaRealUseCase(entradasRepo);
  const getPlantilla = new GetPlantillaDistribucionUseCase(plantillaRepo);
  const createPlantilla = new CreatePlantillaDistribucionUseCase(plantillaRepo);
  const deletePlantilla = new DeletePlantillaDistribucionUseCase(plantillaRepo);
  const upsertHorarioSlot = new UpsertHorarioSlotUseCase(horarioRepo);
  const deleteHorarioSlot = new DeleteHorarioSlotUseCase(horarioRepo);
  const upsertHorarioPlantillaSlot = new UpsertHorarioPlantillaSlotUseCase(horarioPlantillaRepo);
  const deleteHorarioPlantillaSlot = new DeleteHorarioPlantillaSlotUseCase(horarioPlantillaRepo);

  // ── Controller ────────────────────────────────────────────────────────────
  const controller = new CombustiblesController({
    getEstadoCompleto,
    addDestino,
    toggleDestino,
    guardarBorrador,
    enviarSolicitud,
    iniciarDistribucion,
    crearLineaDistribucion,
    aplicarRepartoAutomatico,
    editarSolicitud,
    confirmarLineaProveedor,
    rechazarLineaProveedor,
    confirmarLineaTransportista,
    rechazarLineaTransportista,
    reasignarLinea,
    enviarCorreoLinea,
    enviarCorreoTransportistaLinea,
    cerrarProgramacion,
    updateLineaDistribucion,
    eliminarLineaDistribucion,
    addMaterial,
    toggleMaterial,
    addProveedor,
    updateProveedor,
    toggleProveedor,
    addAsignacion,
    deleteAsignacion,
    addEntradaReal,
    getPlantilla,
    createPlantilla,
    deletePlantilla,
    upsertHorarioSlot,
    deleteHorarioSlot,
    upsertHorarioPlantillaSlot,
    deleteHorarioPlantillaSlot,
  });

  // ── Prosegur repositories ─────────────────────────────────────────────────
  const prosegurImportsRepo = new PostgresProsegurImportsRepository(db);
  const prosegurEntriesRepo = new PostgresProsegurEntriesRepository(db);
  const prosegurMapsRepo = new PostgresProsegurMaterialMapRepository(db);

  // ── Prosegur use cases ────────────────────────────────────────────────────
  const importProsegurFiles = new ImportProsegurFilesUseCase(
    prosegurImportsRepo,
    prosegurEntriesRepo,
    prosegurMapsRepo
  );
  const runImport = new RunProsegurImportUseCase(
    importProsegurFiles,
    parseProsegurDirectory
  );
  const getProsegurImports = new GetProsegurImportsUseCase(prosegurImportsRepo);
  const getProsegurImportDetail = new GetProsegurImportDetailUseCase(prosegurImportsRepo);
  const getUnmappedEntries = new GetUnmappedEntriesUseCase(prosegurEntriesRepo);
  const mapEntryUseCase = new MapEntryUseCase(prosegurEntriesRepo, prosegurMapsRepo);
  const getMaps = new GetMapsUseCase(prosegurMapsRepo);
  const upsertMap = new UpsertMapUseCase(prosegurMapsRepo);
  const deleteMap = new DeleteMapUseCase(prosegurMapsRepo);
  const getDailySummary = new GetDailySummaryUseCase(prosegurEntriesRepo);
  const getWeeklySummary = new GetWeeklySummaryUseCase(prosegurEntriesRepo);

  // ── Prosegur controller ───────────────────────────────────────────────────
  const watchDir = env.PROSEGUR_WATCH_DIR ?? "";
  const prosegurController = new ProsegurController({
    getProsegurImports,
    getProsegurImportDetail,
    getUnmappedEntries,
    mapEntry: mapEntryUseCase,
    getMaps,
    upsertMap,
    deleteMap,
    runImport,
    getDailySummary,
    getWeeklySummary,
    watchDir,
  });

  // ── Start cron (only if watchDir is configured) ───────────────────────────
  if (watchDir) {
    void startProsegurCron(runImport, watchDir, env.PROSEGUR_CRON_SCHEDULE);
  } else {
    console.log(
      "[prosegur] PROSEGUR_WATCH_DIR not set — cron job will not start."
    );
  }

  const router = Router();
  router.use(buildCombustiblesRouter(controller));
  router.use(combustiblesEmailRouter);
  router.use(buildProsegurRouter(prosegurController));

  return { router, seed: seedRepo };
}
