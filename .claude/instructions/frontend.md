---
description: "Use when modifying frontend code: React components, hooks, styles, routing, state management, or Vite configuration in apps/frontend."
---
<!-- AUTO-GENERATED from .shared_ai/instructions/frontend.md — DO NOT EDIT. Run: pnpm sync-ai -->

# Frontend

Estas reglas complementan `architecture.instructions.md`. Si algo aquí contradice esa, gana arquitectura.

Además, toda UI debe cumplir obligatoriamente:

- `i18n.instructions.md` — cero textos fijos; ES y EN sincronizados desde el primer momento.
- `responsive.instructions.md` — toda pantalla validada en escritorio, tableta y móvil antes de cerrar la tarea.
- `icons.instructions.md` — librería única (`lucide-react`), uso mínimo y coherente, tamaños 16/20/24, color heredado y accesibilidad obligatoria.

## Estructura obligatoria

```
apps/frontend/
  src/
    main.tsx
    App.tsx
    index.css
    app/                       # Layout, contexto global, router wiring
      layout/
      context/
    features/
      <feature>/
        pages/                 # Vistas de alto nivel (rutas)
        components/            # Componentes propios del feature
        hooks/                 # Hooks del feature
        services/              # Llamadas al API (HTTP)
        data/ | types/         # DTOs y tipos del feature
        __tests__/             # Tests (opcional; también junto al fichero)
        index.ts               # Barrel con lo público del feature
    shared/
      ui/                      # Primitivos del design system (Button, Dialog…)
      components/              # Composiciones reutilizables
      utils/                   # Helpers puros
      hooks/                   # Hooks transversales
      services/                # HTTP client compartido (fetch/axios wrapper)
      types/                   # Tipos compartidos
  design-tokens/               # Fuera de src/. No tocar a mano; se sincroniza vía script
```

## Reglas de módulos

- Una feature **no importa** de otra feature. Si algo se empieza a compartir, sube a `src/shared/`.
- Toda feature exporta por su `index.ts` únicamente lo que consume el exterior (normalmente páginas y, en raros casos, hooks/componentes públicos).
- Antes de crear un componente nuevo, buscar en `src/shared/ui` y `src/shared/components`. **Reutilizar siempre** que la semántica encaje.
- La UI **no** contiene reglas de negocio. Lógica va en hooks/services del feature; vista sólo compone y llama.

## Componentes y estado

- Componentes pequeños, tipados con `interface` de props explicita.
- Sin class components. Sin HOCs complejos.
- Estado local con `useState`/`useReducer`. Estado compartido dentro de un feature con Context propio del feature (en `app/context/` sólo si es global real: sesión, tema).
- No se introducen Redux, Zustand, Recoil ni similares sin aprobación explícita del usuario.
- No se introducen librerías de routing, UI o estado adicionales sin aprobación explícita.

## CSS y naming (reglas duras)

- **CSS viaja con el componente**: cuando un componente introduce clases CSS nuevas, la actualización del `.css` va en el mismo commit. Nunca fusionar UI sin estilos — un componente sin su CSS produce bugs visuales en review.
- **Textarea de chat/composer**: siempre `resize: none`, `overflow-y: auto`, `min-height` fija razonable y `max-height` que no rompa el layout. Prohibido `resize: vertical` en textareas de interfaz de chat — el usuario arrastraría y rompería el layout.
- **Labels = entidad del modelo de datos**: si el backend llama `project` a la entidad, la UI muestra "proyecto" — no "chat", "sesión" ni sinónimos. Consultar el schema Drizzle antes de nombrar elementos visuales.

## Data fetching y formularios

- Todas las llamadas al API pasan por un **HTTP client compartido** en `src/shared/services/` (un solo lugar donde se configura base URL, auth, manejo de errores).
- Cada feature expone su propio `*.service.ts` que consume ese cliente y devuelve tipos del feature.
- Gestionar siempre los tres estados: `loading`, `error`, `empty`, además del estado de éxito.
- Formularios validan con **Zod** antes de enviar. Mostrar mensajes de error por campo sin exponer detalles internos.

## Lógica de negocio: solo refuerzo de UX (regla dura)

- El frontend **nunca** es la fuente de verdad de una regla de negocio. Toda validación crítica, cálculo, permiso, unicidad o invariante vive en el backend (`domain/` o `application/use-cases/`). Ver `architecture.instructions.md` — la regla general manda.
- Lo que sí hace el frontend:
  - Validación de forma (formato de email, campos requeridos, longitudes) para dar feedback inmediato y evitar peticiones innecesarias.
  - Habilitar/deshabilitar controles según estado o rol, sabiendo que es solo UX — el backend vuelve a validar siempre.
  - Presentar los errores devueltos por el backend de forma legible (por campo cuando el backend los localiza).
