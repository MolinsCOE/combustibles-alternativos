---
description: "Usar siempre que se cree o modifique código en apps/. Define la arquitectura obligatoria del proyecto: hexagonal + screaming architecture + reglas de dependencia + anti-overengineering. Es la fuente de verdad arquitectónica; las instrucciones de backend, frontend, security, testing y delivery se apoyan en esta."
---
<!-- AUTO-GENERATED from .shared_ai/instructions/architecture.md — DO NOT EDIT. Run: pnpm sync-ai -->

# Arquitectura del proyecto

Estas reglas son **no negociables** y se aplican a todo `apps/`. Prevalecen sobre cualquier contradicción en otras instrucciones.

## Pilares

Toda decisión de código debe evaluarse contra estos cuatro pilares, en este orden:

1. **Seguridad**: nunca confiar en input externo, nunca exponer datos o errores internos, defensa en profundidad.
2. **Mantenibilidad**: código legible, fronteras claras entre capas, cada pieza tiene una única razón para cambiar.
3. **Rendimiento**: sin optimización especulativa, pero sin anti-patrones evidentes (N+1, fetches redundantes, renders innecesarios).
4. **Escalabilidad**: servicios stateless, sin estado global mutable, sin acoplamientos ocultos entre módulos.

Si un cambio mejora uno pero rompe otro, **paras y preguntas**. No eliges por ti.

## Idioma del código (regla dura)

- **Todo el código interno se escribe en inglés**: nombres de tablas, columnas, índices, constraints, nombres de ficheros, clases, funciones, variables, tipos, puertos, rutas (`/roles`, `/users`), campos de DTO/JSON (`name`, `description`, `createdAt`, `roleId`), esquemas Drizzle, migraciones SQL, mensajes de log técnicos, comentarios del código.
- **El español se reserva para**:
  - Textos visibles al usuario final (UI, labels, mensajes de error legibles, toasts, emails).
  - Documentación funcional y tareas en `plans/<modulo>/` (es la voz del producto, no del código).
  - Mensajes de validación expuestos por la API al frontend (`"El nombre ya existe"`).
- Al crear un módulo nuevo, su identificador técnico (`modules/<name>/`) va en inglés (`users-roles`, no `usuarios-roles`). El identificador en `plans/` puede seguir siendo funcional en español.
- Si un módulo ya existe con nombre en español (caso legado como `usuarios-roles`), no se renombra de oficio — se respeta hasta que el usuario pida refactor. Todo nuevo código dentro de él sí cumple la regla (columnas, tipos y rutas en inglés).

## Lógica de negocio: backend es la fuente de verdad (regla dura)

- **Toda regla de negocio vive en el backend** (`domain/` o `application/use-cases/`). El frontend **no** puede ser la única capa que la aplica.
- El frontend puede replicar validaciones y reglas **solo como refuerzo de UX** (feedback inmediato en formularios, habilitar/deshabilitar botones), nunca como única barrera. El backend **siempre** revalida antes de persistir.
- Prohibido: calcular totales, aplicar descuentos, decidir permisos, validar unicidad, enforzar límites o transiciones de estado únicamente en React. Si se detecta esa situación, **se refactoriza y se mueve al backend** antes de cerrar el cambio.
- Prohibido: confiar en valores calculados por el cliente y persistirlos tal cual (ej. el frontend envía un `total` precalculado). El backend recibe los inputs mínimos necesarios y recalcula él mismo.
- Al añadir una nueva funcionalidad con backend disponible, el flujo obligatorio es: primero diseñar caso de uso + endpoint, después consumirlo desde el frontend. Nunca implementar la regla en frontend "de momento" con idea de moverla luego.

## Contratos API documentados con OpenAPI (regla dura)

- Todo endpoint HTTP **debe estar descrito en OpenAPI 3.x** disponible en `GET /openapi.json` y una UI navegable en `GET /docs`.
- El contrato es **la fuente de verdad** para el consumo: frontend y cualquier otro cliente consumen tipos derivados (o validados) contra ese contrato.
- Los schemas Zod de validación (`body`, `params`, `query`, `response`) se reutilizan para generar la definición OpenAPI; **no se mantienen dos definiciones divergentes**. Si Zod valida algo, OpenAPI lo refleja.
- Al añadir o modificar un endpoint, actualizar el contrato **en el mismo commit**. Un endpoint sin OpenAPI no cierra tarea.
- Respuestas de error siguen un formato uniforme documentado en OpenAPI (`{ error: { code, message, details? } }`). Mensajes legibles en español para el usuario final, `code` técnico en inglés.

## Rendimiento — ejecución eficiente

