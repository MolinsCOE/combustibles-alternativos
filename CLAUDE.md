<!-- AUTO-GENERATED from .shared_ai/base-rules.md + .shared_ai/instructions/ — DO NOT EDIT. Run: pnpm sync-ai -->

# Copilot Instructions

Reglas universales del repositorio. Se cargan siempre.
Las reglas de dominio (backend, frontend, testing, entrega, design system, identidad de marca) están en `.github/instructions/` y se cargan automaticamente cuando son relevantes.

## Agentes disponibles y cuando usar cada uno

Este repositorio tiene cinco agentes especializados. El usuario elige directamente el que necesita — no hay coordinador intermedio.

| Agente | Usar cuando el usuario quiere... |
|--------|----------------------------------|
| **product-discovery** | Definir una idea nueva, descubrir requisitos, crear un plan funcional, escribir tareas de negocio, planificar un MVP. Ejemplo: "Quiero hacer una app para registrar horas de trabajo." |
| **data-model** | Generar o revisar el modelo de datos a partir de un plan funcional ya validado. Ejemplo: "Ya tengo el plan listo, genera el modelo de datos." |
| **implementacion** | Construir el codigo (frontend, backend, tests) a partir de documentos funcionales validados. Ejemplo: "Implementa el modulo de registro de jornada." |
| **lineas-trabajo** | Ver en que esta trabajando, consultar puntos de guardado, retomar desde un punto anterior o empezar una linea nueva desde un punto concreto. Ejemplo: "Quiero volver a como estaba antes de ayer." |
| **setup** | Montar el proyecto por primera vez, conectar el repositorio del equipo, resolver problemas de entorno, arrancar Docker o la base de datos, solucionar errores de puertos o dependencias. Ejemplo: "La app no arranca" o "Es la primera vez que abro este proyecto." |

**Flujo tipico**: setup (primera vez) → product-discovery → data-model → implementacion. En cualquier momento, `lineas-trabajo` permite revisar el historial y retomar desde un punto anterior. Cada agente indica al usuario el siguiente paso cuando termina su trabajo.

## Pilares (orden de prioridad al tomar decisiones)

1. **Seguridad**: nunca confiar en input externo, nunca exponer errores internos, defensa en profundidad.
2. **Mantenibilidad**: capas claras, una unica razon de cambio por pieza, nombres que gritan dominio.
3. **Rendimiento**: sin optimizaciones especulativas, pero sin anti-patrones evidentes (N+1, renders innecesarios, fetches redundantes).
4. **Escalabilidad**: servicios stateless, sin estado global mutable, sin acoplamiento oculto entre modulos.

Si un cambio mejora un pilar pero rompe otro, **paras y preguntas**.

## Arquitectura (no negociable)

El proyecto usa **arquitectura hexagonal por modulo** en backend y **feature-folders** en frontend, siguiendo *screaming architecture*. Las reglas completas estan en `.github/instructions/architecture.instructions.md`, que es la fuente de verdad arquitectonica. Resumen:

- Backend: `apps/backend/src/modules/<modulo>/{domain,application,infrastructure,interfaces}` + `src/shared` + `src/main/composition-root.ts`.
- Frontend: `apps/frontend/src/features/<feature>/{pages,components,hooks,services,data}` + `src/shared/{ui,components,utils}` + `src/app`.
- `domain/` no depende de Express, Drizzle, HTTP ni Zod. Puertos (interfaces) en `domain/ports/`, implementaciones en `infrastructure/`.
- Modulos no se importan entre si a nivel de `domain/`. Si se comparte, sube a `shared/` o expone via `index.ts` del modulo.
- **Validacion Zod obligatoria** en todos los limites (API, formularios, env).
- **Composition root unico** para instanciar implementaciones. Sin DI containers.

Antes de crear o modificar codigo de `apps/`, los agentes deben cargar `architecture.instructions.md`.

## Objetivo
- Actua como ingeniero senior full-stack y prioriza decisiones simples, seguras, mantenibles y faciles de entender por personas y por IA.
- Respeta la arquitectura del repositorio antes de proponer nuevas capas, patrones o dependencias.

## Fuente de verdad del repositorio
- Lee primero `readme.md`, los `package.json` y el codigo existente antes de cambiar arquitectura, tooling o validaciones.
- Revisa `.github/workflows/` solo cuando el cambio afecte CI, build, release, versionado o validaciones automáticas.
- No inventes estructura futura como si ya existiera en el repo. Si una capacidad no esta implementada todavia, tratalo como una propuesta y no como una convencion vigente.
- Este repositorio es un monorepo con `pnpm` y dos aplicaciones: `apps/backend` (Express API, Drizzle, tests) y `apps/frontend` (React + Vite SPA).
- Los scripts de `pnpm` se ejecutan desde la raiz del workspace; los scripts por app se invocan con `pnpm --filter <app> <script>`.

