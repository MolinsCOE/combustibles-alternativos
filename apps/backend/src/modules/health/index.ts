import { GetHealthStatusUseCase } from "./application/use-cases/get-health-status.use-case.js";
import { HealthController } from "./interfaces/health.controller.js";
import { buildHealthRouter } from "./interfaces/health.routes.js";

/**
 * Builds the health module's Express router. Called from the composition root.
 * The health module has no persistence for now — it is the minimum viable
 * example of the hexagonal structure.
 */
export function buildHealthModule() {
  const useCase = new GetHealthStatusUseCase();
  const controller = new HealthController(useCase);
  return buildHealthRouter(controller);
}