- Node.js 24 ya ejecuta con **V8 JIT** (TurboFan/Maglev); no hay que activar nada manualmente. Escribir código que el JIT pueda optimizar: funciones monomórficas (mismos tipos en cada llamada), evitar cambios de shape en objetos "calientes", evitar `try/catch` alrededor de bucles críticos, evitar `delete` sobre objetos en hot paths.
- No introducir flags experimentales de V8 ni runtimes alternativos (Bun, Deno) sin aprobación explícita.
- Consultas PostgreSQL: preparar queries (Drizzle ya usa prepared statements), evitar N+1 con joins o carga en lote, paginar siempre lo que pueda crecer, indexar columnas usadas en WHERE/ORDER BY frecuentes.
- Medir antes de optimizar. Perfilar con `--cpu-prof` o `0x` si hay sospecha real. No microoptimizar sin evidencia.

## Qué va en `shared/` vs en un módulo (regla dura)

Antes de crear un tipo, helper, esquema o componente dentro de un módulo, **parar y preguntar**: ¿esto es específico de este dominio, o es una primitiva transversal que otros módulos van a necesitar?

Van a `shared/` desde el inicio:

- **Paginación** (tipos `Pagination`, `Page<T>`, schemas Zod de `page`/`pageSize`, helpers de cálculo `offset`/`limit`, respuesta estándar `{ items, page, pageSize, total }`).
- Errores base de dominio y su mapeo HTTP.
- IDs / value objects universales (UUID branded types, timestamps, dinero si aplica).
- Middleware HTTP (auth, validate, error-handler, rate-limit).
- Cliente de BD, event publisher, clock, config de entorno.
- En frontend: primitivos del design system, http client, hooks de paginación, componentes de lista paginada.

Van en el módulo:

- Entidades propias del dominio y sus invariantes.
- Casos de uso específicos.
- Repositorios (implementan puertos de ese módulo).
- Rutas y controllers del módulo.

Regla de decisión: si tras implementar un primer módulo aparece en un segundo módulo un tipo, helper o componente **casi idéntico**, eso es señal de que debió estar en `shared/` desde el principio → se extrae **antes** de duplicar. No se acepta "lo dejo duplicado y luego refactorizo".

## Screaming Architecture

La estructura de carpetas debe **gritar el dominio**, no el framework.

- En `apps/backend/src/modules/` y `apps/frontend/src/features/` las carpetas se nombran por **concepto de negocio** (`planning`, `backlog`, `usuarios-roles`, `facturacion`), nunca por capa técnica (`controllers`, `services`, `models`).
- Un ojo inexperto debe poder abrir la raíz y entender **qué hace la app** antes que **cómo está hecha**.

## Arquitectura hexagonal por módulo (backend)

Todo módulo en `apps/backend/src/modules/<modulo>/` tiene exactamente esta estructura:

```
<modulo>/
  domain/
    entities/          # Modelos de negocio (interfaces o clases puras)
    ports/             # Interfaces de repositorios y servicios (abstracciones)
    events/            # Eventos de dominio (opcional, sólo si hay handler real)
    validators/        # Reglas de negocio puras (opcional)
  application/
    use-cases/         # Casos de uso: orquestación pura (1 fichero por caso)
    dtos/              # Input/output types de los casos de uso
    handlers/          # Handlers de eventos (opcional)
  infrastructure/
    postgres-<x>.repository.ts   # Implementaciones Drizzle
    <servicios externos>         # Adapters a APIs, colas, etc.
  interfaces/
    <modulo>.controller.ts
    <modulo>.routes.ts
  index.ts             # Barrel con lo que exporta el módulo hacia fuera
```

### Regla de dependencia (dirección única)

```
interfaces  →  application  →  domain
               ↑
infrastructure
```

- `domain/` no importa **nada** de `application`, `infrastructure` ni `interfaces`. Cero dependencias de Express, Drizzle, `req`, `res`, `fetch`, `node:crypto`, Zod, etc.
- `application/` importa sólo de `domain/` (de su módulo).
- `infrastructure/` y `interfaces/` pueden importar de `application/` y `domain/` del mismo módulo.
- Los repositorios se declaran como **puertos** (interfaces TypeScript) en `domain/ports/` y se implementan en `infrastructure/`.

### Regla entre módulos

- Un módulo **no importa el `domain/` de otro módulo** directamente.
- Si dos módulos necesitan comunicarse:
  1. Vía un caso de uso público del otro módulo expuesto en su `index.ts`.
  2. O vía eventos de dominio publicados por el `EventPublisher` compartido.
- Nunca importar controllers o repos de otro módulo. Cero shortcuts.

## Composition root

- **Único lugar** donde se instancian implementaciones concretas: `apps/backend/src/main/composition-root.ts`.
- No existen DI containers, decoradores, reflection ni factories "mágicas". Sólo `new X(deps)` o funciones fabricón explicitas.
- Los casos de uso reciben sus dependencias por constructor o parámetros (inyección por parámetro).
- El composition root es la **única vía** por la que `interfaces/` accede a la `infrastructure/` (pasa instancias ya cableadas).

## Shared backend

`apps/backend/src/shared/`:

