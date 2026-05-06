import type { CaRol } from "./types.js";

// Solo para demo — se reemplazará por API real en la fase de backend
export type MockUser = {
  username: string;
  password: string;
  rol: CaRol;
  nombre: string;
  proveedorId: string | null;
};

export const MOCK_USERS: MockUser[] = [
  // Internos
  { username: "produccion", password: "molins123", rol: "produccion", nombre: "Dept. Producción", proveedorId: null },
  { username: "compras",    password: "molins123", rol: "compras",    nombre: "Dept. Compras",    proveedorId: null },
  // Proveedores
  { username: "pronatur",   password: "molins123", rol: "proveedor",  nombre: "PRONATUR",   proveedorId: "1" },
  { username: "grp",        password: "molins123", rol: "proveedor",  nombre: "GRP",        proveedorId: "2" },
  { username: "pirsa",      password: "molins123", rol: "proveedor",  nombre: "PIRSA",      proveedorId: "3" },
  { username: "semesa",     password: "molins123", rol: "proveedor",  nombre: "SEMESA",     proveedorId: "4" },
  { username: "xirgu",      password: "molins123", rol: "proveedor",  nombre: "XIRGU",      proveedorId: "5" },
  { username: "gesval",     password: "molins123", rol: "proveedor",  nombre: "GESVAL",     proveedorId: "6" },
  // Transportistas
  { username: "foment",     password: "molins123", rol: "proveedor",  nombre: "FOMENT",     proveedorId: "7" },
  { username: "ruizmila",   password: "molins123", rol: "proveedor",  nombre: "RUIZ MILÀ",  proveedorId: "8" },
  { username: "rumo",       password: "molins123", rol: "proveedor",  nombre: "RUMO",       proveedorId: "9" },
];

export function autenticarUsuario(username: string, password: string): MockUser | null {
  return (
    MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    ) ?? null
  );
}
