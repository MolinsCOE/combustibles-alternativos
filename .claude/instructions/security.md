---
description: "Use when implementing authentication, authorization, input validation, CORS, security headers, secrets management, dependency auditing, or reviewing code for security vulnerabilities. Also use when adding new endpoints, handling user data, configuring middleware, doing final code review, preparing delivery, or validating changes before push."
---
<!-- AUTO-GENERATED from .shared_ai/instructions/security.md — DO NOT EDIT. Run: pnpm sync-ai -->

# Seguridad

Reglas concretas para este stack (Express, Drizzle, React, Docker). Los principios generales de OWASP estan en `copilot-instructions.md`; la arquitectura (capas, limites, puertos) esta en `architecture.instructions.md`.

## Validacion de entrada (obligatorio Zod en toda la aplicacion)
- **Backend**: todo endpoint valida body, params, query y headers relevantes con un schema **Zod**, en un middleware o al inicio del controller (capa `interfaces/`). Nunca se llega al caso de uso con input no validado.
- **Frontend**: todo formulario valida con Zod antes de enviar al API. Los errores se muestran por campo sin exponer detalles internos.
- **Env vars**: validadas con Zod al arrancar (`main/config/env.ts`). La app no arranca si falta algo obligatorio.
- Si la validacion falla: 400 + mensaje y codigo estables. Nunca devolver el detalle crudo del schema ni la ruta del campo interno.
- Limita el tamaño del body con `express.json({ limit: '100kb' })` o un valor acorde al caso de uso.
- Valida en el limite del sistema, no dentro de `domain/` ni `application/` (domain no conoce Zod).

## Inyeccion y queries
- Drizzle genera consultas parametrizadas por defecto. No uses `sql.raw()` ni template strings con datos de usuario a menos que sea estrictamente necesario y estes escapando manualmente.
- Si necesitas SQL crudo, usa siempre `sql` tagged template de Drizzle que parametriza automaticamente.
- Nunca concatenes input de usuario en queries, nombres de tabla o columnas.

## Autenticacion y autorizacion
- Separa autenticacion (quien eres) de autorizacion (que puedes hacer) en middlewares distintos.
- No almacenes passwords en texto plano; usa hashing con sal (bcrypt o argon2).
- Los tokens (JWT u otros) deben tener expiracion corta y renovarse de forma segura.
- Valida permisos en el backend siempre, nunca confies solo en restricciones del frontend.

## Headers y CORS
- Configura CORS con origenes explicitos; no uses `origin: '*'` en produccion.
- Añade headers de seguridad basicos: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (cuando aplique HTTPS).
- No expongas headers internos (ej. `X-Powered-By`). Express 5 ya no lo envia, pero verificalo si usas proxies.

## Gestion de errores
- Devuelve errores al cliente con estructura consistente y sin stack traces, rutas internas ni nombres de tabla.
- Registra el error completo en logs del servidor para debugging, no en la respuesta HTTP.
- Usa un middleware de error centralizado como ultimo middleware de Express.

## Secretos y configuracion
- Nunca hardcodees secretos, tokens, claves ni connection strings.
- Usa variables de entorno via `.env` (excluido de git) y valida que existan al arrancar la app.
- No loguees valores de secretos ni los incluyas en respuestas de debug.

## Dependencias
- Ejecuta `pnpm audit` periodicamente para detectar vulnerabilidades conocidas.
- Actualiza dependencias con vulnerabilidades criticas o altas con prioridad.
- No introduzcas dependencias nuevas para resolver problemas que el stack ya cubre.
- **Edad minima de publicacion**: el workspace tiene `minimumReleaseAge: 2880` (2 dias) en `pnpm-workspace.yaml`. pnpm ignora cualquier version publicada hace menos de 48h para reducir el riesgo de instalar releases recien comprometidas antes de que la comunidad las detecte. No bajes este valor. Si necesitas una version muy reciente y esta justificado, usa `minimumReleaseAgeExclude` acotado al paquete concreto en lugar de reducir el umbral global. Ver https://pnpm.io/settings#minimumreleaseage.

## Frontend (React)
- No almacenes tokens, secrets ni datos sensibles en localStorage; usa httpOnly cookies cuando sea posible.
- React escapa JSX por defecto. Nunca uses `dangerouslySetInnerHTML` con datos de usuario sin sanitizar.
- No incluyas logica de autorizacion solo en el frontend; el backend es la fuente de verdad.

## Docker y despliegue
- No copies `.env`, claves privadas ni secretos dentro de la imagen Docker.
- Usa multi-stage builds para que el contenedor final no incluya devDependencies ni herramientas de build.
- Ejecuta el proceso de Node como usuario no-root dentro del contenedor.

## Sesiones y estado de usuario
- Si se implementan sesiones, usa almacenamiento server-side (ej. PostgreSQL o Redis) con IDs opacos y expiracion.
- Regenera el ID de sesion tras autenticacion exitosa para prevenir session fixation.
- Invalida sesiones en logout y expiralas por inactividad.

## Logging y auditoria
- Registra eventos de autenticacion (login, logout, fallos, bloqueos) para trazabilidad.
- No loguees valores de tokens, passwords ni datos personales.
- Usa logging estructurado para que los eventos de seguridad sean filtrables y alertables.