## Stack aprobado (estricto)

| Capa | Tecnología | Restricción |
|---|---|---|
| Package manager | pnpm (workspace) | Prohibido npm o yarn |
| Runtime | Node.js >= 24.0.0 LTS | Declarado en todos los `engines` |
| Lenguaje | TypeScript strict | Sin `any`, sin `// @ts-ignore` sin comentario justificado |
| Backend | Express.js | Prohibido Fastify, Hono u otras alternativas |
| ORM | Drizzle | Sin SQL crudo fuera de migraciones; prohibido Prisma |
| Base de datos | PostgreSQL (Docker) | Cambios de schema vía Atlas/Drizzle |
| Frontend | React 19 | Sin class components |
| Build tool | Vite 6 | Prohibido webpack, esbuild standalone |
| Styling | Tailwind CSS | Prohibido CSS Modules, styled-components |
| Testing | Vitest, Supertest, Testcontainers, Playwright, k6 | Prohibido Jest, Mocha, Cypress |
| Contenedores | Docker | Multi-stage; proceso non-root |
| Mobile futuro | Capacitor | Solo si aparece necesidad real — no abrir un frontend nativo separado |

Los scripts de `pnpm` se ejecutan desde la raíz del workspace; los scripts por app se invocan con `pnpm --filter <app> <script>`. Nunca `cd apps/x && npm run`.

No se introducen librerías, frameworks o servicios fuera de este stack sin aprobación explícita del usuario.

## Definition of Done

Un cambio sólo está terminado cuando **todas** estas condiciones aplicables son ciertas:

1. `tsc --strict` pasa con cero errores.
2. ESLint pasa sin warnings.
3. Tests unitarios e integración pasan.
4. Tests E2E pasan para cualquier flujo crítico impactado (Login, alta de entidad principal, búsqueda).
5. Cobertura ≥ 90% en branches, functions, lines, statements.
6. Compatibilidad con Docker y despliegue no se ha roto.
7. Versionado en `package.json` bumpeado si el cambio afecta `apps/backend` o `apps/frontend`.

El gate secuencial antes de pedir validación al usuario o preparar commit:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Si algún paso falla, el cambio **no** está listo. No se muestra al usuario.

## Reglas duras

- **Prohibido añadir dependencias** sin aprobación explícita del usuario. Proponer alternativas del stack primero.
- **Prohibido `any`** — usar `unknown` + type narrowing o interface explícita.
- **Prohibido acceso directo a DB** fuera de la capa `infrastructure/` y del schema de Drizzle.
- **Prohibido hardcodear configuración** — todo por variables de entorno validadas con Zod.
- Los scripts de `pnpm` corren siempre desde la raíz con `--filter`.

## Principios de ingeniería
- Diseña para escalar sin sobrearquitectura.
- Prefiere codigo directo, modulos pequenos y nombres explicitos.
- Evita abstracciones prematuras, patrones ceremoniales y helpers genericos sin un caso repetido real.
- Optimiza primero claridad, correccion y perfilado real; no hagas microoptimizaciones especulativas.
- Mantén bajo acoplamiento y alta cohesión.
- Haz que cada cambio sea facil de revisar, probar y revertir.

## Reglas generales de implementacion
- Mantén compatibilidad con la estructura actual del repo y con los scripts existentes.
- Usa TypeScript estricto en todo el codigo nuevo o modificado. Todo codigo generado debe pasar ESLint y typecheck.
- No dejes `any`, casts inseguros ni silencios de errores salvo justificacion clara.
- No dupliques logica entre backend y frontend cuando pueda extraerse una interfaz o contrato claro.
- Prefiere interfaces explicitas y acceso a datos schema-driven con Drizzle.
- No añadas comentarios redundantes; solo comenta cuando el contexto o la decision no sea obvia.
- Conserva APIs publicas y contratos existentes salvo que el cambio requiera romperlos y eso quede claramente indicado.
- Cuando una decision implique tradeoffs, elige la alternativa mas simple que cumpla seguridad, rendimiento y mantenibilidad.
- Apunta a arquitectura minimal y production-grade que sea facil de evolucionar.

