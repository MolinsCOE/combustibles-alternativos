ALTER TABLE "ca_plantilla_distribucion" DROP CONSTRAINT IF EXISTS "ca_plantilla_distribucion_proveedor_id_ca_proveedores_id_fk";--> statement-breakpoint
ALTER TABLE "ca_plantilla_distribucion" DROP COLUMN "proveedor_id";--> statement-breakpoint
ALTER TABLE "ca_plantilla_distribucion" DROP COLUMN "proveedor_nom";
