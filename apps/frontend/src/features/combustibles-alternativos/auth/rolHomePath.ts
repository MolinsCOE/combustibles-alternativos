import type { CaRol } from "./types.js";

export function rolHomePath(rol: CaRol): string {
  switch (rol) {
    case "produccion": return "/combustibles/solicitud/nueva";
    case "compras":    return "/combustibles/resumen";
    case "proveedor":  return "/combustibles/mis-confirmaciones";
  }
}
