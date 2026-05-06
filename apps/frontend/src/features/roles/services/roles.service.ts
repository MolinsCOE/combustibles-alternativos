import {
  httpClient,
  z,
  type RequestOptions
} from "../../../shared/services/http-client.js";

const roleSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  fechaCreacion: z.string(),
  fechaActualizacion: z.string()
});

const roleWithCountSchema = roleSchema.extend({
  numeroUsuarios: z.number().int().nonnegative()
});

const roleListSchema = z.object({
  items: z.array(roleWithCountSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative()
});

const roleUserSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  email: z.string(),
  activo: z.boolean()
});

const roleDetailSchema = roleSchema.extend({
  usuarios: z.array(roleUserSchema)
});

export type Role = z.infer<typeof roleSchema>;
export type RoleWithCount = z.infer<typeof roleWithCountSchema>;
export type RoleList = z.infer<typeof roleListSchema>;
export type RoleUser = z.infer<typeof roleUserSchema>;
export type RoleDetail = z.infer<typeof roleDetailSchema>;

export type RoleInput = {
  nombre: string;
  descripcion: string | null;
};

export type ListRolesParams = {
  page: number;
  pageSize: number;
};

export const rolesService = {
  list(params: ListRolesParams, options?: RequestOptions): Promise<RoleList> {
    const qs = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize)
    });
    return httpClient.get(`/api/roles?${qs.toString()}`, roleListSchema, options);
  },
  detail(id: string, options?: RequestOptions): Promise<RoleDetail> {
    return httpClient.get(`/api/roles/${id}`, roleDetailSchema, options);
  },
  create(input: RoleInput, options?: RequestOptions): Promise<Role> {
    return httpClient.post("/api/roles", input, roleSchema, options);
  },
  update(id: string, input: RoleInput, options?: RequestOptions): Promise<Role> {
    return httpClient.put(`/api/roles/${id}`, input, roleSchema, options);
  },
  remove(id: string, options?: RequestOptions): Promise<void> {
    return httpClient.delete(`/api/roles/${id}`, options);
  }
};
