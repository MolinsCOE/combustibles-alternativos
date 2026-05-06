import { composeApp } from "./composition-root.js";
import { loadEnv } from "./config/env.js";

const env = loadEnv();
const composed = composeApp(env);

// Run idempotent startup seeds before accepting traffic. Failures are fatal
// because the app depends on the default roles existing.
composed.usuariosRoles.seedDefaultRoles
  .execute()
  .then(() => {
    composed.app.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("[startup] seed failed", err);
    process.exit(1);
  });
