CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_actualizacion" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"rol_id" uuid NOT NULL,
	"fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_actualizacion" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_nombre_unique" ON "roles" USING btree ("nombre");--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_email_unique" ON "usuarios" USING btree ("email");