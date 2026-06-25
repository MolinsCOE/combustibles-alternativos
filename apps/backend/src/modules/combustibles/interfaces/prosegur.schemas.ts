import { z } from "zod";

export const prosegurIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const mapEntryBodySchema = z.object({
  materialId: z.number().int().positive(),
  proveedorId: z.number().int().positive(),
  /** Save the label → material/proveedor mapping for future auto-map */
  saveMapping: z.boolean().default(true),
  /** The raw Prosegur label from the Excel (required when saveMapping=true) */
  prosegurLabel: z.string().min(1).optional(),
});

export const upsertMapBodySchema = z.object({
  prosegurLabel: z.string().min(1),
  materialId: z.number().int().positive(),
  proveedorId: z.number().int().positive(),
});

export const dailySummaryQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in yyyy-mm-dd format"),
});

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be in yyyy-mm-dd format");

export const weeklySummaryQuerySchema = z.object({
  startDate: isoDateString,
  endDate: isoDateString,
});

export type ProsegurIdParam = z.infer<typeof prosegurIdParamSchema>;
export type MapEntryBody = z.infer<typeof mapEntryBodySchema>;
export type UpsertMapBody = z.infer<typeof upsertMapBodySchema>;
export type DailySummaryQuery = z.infer<typeof dailySummaryQuerySchema>;
export type WeeklySummaryQuery = z.infer<typeof weeklySummaryQuerySchema>;
