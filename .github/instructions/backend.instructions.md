---
description: "Use when modifying backend code: endpoints, services, middleware, database schemas, migrations, queries, or server configuration in apps/backend."
applyTo: "apps/backend/**"
---

# Backend

Estas reglas complementan `architecture.instructions.md`, que es la **fuente de verdad arquitectónica**. Si algo aquí contradice esa, gana arquitectura.

## Estructura obligatoria

```
apps/backend/
  src/
    main/
      server.ts             # Arranque HTTP
      app.ts                # Configuración Express + middlewares
      composition-root.ts   # Única zona con wiring de implementaciones
      config/
        env.ts              # Carga y valida env con Zod
    modules/
      <modulo>/
        domain/
        application/
        infrastructure/
        interfaces/
        index.ts
    shared/
      domain/               # Tipos transversales (usar con mesura)
      ports/                # Abstracciones compartidas
      infrastructure/
        db/schema/          # Schemas Drizzle
        events/             # InMemoryEventBus (opcional)
      interfaces/http/
        middleware/         # auth, validate, error-handler, rate-limit
      errors/               # Errores de dominio base
  __tests__/
    unit/                   # Dominio puro + adapters puros
    integration/            # Flujos HTTP reales con DB (Testcontainers)
    e2e/                    # Playwright (si aplica, prioridad flujos críticos)
    setup/
```

Antes de crear un módulo nuevo: confirmar con el agente o con el usuario que la carpeta no solapa con un módulo existente.

## Responsabilidades por capa

- **`interfaces/` (controllers, routes)**: parsea request, llama al caso de uso, mapea respuesta/errores a HTTP. **Sin lógica de negocio**.
- **`application/use-cases/`**: orquesta dominio y puertos. No conoce Express, no conoce Drizzle. Recibe DTOs, devuelve DTOs o tipos de dominio.
- **`domain/`**: entidades, reglas invariantes, puertos. Puro TypeScript, sin I/O.
- **`infrastructure/`**: implementa puertos del dominio (Drizzle, HTTP clients, filesystem…). Es el único lugar con código framework-specific.

Un caso de uso recibe puertos por constructor:

```ts
// application/use-cases/create-planning.use-case.ts
export class CreatePlanningUseCase {
  constructor(
    private readonly planningRepo: PlanningRepoPort,
    private readonly capacity: CapacityPort,
    private readonly events: EventPublisher,
  ) {}

  async execute(input: CreatePlanningInput): Promise<PlanningId> { /* ... */ }
}
```

## Base de datos y Drizzle

- Schema único en `src/shared/infrastructure/db/schema/index.ts` (o particionado pero re-exportado desde ahí).
- Repositorios concretos sólo en `modules/<modulo>/infrastructure/postgres-*.repository.ts`, implementando los puertos declarados en `domain/ports/`.
- **Drizzle no aparece fuera de `infrastructure/`**. Nunca en use-cases, controllers ni entidades.
- Constraints (CHECK, UNIQUE, FK con ON DELETE) viven en el schema; las reglas invariantes también en dominio. Defensa en profundidad.
- Transacciones orquestadas desde el caso de uso vía un puerto `UnitOfWork` si se necesita; si no, directamente desde el repositorio cuando todo el cambio vive en un único agregado.
- Cambios de schema → `pnpm db:generate` + `pnpm db:push` (o el script equivalente del monorepo). Nunca editar migraciones generadas a mano.

## Validación de inputs (Zod obligatorio)

- Todo endpoint tiene un schema Zod para `body`, `params`, `query` y headers relevantes.
- La validación ocurre en middleware o al inicio del controller, **antes** de construir el DTO que va al caso de uso.
- Si falla: `400` con mensaje genérico y código estable; el detalle completo va a logs, nunca al cliente.
- Env vars validadas con Zod en `main/config/env.ts`; la app no arranca si falta algo obligatorio.

## Errores

- Dominio lanza errores de dominio tipados (ej. `PlanningNotFoundError`, `CapacityExceededError`) desde `shared/errors/` o `modules/<m>/domain/errors/`.
- Middleware de error centralizado traduce error de dominio → HTTP (404, 409, 422, 500) con respuesta consistente `{ code, message }`. Sin stack traces al cliente.
- Los controllers **no** hacen try/catch locales salvo transformación muy específica; dejan que el middleware maneje.

## Logging y observabilidad

- Logging estructurado (JSON o key-value).
- Nivel por evento: `info` arranque y eventos relevantes, `warn` degradaciones, `error` fallos no esperados.
- Prohibido loguear secretos, tokens, passwords, PII, connection strings.
- Incluir un `requestId` propagado por middleware en toda respuesta y en los logs de ese request.

## Seguridad

- Aplicar sin excepciones `security.instructions.md`.
- Todo endpoint protegido declara su middleware de auth + authz explícitos en la definición de rutas.
- Rate limit en endpoints expuestos (login, register, endpoints públicos).
- Body size límite explícito (`express.json({ limit: '100kb' })` por defecto, ajustar con razón).

