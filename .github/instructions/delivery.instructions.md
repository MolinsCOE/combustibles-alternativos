---
description: "Use when finishing a task, preparing commits, validating before push, checking CI compatibility, reviewing performance concerns, or doing pre-delivery checks."
---

# Rendimiento y operacion

- Usa mediciones reales, sintomas observables o cuellos de botella claros antes de optimizar.
- Evita queries innecesarias, fetches redundantes y renders evitables si son evidentes en el codigo.
- Mantén compatibilidad con Docker y con los workflows de GitHub Actions existentes.
- No rompas `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` ni los pipelines por cambios evitables.

# Validacion antes de dar por terminado un cambio

- Gate obligatorio secuencial antes de pedir validacion al usuario o preparar un commit:
  1. `pnpm lint`
  2. `pnpm typecheck`
  3. `pnpm test`
  4. `pnpm build`
- Si algun paso falla, **no** se avanza: se corrige y se vuelve a ejecutar desde el inicio.
- Si el cambio afecta flujos criticos (login, alta de entidad principal, busqueda), ademas `pnpm test:e2e`.
- Si no puedes ejecutar alguno de los checks en este entorno, dilo con precision y no afirmes que todo esta correcto.

# Verificacion end-to-end cuando el cambio afecta a la interaccion frontend ↔ backend

Pasar el gate (`lint`, `typecheck`, `test`, `build`) **NO** es suficiente cuando la tarea conecta el frontend con un endpoint real del backend. Antes de decirle al usuario "pruebalo en el navegador":

1. **Comprobar que el backend esta realmente escuchando** en el puerto esperado (p. ej. `curl -s http://localhost:3000/health` o el endpoint afectado). No asumir que esta arrancado porque el usuario lo dijo hace rato, porque la task de VS Code existe, o porque el build paso.
2. Si el backend no esta corriendo: arrancarlo (creando `.env` desde `.env.example` si falta) antes de seguir.
3. **Comprobar el endpoint exacto que va a llamar el frontend**, respetando el proxy de Vite (`/api/...` reescrito a la ruta real del backend). Un `curl` a la URL que usara el navegador debe devolver 2xx con payload valido.
4. Solo entonces se indica al usuario que pruebe en el navegador.

Si este paso se salta, el usuario recibira 500/Network Error y la validacion falla. Es un error grave que debe evitarse siempre.


# Definition of Done

Un cambio solo esta completo cuando se cumplen todas las condiciones aplicables:
1. TypeScript strict checks pasan.
2. ESLint pasa sin errores.
3. Tests unitarios e integracion pasan.
4. Tests E2E pasan para flujos criticos impactados.
5. Cobertura esta en o por encima de 90% (branches, functions, lines, statements).
6. Compatibilidad con Docker y despliegue no se ha roto.
7. Version bumpeada en `package.json` si el cambio afecta `apps/backend` o `apps/frontend`.

## Revision de seguridad antes de entregar

Antes de dar por terminado un cambio que toca endpoints, datos de usuario, autenticacion o configuracion, verifica:
- Inputs validados y sanitizados en el limite del sistema (ver `security.instructions.md`).
- Sin secretos, tokens ni credenciales hardcodeados en el codigo.
- Errores devueltos al cliente sin stack traces, rutas internas ni detalles de esquema.
- CORS configurado con origenes explicitos (no `*` en produccion).
- Queries parametrizadas (Drizzle lo hace por defecto; verificar si hay SQL crudo).
- `pnpm audit` sin vulnerabilidades criticas ni altas sin justificacion.
- Dockerfile no copia `.env` ni secretos; proceso corre como non-root.

# CI, commits y entrega

- Considera las workflows de `.github/workflows/` como parte del contrato del repositorio.
- No prepares cambios que solo funcionen localmente pero rompan CI.
- Si el usuario pide ayuda con commits o mensajes, usa Conventional Commits con nombres claros y orientados al cambio real.
- Antes de considerar una tarea lista para entregar o para push, verifica coherencia minima entre codigo, pruebas, build, typecheck y versionado.
