CREATE TYPE "public"."ca_prosegur_entry_status" AS ENUM('mapped', 'unmapped');--> statement-breakpoint
CREATE TYPE "public"."ca_prosegur_import_status" AS ENUM('ok', 'error', 'partial');--> statement-breakpoint
CREATE TABLE "ca_prosegur_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"import_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"hora_entrada" time,
	"hora_salida" time,
	"dni" text,
	"nombre" text,
	"tarjeta" text,
	"tractora" text,
	"remolque" text,
	"material_raw" text NOT NULL,
	"destino_raw" text,
	"full_seguiment_no" text,
	"mapped_material_id" integer,
	"mapped_proveedor_id" integer,
	"status" "ca_prosegur_entry_status" DEFAULT 'unmapped' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ca_prosegur_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "ca_prosegur_import_status" NOT NULL,
	"rows_total" integer,
	"rows_mapped" integer,
	"rows_unmapped" integer,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "ca_prosegur_material_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"prosegur_label" text NOT NULL,
	"material_id" integer NOT NULL,
	"proveedor_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ca_prosegur_material_map_prosegur_label_unique" UNIQUE("prosegur_label")
);
--> statement-breakpoint
ALTER TABLE "ca_prosegur_entries" ADD CONSTRAINT "ca_prosegur_entries_import_id_ca_prosegur_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."ca_prosegur_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_prosegur_entries" ADD CONSTRAINT "ca_prosegur_entries_mapped_material_id_ca_materiales_id_fk" FOREIGN KEY ("mapped_material_id") REFERENCES "public"."ca_materiales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_prosegur_entries" ADD CONSTRAINT "ca_prosegur_entries_mapped_proveedor_id_ca_proveedores_id_fk" FOREIGN KEY ("mapped_proveedor_id") REFERENCES "public"."ca_proveedores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_prosegur_material_map" ADD CONSTRAINT "ca_prosegur_material_map_material_id_ca_materiales_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ca_materiales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_prosegur_material_map" ADD CONSTRAINT "ca_prosegur_material_map_proveedor_id_ca_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."ca_proveedores"("id") ON DELETE cascade ON UPDATE no action;