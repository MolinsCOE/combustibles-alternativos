import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "../../../shared/services/http-client.js";
import {
  usersService,
  type UserInput,
  type UserList,
  type UserWithRole
} from "../services/users.service.js";
import { rolesService, type Role } from "../../roles/services/roles.service.js";

export type UsersListState =
  | { kind: "loading" }
  | { kind: "ready"; data: UserList }
  | { kind: "error"; message: string };

export type UserDetailState =
  | { kind: "loading" }
  | { kind: "ready"; data: UserWithRole }
  | { kind: "error"; message: string };

export type RolesOptionsState =
  | { kind: "loading" }
  | { kind: "ready"; data: Role[] }
  | { kind: "error"; message: string };

const GENERIC_ERROR =
  "No se ha podido completar la operación. Revisa tu conexión e inténtalo de nuevo.";

function errorMessage(err: unknown): string {
  if (err instanceof HttpError) {
    if (err.status >= 400 && err.status < 500) return err.message;
  }
  return GENERIC_ERROR;
}

export function useUsersList(page: number, pageSize: number) {
  const [state, setState] = useState<UsersListState>({ kind: "loading" });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });
    usersService
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

export function useUserDetail(id: string | null) {
  const [state, setState] = useState<UserDetailState>({ kind: "loading" });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setState({ kind: "loading" });
    usersService
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

/**
 * Loads the full list of roles (up to 100) for the rol selector in the
 * user form. Paginated, but the form only needs existing roles to pick
 * from, so a single page with a generous size is enough for this phase.
 */
export function useRolesOptions() {
  const [state, setState] = useState<RolesOptionsState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });
    rolesService
      .list({ page: 1, pageSize: 100 }, { signal: controller.signal })
      .then((data) =>
        setState({
          kind: "ready",
          data: data.items.map((r) => ({
            id: r.id,
            nombre: r.nombre,
            descripcion: r.descripcion,
            fechaCreacion: r.fechaCreacion,
            fechaActualizacion: r.fechaActualizacion
          }))
        })
      )
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setState({ kind: "error", message: errorMessage(cause) });
      });
    return () => controller.abort();
  }, []);

  return state;
}

type MutationState = {
  pending: boolean;
  error: string | null;
};

export function useUserMutations() {
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
    create: (input: UserInput) => run(() => usersService.create(input)),
    update: (id: string, input: UserInput) =>
      run(() => usersService.update(id, input)),
    remove: (id: string) => run(() => usersService.remove(id))
  };
}