- Lo que **no** hace el frontend: calcular totales finales, aplicar descuentos de negocio, decidir si se puede ejecutar una acción sensible sin preguntar al backend, enviar datos precalculados que el backend asume como válidos.
- Si al implementar una feature aparece una regla de negocio que "solo" se aplica en React, se **para y se mueve al backend** (caso de uso + endpoint) antes de cerrar la tarea.

## Consumo de contratos OpenAPI

- El frontend consume los endpoints documentados en `GET /openapi.json`. Los tipos TypeScript de las respuestas y los payloads deben coincidir con el contrato — idealmente generados a partir de él (o validados con Zod que replique el schema del backend).
- Cuando un endpoint cambia, se actualiza el servicio del feature en el mismo cambio. No se deja el frontend usando la forma antigua.
- Los mensajes de error del backend llegan con un formato uniforme (`{ error: { code, message, details? } }`). El frontend los muestra tal cual al usuario (en español, ya legible) y usa `code` para decidir comportamiento (ej. destacar el campo `email` si `code === "EMAIL_ALREADY_EXISTS"`).

## Cartel de vista previa con datos simulados (regla dura)

- Existe un componente reutilizable `DemoBanner` en `src/shared/components/DemoBanner.tsx`. **NO se elimina nunca** del codebase — es una pieza reutilizable para futuros desarrollos que arranquen en modo maqueta.
- Lo que se retira, cuando una feature conecta con la API real, es el **uso** (la llamada `<DemoBanner />`) en esa pantalla concreta. El componente queda disponible para otros features.
- El cartel solo se **monta** mientras la pantalla/feature usa datos mock en memoria. En cuanto la feature pasa a consumir la **API real**, se retira su uso de esa pantalla en el mismo cambio. **No pueden coexistir datos reales + cartel de vista previa**: es incoherente para el usuario.
- El banner se monta **por feature**, no a nivel global de `App`. Así una feature puede estar conectada (sin cartel) mientras otra sigue en maqueta (con cartel).
- Si se añade/quita el uso del cartel, revisar también los textos internos de la feature (toasts, subtítulos) para que no digan "solo en esta vista previa" cuando ya hay persistencia real.

## Design System — Molins UI Kit

- Consulta `.github/instructions/design-system.instructions.md` antes de crear componentes visuales.
- Tokens en `apps/frontend/design-tokens/molins-ui-kit.json` (normalizado) y `molins-ui-kit.w3c.tokens.json` (crudo, autoritativo). Están fuera de `src/` porque son assets del proyecto, no código de la app.
- No inventes componentes que ya existen en el kit. Busca primero.
- Si faltan tokens, ejecutar `pnpm design-tokens:build` tras actualizar el fichero W3C. Ver `.github/prompts/sync-figma-tokens.prompt.md`.

## Identidad de marca — Molins

- Consulta `.github/instructions/brand.instructions.md` para logo, símbolo, favicon, tono y nomenclatura.
- Activos en `apps/frontend/public/brand/`. Favicon y apple-touch-icon ya configurados.
- Nunca inventes colores fuera de la paleta oficial ni modifiques los PNG de marca.

## UX y resiliencia

- Accesibilidad básica: semántica HTML, `label` asociado a `input`, contraste, navegable por teclado, `aria-*` cuando falte semántica nativa.
- Error boundaries en los límites lógicos (página, sección crítica) para evitar que un fallo tumbe la app entera.
- Sin `dangerouslySetInnerHTML` con datos de usuario. React ya escapa JSX por defecto.

## Seguridad

- No almacenar tokens ni datos sensibles en `localStorage`. Preferir httpOnly cookies (config en backend).
- El frontend nunca es la fuente de verdad de autorización: oculta o deshabilita UI por rol, pero el backend vuelve a validar siempre.
- Ver `security.instructions.md` para el resto.

## Rendimiento

- Lazy load de páginas pesadas con `React.lazy` + `Suspense`.
- `memo`, `useMemo`, `useCallback` sólo cuando hay re-render medido o componente en lista larga. No por reflejo.
- Imágenes de marca y assets grandes servidos desde `public/` con tamaño adecuado; preferir SVG cuando sea posible.

## Gate de validación

Antes de cerrar un cambio de frontend:

```
pnpm lint && pnpm typecheck && pnpm build
```

Si el cambio afecta flujos críticos (login, alta de entidad principal, búsqueda): `pnpm test:e2e`.

## Lo que NO debes hacer

- Mezclar lógica de negocio en componentes de UI.
- Importar entre features.
- Crear duplicados de componentes que ya existen en `shared/ui`.
- Introducir Redux/Zustand/MobX/React Query/similar sin aprobación explícita.
- `any`, `// @ts-ignore` sin justificación.
- Hacer fetch directo desde un componente sin pasar por un `service`.
