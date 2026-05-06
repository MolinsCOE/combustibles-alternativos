import { describe, expect, it } from "vitest";
import { GetHealthStatusUseCase } from "../../src/modules/health/application/use-cases/get-health-status.use-case.js";

describe("GetHealthStatusUseCase", () => {
  it("returns ok status", () => {
    const useCase = new GetHealthStatusUseCase();
    expect(useCase.execute()).toEqual({ status: "ok" });
  });
});
