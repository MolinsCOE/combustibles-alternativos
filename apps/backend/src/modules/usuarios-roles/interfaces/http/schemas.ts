import { z } from "zod";

const NOMBRE_MAX = 80;
const DESCRIPCION_MAX = 500;
const EMAIL_MAX = 160;

export const roleBodySchema = z
  .object({
    nombre: z
      .string()
      .min(1, "El nombre es obligatorio")
      .max(NOMBRE_MAX, `El nombre no puede superar los ${NOMBRE_MAX} caracteres`),
    descripcion: z
      .string()
      .max(DESCRIPCION_MAX, `La descripción no puede superar los ${DESCRIPCION_MAX} caracteres`)
      .nullable()
      .optional()
  })
  .strict();

export type RoleBody = z.infer<typeof roleBodySchema>;

export const roleIdParamsSchema = z
  .object({
    id: z.string().uuid("Identificador de rol no válido")
  })
  .strict();

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10)
  })
  .strict();

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const userBodySchema = z
  .object({
    nombre: z
      .string()
      .min(1, "El nombre es obligatorio")
      .max(NOMBRE_MAX, `El nombre no puede superar los ${NOMBRE_MAX} caracteres`),
    email: z
      .string()
      .min(1, "El email es obligatorio")
      .max(EMAIL_MAX, `El email no puede superar los ${EMAIL_MAX} caracteres`)
      .email("Introduce un email con un formato válido"),
    rolId: z.string().uuid("Identificador de rol no válido"),
    activo: z.boolean().optional().default(true)
  })
  .strict();

export type UserBody = z.infer<typeof userBodySchema>;

export const userIdParamsSchema = z
  .object({
    id: z.string().uuid("Identificador de usuario no válido")
  })
  .strict();
