import { useContext } from "react";
import { RoleContext } from "./RoleContext.js";

export function useRole() {
  return useContext(RoleContext);
}
