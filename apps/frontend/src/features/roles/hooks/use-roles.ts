import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "../../../shared/services/http-client.js";
import {
  rolesService,
  type RoleDetail,
  type RoleInput,
  type RoleList
} from "../services/roles.service.js";

export type ListState =
  | { kind: "loading" }
  | { kind: "ready"; data: RoleList }
  | { kind: "error"; message: string };

export type DetailState =
  | { kind: "loading" }
  | { kind: "ready"; data: RoleDetail }
  | { kind: "error"; message: string };

const GENERIC_ERROR =
  "No se ha podido completar la operación. Revisa tu conexión e inténtalo de nuevo.";

function errorMessage(err: unknown): string {
  if (err instanceof HttpError) {
    // El backend devuelve mensajes ya aptos para el usuario en 4xx.
    if (err.status >= 400 && err.status < 500) return err.message;
  }
  return GENERIC_ERROR;
}

export function useRolesList(page: number, pageSize: number) {
  const [state, setState] = useState<ListState>({ kind: "loading" });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });
    rolesService
      .list({ page, pageSize }, { signal: controller.signal })
      .then((data) => setState({ kind: "ready", data }))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setState({ kind: "error", message: errorMessage(cause) });
      });
    return () => controller.abort();
  }, [page, pageSize, nonce]);

  return { state, reload };
}

export function useRoleDetail(id: string | null) {
  const [state, setState] = useState<DetailState>({ kind: "loading" });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setState({ kind: "loading" });
    rolesService
      .detail(id, { signal: controller.signal })
      .then((data) => setState({ kind: "ready", data }))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setState({ kind: "error", message: errorMessage(cause) });
      });
    return () => controller.abort();
  }, [id, nonce]);

  return { state, reload };
}

type MutationState = {
  pending: boolean;
  error: string | null;
};

export function useRoleMutations() {
  const [state, setState] = useState<MutationState>({
    pending: false,
    error: null
  });
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const run = useCallback(async <T,>(op: () => Promise<T>): Promise<T | null> => {
    setState({ pending: true, error: null });
    try {
      const result = await op();
      if (aliveRef.current) setState({ pending: false, error: null });
      return result;
    } catch (cause: unknown) {
      const message = errorMessage(cause);
      if (aliveRef.current) setState({ pending: false, error: message });
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    pending: state.pending,
    error: state.error,
    clearError,
    create: (input: RoleInput) => run(() => rolesService.create(input)),
    update: (id: string, input: RoleInput) =>
      run(() => rolesService.update(id, input)),
    remove: (id: string) => run(() => rolesService.remove(id))
  };
}