## Rendimiento y escalabilidad

- Servicios stateless. Prohibido estado global mutable (singletons con estado, caches locales). Cache, si aparece, vive detrás de un puerto y se instancia en composition-root.
- Evitar N+1: al devolver listas con relaciones, usar joins/Drizzle relations o batching.
- `EXPLAIN ANALYZE` antes de optimizar queries complejas.
- No se introduce Redis, colas ni caches sin justificación medida.

## Gate de validación

Antes de cerrar un cambio:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Si el cambio toca endpoints críticos, además `pnpm test:e2e`.

## Lo que NO debes hacer

- Meter Drizzle, `req`/`res`, Express, fetch o `node:*` en `domain/` o `application/`.
- Crear "base repository" genéricos con herencia.
- Usar DI containers, decoradores o reflection.
- Importar entre módulos saltando `index.ts` o tocando `domain/` de otro módulo.
- Añadir un event bus si no hay handler real suscrito.
- Devolver errores con stack traces, rutas internas o nombres de tablas.
- `any`, `// @ts-ignore` sin comentario, `as unknown as` sin justificación.

## Contrato OpenAPI (regla dura)

- Todo endpoint HTTP está documentado en `GET /openapi.json` y servido con UI en `GET /docs`.
- La definición OpenAPI se **genera a partir de los schemas Zod** usados para validar (no se mantienen dos fuentes). Usar una librería que convierta Zod ↔ OpenAPI (p. ej. `@asteasolutions/zod-to-openapi` o equivalente aprobado) — no escribir YAML a mano.
- Cada endpoint declara: método, ruta, parámetros, body, posibles respuestas (200/201/400/404/409/422/500) con su schema y un ejemplo realista.
- Formato uniforme de error documentado: `{ error: { code: string, message: string, details?: unknown } }`. Los `code` son estables y en inglés (`ROLE_NAME_ALREADY_EXISTS`, `USER_NOT_FOUND`, `ROLE_IN_USE`). Los `message` son en español legibles por el usuario.
- Cuando se añade o modifica un endpoint, la definición OpenAPI se actualiza **en el mismo commit**. Una tarea de endpoint sin OpenAPI no cierra.

## Idioma del código (regla dura)

- Todo el código interno del backend va en **inglés**: nombres de módulos (`modules/users-roles/`), entidades (`User`, `Role`), puertos (`UserRepositoryPort`), casos de uso (`CreateUserUseCase`), tablas (`users`, `roles`), columnas (`id`, `name`, `email`, `role_id`, `created_at`), rutas HTTP (`/users`, `/roles`), campos JSON (`name`, `roleId`, `createdAt`), logs técnicos, comentarios.
- El español solo aparece en:
  - `error.message` devuelto por la API (lo va a leer el usuario final).
  - Textos semilla si los hay (ej. descripción del rol "Admin" en español si así lo pide el producto).
  - Plan funcional en `plans/<modulo>/`.
- Un módulo legado con nombre en español (p. ej. `usuarios-roles/`) se respeta hasta que el usuario pida refactor, pero **todo código nuevo dentro** de él ya cumple la regla (tablas/columnas/rutas en inglés).

## Lógica de negocio: siempre en backend (regla dura)

- Toda regla de negocio reside en `domain/` o `application/use-cases/`. El frontend no puede ser la única capa que la aplica. Ver `architecture.instructions.md`.
- Si al revisar una tarea se detecta que una regla crítica vive solo en React, se refactoriza (caso de uso + endpoint) antes de cerrar el cambio.
- El backend **siempre revalida** antes de persistir: unicidad, permisos, invariantes, transiciones de estado. No confiar en valores precalculados por el cliente.

## Paginación y utilidades transversales (regla dura)

- Paginación, ordenación, filtros estándar y respuesta `{ items, page, pageSize, total }` viven en `shared/` (tipos + helpers + schemas Zod) desde el primer módulo que los use. No se duplican por módulo.
- Si un segundo módulo está a punto de copiar un helper del primero, se extrae a `shared/` **antes** de duplicar. No se acepta "lo dejo duplicado y luego refactorizo".

## Rendimiento — ejecución eficiente (Node 24 + JIT)

- Node 24 ejecuta con V8 JIT (TurboFan/Maglev) sin configuración extra. Escribir código que el JIT pueda optimizar:
  - Funciones monomórficas en hot paths (mismos tipos en cada llamada).
  - Evitar mutar la "shape" de objetos usados en loops críticos (añadir propiedades tarde, usar `delete`).
  - Evitar `try/catch` envolviendo bucles calientes; capturar en el borde.
  - Preferir arrays tipados y estructuras predecibles en cálculos pesados.
- PostgreSQL: Drizzle ya usa prepared statements. Indexar columnas usadas en WHERE/ORDER BY/JOIN. Paginar todo lo que pueda crecer. `EXPLAIN ANALYZE` si una query supera presupuesto de tiempo.
- No activar flags experimentales de V8 ni cambiar de runtime (Bun/Deno) sin aprobación explícita.
