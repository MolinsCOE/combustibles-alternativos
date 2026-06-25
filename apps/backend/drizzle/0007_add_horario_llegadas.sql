CREATE TABLE "ca_horario_llegadas" (
  "id" SERIAL PRIMARY KEY,
  "solicitud_id" INTEGER NOT NULL REFERENCES "ca_solicitudes"("id") ON DELETE CASCADE,
  "dia" TEXT NOT NULL,
  "franja" TEXT NOT NULL,
  "silo" TEXT NOT NULL,
  "material_nom" TEXT NOT NULL,
  "creado_en" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("solicitud_id", "dia", "franja", "silo")
);
