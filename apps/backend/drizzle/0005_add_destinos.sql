CREATE TABLE "ca_destinos" (
  "id" serial PRIMARY KEY NOT NULL,
  "nom" text NOT NULL,
  "activo" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
