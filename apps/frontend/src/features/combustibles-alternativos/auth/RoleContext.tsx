import { createContext } from "react";
import type { CaSession } from "./types.js";

export type { CaSession };
export type { CaRol } from "./types.js";

export type RoleContextValue = {
  session: CaSession | null;
  login: (session: CaSession) => void;
  logout: () => void;
};

export const RoleContext = createContext<RoleContextValue>({
  session: null,
  login: () => undefined,
  logout: () => undefined
});
