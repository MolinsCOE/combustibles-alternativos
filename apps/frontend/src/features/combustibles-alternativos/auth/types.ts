export type CaRol = "produccion" | "compras" | "proveedor";

export type CaSession = {
  nombre: string;
  rol: CaRol;
  proveedorId: string | null;
};
