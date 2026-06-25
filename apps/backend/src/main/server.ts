import { composeApp } from "./composition-root.js";
import { loadEnv } from "./config/env.js";

const env = loadEnv();
const composed = composeApp(env);

// Run idempotent startup seeds before accepting traffic. Failures are fatal
// because the app depends on the default roles existing.
composed.usuariosRoles.seedDefaultRoles
  .execute()
  .then(async () => {
    // Seed combustibles master data only if tables are empty
    const hasDatos = await composed.combustibles.seed.hasDatos();
    if (!hasDatos) {
      await composed.combustibles.seed.seedDatos({
        destinos: [
          { nom: "QUEMADOR SILO 1" },
          { nom: "QUEMADOR SILO 2" },
          { nom: "PISOS MOVILES" },
          { nom: "BUNKERS" },
          { nom: "A DEPOSITO" },
          { nom: "A C-31 / C-35" },
        ],
        materiales: [
          { nom: "Madera Fina" },
          { nom: "CSR Fino" },
          { nom: "CSR Grueso" },
          { nom: "Biomasa Fina" },
          { nom: "Biomasa Gruesa" },
          { nom: "NFU" },
          { nom: "Amoniaco" },
          { nom: "Sulfato Ferroso" },
          { nom: "Cáscaras Anacardo" },
          { nom: "Madera Gruesa" },
          { nom: "Lodos" },
          { nom: "Sol. Amoniacal" },
          { nom: "S. Ferroso" },
        ],
        proveedores: [
          { nom: "PRONATUR",   tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "GRP",        tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "PIRSA",      tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "SEMESA",     tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "XIRGU",      tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "GESVAL",     tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "VESCEM",     tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "INDUGARBI",  tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "RNC",        tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "FERTIBERIA", tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "ADICE",      tipus: "proveedor",     emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "FOMENT",     tipus: "transportista", emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "RUIZ MILÀ",  tipus: "transportista", emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
          { nom: "RUMO",       tipus: "transportista", emails: ["arnau.guitart@molins.es"], bcc: ["arnau.guitart@molins.es"] },
        ],
        asignaciones: [
          { materialNom: "CSR Grueso",  proveedorNom: "PRONATUR", transportistaNom: "FOMENT",    pct: 70 },
          { materialNom: "CSR Grueso",  proveedorNom: "PRONATUR", transportistaNom: "RUIZ MILÀ", pct: 30 },
          { materialNom: "Madera Fina", proveedorNom: "SEMESA",   transportistaNom: "FOMENT",    pct: 50 },
          { materialNom: "Madera Fina", proveedorNom: "XIRGU",    transportistaNom: "RUMO",      pct: 50 },
        ],
        plantilla: [
          { materialNom: "Madera Fina",    destino: "QUEMADOR SILO 2" },
          { materialNom: "CSR Fino",       destino: "QUEMADOR SILO 1" },
          { materialNom: "Lodos",          destino: "QUEMADOR SILO 2" },
          { materialNom: "NFU",            destino: "PISOS MOVILES" },
          { materialNom: "CSR Grueso",     destino: "BUNKERS" },
          { materialNom: "Madera Gruesa",  destino: "BUNKERS" },
          { materialNom: "Sol. Amoniacal", destino: "A DEPOSITO" },
          { materialNom: "S. Ferroso",     destino: "A C-31 / C-35" },
        ],
      });
      console.log("[startup] Combustibles master data seeded");
    }
  })
  .then(() => {
    composed.app.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("[startup] seed failed", err);
    process.exit(1);
  });
