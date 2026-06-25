CREATE TABLE "ca_plantilla_distribucion" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer NOT NULL,
	"material_nom" text DEFAULT '' NOT NULL,
	"proveedor_id" integer NOT NULL,
	"proveedor_nom" text DEFAULT '' NOT NULL,
	"destino" text DEFAULT '' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ca_lineas_distribucion" ADD COLUMN "destino" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ca_lineas_solicitud" ADD COLUMN "destino" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ca_plantilla_distribucion" ADD CONSTRAINT "ca_plantilla_distribucion_material_id_ca_materiales_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ca_materiales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_plantilla_distribucion" ADD CONSTRAINT "ca_plantilla_distribucion_proveedor_id_ca_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."ca_proveedores"("id") ON DELETE cascade ON UPDATE no action;