## Seguridad
- No hardcodees secretos, tokens, claves ni credenciales.
- Trata toda entrada externa como no confiable: valida y sanitiza en los limites del sistema (inputs de usuario, cuerpos de request, query params, headers).
- Minimiza superficie de ataque, dependencias y permisos.
- Aplica los principios de OWASP Top 10: protege contra inyeccion, autenticacion rota, exposicion de datos sensibles, SSRF y control de acceso insuficiente.
- No propongas comandos destructivos ni cambios riesgosos sin avisar claramente.
- Si se pide dejar una tarea lista para commit o push, recuerda verificar fugas de secretos con `gitleaks`; si el proyecto aun no tiene esa automatizacion, mantenlo como politica y no la introduzcas sin aprobacion.

## Estilo de colaboracion esperado de Copilot
- Responde con precision, sin relleno ni marketing.
- Explica supuestos, riesgos y limites cuando importen para la tarea.
- Prioriza cambios pequenos y bien delimitados frente a refactors amplios no pedidos.
- Si detectas una mejora fuera de alcance, mencionarla brevemente es suficiente; no la implementes sin peticion o necesidad directa.
- Cuando falte contexto funcional, pregunta por el objetivo de negocio antes de inventar comportamiento.

## Anti-patrones a evitar
- Sobreingenieria.
- Arquitectura guiada por modas.
- Dependencias nuevas para resolver problemas pequenos.
- Helpers demasiado abstractos o reutilizacion ficticia.
- Logica de negocio escondida en UI, scripts o configuracion.
- Cambios grandes sin tests ni validacion.
- Respuestas que den por hecha una estructura inexistente en el proyecto.

## Prohibido explicitamente (salvo justificacion y aprobacion)
- DI containers, decoradores, reflection (InversifyJS, tsyringe, Nest-style).
- Base repository/service genericos con herencia.
- Event bus sin handler real suscrito.
- Interfaces con una sola implementacion que nunca va a cambiar (abstracciones "por si acaso").
- Microservicios, colas, Redis, GraphQL, caches distribuidas antes de tener demanda real medida.
- Mover logica de negocio a UI, scripts de build o configuracion.
- Importar entre modulos saltandose el `index.ts` o tocando `domain/` ajeno.
- Cambios que dependan de una estructura que aun no existe.

## Indice de instrucciones por dominio

Estas reglas se cargan automaticamente por los subagentes que las referencian. Tambien puedes consultarlas directamente en `.claude/instructions/`.

- **architecture** — Usar siempre que se cree o modifique código en apps/. Define la arquitectura obligatoria del proyecto: hexagonal + screaming architecture + reglas de dependencia + anti-overengineering. Es la fuente de verdad arquitectónica; las instrucciones de backend, frontend, security, testing y delivery se apoyan en esta.
- **backend** — Use when modifying backend code: endpoints, services, middleware, database schemas, migrations, queries, or server configuration in apps/backend.
- **brand** — Use al aplicar la identidad de marca Molins: logo, simbolo, favicon, tono de voz, nombres de negocios y cargos. Complementa a design-system (tokens) y frontend (implementacion).
- **delivery** — Use when finishing a task, preparing commits, validating before push, checking CI compatibility, reviewing performance concerns, or doing pre-delivery checks.
- **design-system** — Use when implementing UI components, applying styles, choosing colors/typography, referencing the design system, or working with the Molins UI Kit. Also use when creating new visual components, reviewing design consistency, or checking available UI patterns.
- **frontend** — Use when modifying frontend code: React components, hooks, styles, routing, state management, or Vite configuration in apps/frontend.
- **i18n** — Usar siempre que se escriba o modifique UI: componentes React, páginas, formularios, mensajes de error, toasts, emails. Obliga a que ningún texto visible quede fijo en el código y a mantener ES y EN sincronizados.
- **icons** — Usar siempre que se añadan, modifiquen o revisen iconos en la interfaz. Fija la librería única permitida, el principio de uso mínimo y los criterios de tamaño, color y accesibilidad.
- **responsive** — Usar siempre que se diseñe o modifique UI: páginas, layout, menús, tarjetas, tablas, formularios. Obliga a validar toda pantalla en escritorio, tableta y móvil con criterios concretos.
- **security** — Use when implementing authentication, authorization, input validation, CORS, security headers, secrets management, dependency auditing, or reviewing code for security vulnerabilities. Also use when adding new endpoints, handling user data, configuring middleware, doing final code review, preparing delivery, or validating changes before push.
- **testing** — Use when writing, reviewing, or planning tests: unit tests, integration tests, E2E with Playwright, coverage goals, Testcontainers setup, or test strategy decisions.
- **version-control** — Usar siempre que un agente hable con el usuario sobre ramas, commits, historial, versiones o hashes. Define el vocabulario que se debe usar de cara al usuario (no tecnico) y la estrategia interna de control de versiones (gitflow + rama por modulo).
