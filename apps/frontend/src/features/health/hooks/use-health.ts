import { useEffect, useState } from "react";
import { healthService, type HealthStatus } from "../services/health.service.js";

type HealthState =
  | { kind: "loading" }
  | { kind: "ready"; data: HealthStatus }
  | { kind: "error"; message: string };

export function useHealth(): HealthState {
  const [state, setState] = useState<HealthState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    healthService
      .fetchStatus({ signal: controller.signal })
      .then((data) => {
        setState({ kind: "ready", data });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }
        setState({ kind: "error", message: "Could not reach the backend." });
      });
    return () => {
      controller.abort();
    };
  }, []);

  return state;
}
