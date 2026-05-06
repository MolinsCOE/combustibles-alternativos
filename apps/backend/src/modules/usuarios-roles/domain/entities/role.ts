export type Role = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
};

export type RoleWithUserCount = Role & {
  numeroUsuarios: number;
};

export type RoleUserSummary = {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
};

export type RoleDetail = Role & {
  usuarios: RoleUserSummary[];
};
