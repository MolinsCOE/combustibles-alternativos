CREATE TABLE "ca_horario_plantilla" (
  "id" SERIAL PRIMARY KEY,
  "dia" TEXT NOT NULL,
  "franja" TEXT NOT NULL,
  "silo" TEXT NOT NULL,
  "material_nom" TEXT NOT NULL,
  "creado_en" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("dia", "franja", "silo")
);
