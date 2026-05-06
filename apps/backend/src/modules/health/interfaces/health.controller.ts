import type { RequestHandler } from "express";
import type { GetHealthStatusUseCase } from "../application/use-cases/get-health-status.use-case.js";

export class HealthController {
  constructor(private readonly getHealthStatus: GetHealthStatusUseCase) {}

  readonly get: RequestHandler = (_req, res) => {
    res.status(200).json(this.getHealthStatus.execute());
  };
}
