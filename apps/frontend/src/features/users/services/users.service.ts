import {
  httpClient,
  z,
  type RequestOptions
} from "../../../shared/services/http-client.js";

const userSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  email: z.string(),
  activo: z.boolean(),
  rolId: z.string(),
  fechaCreacion: z.string(),
  fechaActualizacion: z.string()
});

const userWithRoleSchema = userSchema.extend({
  rolNombre: z.string()
});

const userListSchema = z.object({
  items: z.array(userWithRoleSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative()
});

export type User = z.infer<typeof userSchema>;
export type UserWithRole = z.infer<typeof userWithRoleSchema>;
export type UserList = z.infer<typeof userListSchema>;

export type UserInput = {
  nombre: string;
  email: string;
  rolId: string;
  activo: boolean;
};

export type ListUsersParams = {
  page: number;
  pageSize: number;
};

export const usersService = {
  list(params: ListUsersParams, options?: RequestOptions): Promise<UserList> {
    const qs = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize)
    });
    return httpClient.get(`/api/usuarios?${qs.toString()}`, userListSchema, options);
  },
  detail(id: string, options?: RequestOptions): Promise<UserWithRole> {
    return httpClient.get(`/api/usuarios/${id}`, userWithRoleSchema, options);
  },
  create(input: UserInput, options?: RequestOptions): Promise<User> {
    return httpClient.post("/api/usuarios", input, userSchema, options);
  },
  update(id: string, input: UserInput, options?: RequestOptions): Promise<User> {
    return httpClient.put(`/api/usuarios/${id}`, input, userSchema, options);
  },
  remove(id: string, options?: RequestOptions): Promise<void> {
    return httpClient.delete(`/api/usuarios/${id}`, options);
  }
};
