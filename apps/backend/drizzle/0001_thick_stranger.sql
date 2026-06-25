CREATE TYPE "public"."ca_autor_historial" AS ENUM('produccion', 'compras');--> statement-breakpoint
CREATE TYPE "public"."ca_estado_confirmacion" AS ENUM('pendiente', 'confirmada', 'rechazada');--> statement-breakpoint
CREATE TYPE "public"."ca_estado_linea_distribucion" AS ENUM('pendiente', 'enviada', 'confirmada', 'rechazada');--> statement-breakpoint
CREATE TYPE "public"."ca_estado_solicitud" AS ENUM('borrador', 'enviada', 'en_distribucion', 'confirmada', 'cerrada');--> statement-breakpoint
CREATE TYPE "public"."ca_parte_confirmacion" AS ENUM('proveedor', 'transportista');--> statement-breakpoint
CREATE TYPE "public"."ca_tipus_proveedor" AS ENUM('proveedor', 'transportista', 'ambos');--> statement-breakpoint
CREATE TABLE "ca_asignaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer NOT NULL,
	"proveedor_id" integer NOT NULL,
	"transportista_id" integer NOT NULL,
	"pct" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ca_confirmaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"linea_distribucion_id" integer NOT NULL,
	"parte" "ca_parte_confirmacion" NOT NULL,
	"estado" "ca_estado_confirmacion" NOT NULL,
	"motivo" text,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ca_entradas_reales" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitud_id" integer,
	"fecha" text NOT NULL,
	"material_id" integer NOT NULL,
	"material_nom" text NOT NULL,
	"proveedor_id" integer NOT NULL,
	"proveedor_nom" text NOT NULL,
	"transportista_id" integer NOT NULL,
	"transportista_nom" text NOT NULL,
	"viajes" integer NOT NULL,
	"destino" text DEFAULT '' NOT NULL,
	"obs" text DEFAULT '' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ca_historial_solicitud" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitud_id" integer NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"autor" "ca_autor_historial" NOT NULL,
	"motivo" text NOT NULL,
	"descripcion" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ca_lineas_distribucion" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitud_id" integer NOT NULL,
	"linea_solicitud_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"material_nom" text NOT NULL,
	"proveedor_id" integer NOT NULL,
	"proveedor_nom" text NOT NULL,
	"transportista_id" integer NOT NULL,
	"transportista_nom" text NOT NULL,
	"dl" integer DEFAULT 0 NOT NULL,
	"dt" integer DEFAULT 0 NOT NULL,
	"dc" integer DEFAULT 0 NOT NULL,
	"dj" integer DEFAULT 0 NOT NULL,
	"dv" integer DEFAULT 0 NOT NULL,
	"ds" integer DEFAULT 0 NOT NULL,
	"dg" integer DEFAULT 0 NOT NULL,
	"estado" "ca_estado_linea_distribucion" DEFAULT 'pendiente' NOT NULL,
	"confirmacion_proveedor" "ca_estado_confirmacion" DEFAULT 'pendiente' NOT NULL,
	"confirmacion_transportista" "ca_estado_confirmacion" DEFAULT 'pendiente' NOT NULL,
	"cantidades_proveedor" jsonb,
	"comentario_proveedor" text,
	"cantidades_transportista" jsonb,
	"comentario_transportista" text,
	"motivo_rechazo_proveedor" text,
	"motivo_rechazo_transportista" text,
	"correo_enviado_en" timestamp with time zone,
	"correo_transportista_enviado_en" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ca_lineas_solicitud" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitud_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"material_nom" text NOT NULL,
	"dl" integer DEFAULT 0 NOT NULL,
	"dt" integer DEFAULT 0 NOT NULL,
	"dc" integer DEFAULT 0 NOT NULL,
	"dj" integer DEFAULT 0 NOT NULL,
	"dv" integer DEFAULT 0 NOT NULL,
	"ds" integer DEFAULT 0 NOT NULL,
	"dg" integer DEFAULT 0 NOT NULL,
	"obs" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ca_materiales" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ca_proveedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"tipus" "ca_tipus_proveedor" NOT NULL,
	"emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bcc" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ca_solicitudes" (
	"id" serial PRIMARY KEY NOT NULL,
	"semana" text NOT NULL,
	"ini" text NOT NULL,
	"fi" text NOT NULL,
	"creada_por" text NOT NULL,
	"estado" "ca_estado_solicitud" DEFAULT 'borrador' NOT NULL,
	"comentario_general" text DEFAULT '' NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ca_asignaciones" ADD CONSTRAINT "ca_asignaciones_material_id_ca_materiales_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ca_materiales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_asignaciones" ADD CONSTRAINT "ca_asignaciones_proveedor_id_ca_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."ca_proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_asignaciones" ADD CONSTRAINT "ca_asignaciones_transportista_id_ca_proveedores_id_fk" FOREIGN KEY ("transportista_id") REFERENCES "public"."ca_proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_confirmaciones" ADD CONSTRAINT "ca_confirmaciones_linea_distribucion_id_ca_lineas_distribucion_id_fk" FOREIGN KEY ("linea_distribucion_id") REFERENCES "public"."ca_lineas_distribucion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_entradas_reales" ADD CONSTRAINT "ca_entradas_reales_solicitud_id_ca_solicitudes_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."ca_solicitudes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_historial_solicitud" ADD CONSTRAINT "ca_historial_solicitud_solicitud_id_ca_solicitudes_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."ca_solicitudes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_lineas_distribucion" ADD CONSTRAINT "ca_lineas_distribucion_solicitud_id_ca_solicitudes_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."ca_solicitudes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_lineas_distribucion" ADD CONSTRAINT "ca_lineas_distribucion_linea_solicitud_id_ca_lineas_solicitud_id_fk" FOREIGN KEY ("linea_solicitud_id") REFERENCES "public"."ca_lineas_solicitud"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_lineas_solicitud" ADD CONSTRAINT "ca_lineas_solicitud_solicitud_id_ca_solicitudes_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."ca_solicitudes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ca_lineas_solicitud" ADD CONSTRAINT "ca_lineas_solicitud_material_id_ca_materiales_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."ca_materiales"("id") ON DELETE restrict ON UPDATE no action;