- `infrastructure/db/schema/` — esquema Drizzle compartido (una sola fuente de verdad para el schema PostgreSQL).
- `infrastructure/events/` — `InMemoryEventBus` si se usa (sólo si hay handler real).
- `interfaces/http/middleware/` — auth, validación, error handler, rate limit.
- `ports/` — abstracciones compartidas (`EventPublisher`, `Clock`, `DbHealth`).
- `domain/` — tipos o value objects verdaderamente transversales (IDs, errores base). Usar con máxima mesura.
- `errors/` — jerarquía de errores de dominio que los controllers saben mapear.

## Feature-folders (frontend)

Todo módulo funcional en `apps/frontend/src/features/<feature>/`:

```
<feature>/
  pages/             # Vistas de alto nivel (rutas)
  components/        # Componentes del feature (no reutilizados fuera)
  hooks/             # Hooks propios del feature
  services/          # Llamadas al API (HTTP)
  data/              # Tipos/DTOs del feature
  types/             # Tipos internos si hace falta separar
  __tests__/         # Tests del feature (opcional, tambien colocados junto al fichero)
  index.ts           # Barrel con lo público del feature
```

Compartido va en:

- `apps/frontend/src/shared/ui/` — primitivos de UI del design system (Button, Dialog, Tooltip…).
- `apps/frontend/src/shared/components/` — composiciones reutilizables (ProgressBar, MetricDisplay…).
- `apps/frontend/src/shared/utils/` — helpers puros.
- `apps/frontend/src/app/` — layout, contexto global, router wiring (no lógica de negocio).

Reglas:

- Una feature **no importa** de otra feature. Si algo se empieza a compartir, sube a `src/shared/`.
- Antes de crear un componente nuevo, buscar en `src/shared/ui` y `src/shared/components`. **Reutilizar siempre** que la semántica encaje.
- La UI no contiene reglas de negocio. Llama a `services/` (que llama al API). Las validaciones de formulario usan Zod.

## Validación en límites (Zod obligatorio)

- **Backend**: todo endpoint valida `body`, `params`, `query` y headers relevantes con un schema Zod. Si falla → 400 + mensaje genérico. No se llega al caso de uso sin input válido.
- **Frontend**: todo formulario valida con Zod antes de llamar al API. El mismo schema idealmente compartido vía un package `contracts` (si existe); si no, duplicado mínimo.
- `domain/` puede tener sus propios validators puros, pero nunca depende de Zod. Zod vive en `application/` (DTO parsing) o `interfaces/`.

## Eventos de dominio (patrón opcional)

- Disponibles mediante `EventPublisher` (puerto en `shared/ports/`) y `InMemoryEventBus` (implementación en `shared/infrastructure/events/`).
- Se activan **sólo** cuando existe al menos un handler real que reacciona al evento.
- Los handlers se suscriben en `composition-root.ts`. Nunca autosuscripción mágica.
- Un caso de uso puede emitir eventos tras completarse; no se usan como reemplazo de llamadas directas entre casos de uso del mismo módulo.

## Anti-overengineering — Prohibido explícitamente

No introducir salvo petición explícita del usuario y justificación clara:

- DI containers (InversifyJS, tsyringe, NestJS-style decorators).
- Decoradores y reflection.
- Jerarquías de "base repository/service genérico".
- Frameworks de dominio o CQRS/Event Sourcing sin caso real.
- Event bus si no hay handler concreto.
- Abstracciones "por si acaso" (interfaces con una sola implementación que nunca va a cambiar).
- Microservicios, colas, caches, Redis, GraphQL hasta que haya demanda real medida.
- Barrels gigantes de `shared/` que rompan tree-shaking.

Preferir siempre:

- Constructores explícitos + wiring en composition root.
- Un repositorio por agregado, concreto, sin herencia.
- Funciones pequeñas con nombre claro.
- Código directo sobre abstracción especulativa.

## Nombrado

- Ficheros en `kebab-case.ts` (backend y frontend).
- Componentes React en `PascalCase.tsx`.
- Casos de uso: `<verbo>-<entidad>.use-case.ts` (ej. `create-planning.use-case.ts`).
- Repositorios: `postgres-<entidad>.repository.ts`.
- Puertos: `<entidad>-repo.port.ts`.
- Una clase/función principal por fichero.

## Gate obligatorio antes de cerrar cambio

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Si alguno falla, el cambio **no** está listo. No se pide validación al usuario hasta que el gate pase.

## Cómo aplicar estas reglas

- El agente `implementacion` carga esta instrucción antes de crear o modificar código de `apps/`.
- Si una tarea no encaja con estas reglas (por ejemplo, necesita un evento de dominio pero no hay handler), **para y pregunta** antes de improvisar.
- Si dos reglas colisionan (p. ej. reutilización vs. límite de módulo), gana el límite: mover a `shared/` o exponer vía `index.ts` del módulo origen.
