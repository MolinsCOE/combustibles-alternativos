export type HealthStatus = {
  status: "ok";
};

/**
 * Health check use case. Pure application layer — no I/O for now.
 * When real checks are added (DB ping, dependencies), they enter via
 * ports declared in the module's `domain/ports/`.
 */
export class GetHealthStatusUseCase {
  execute(): HealthStatus {
    return { status: "ok" };
  }
}
