export type User = {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  rolId: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
};

export type UserWithRole = User & {
  rolNombre: string;
};
