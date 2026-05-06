---
description: "Sincroniza los design tokens del Molins UI Kit desde Figma. Flujo recomendado: plugin Design Tokens (W3C) + normalizacion. Fallback: MCP de Figma."
mode: "implementacion"
---

# Sincronizar Design Tokens — Molins UI Kit

## Por que existen dos ficheros y por que normalizamos

Este proyecto mantiene dos ficheros en `apps/frontend/design-tokens/` (fuera de `src/` porque son assets de diseño, no código de la app):

1. **`molins-ui-kit.w3c.tokens.json`** — export crudo del plugin *Design Tokens* (Lukas Oppermann) de Figma, en formato **W3C Design Tokens**. Es la **fuente autoritativa**: refleja exactamente lo que hay en Figma y es compatible con Style Dictionary.
2. **`molins-ui-kit.json`** — version **normalizada**, generada por `build-normalized.mjs` a partir del W3C.

### Por que no usamos solo el W3C

El fichero W3C tiene caracteristicas que dificultan su consumo directo:

- **Alias sin resolver**: `bg.surface.primary = "{colors.neutrals.100}"`. Para usarlo hay que resolver la referencia cada vez.
- **Hex con alpha embebido**: `"#0c0c0d0d"` (8 caracteres). Hay que separar color + alpha para usar en CSS/JS.
- **Sombras en capas numeradas sin string CSS**: `shadow-2.0`, `shadow-2.1` en lugar de una sola cadena `box-shadow`.
- **Metadata pesada**: cada token incluye `styleId`, `variableId`, `extensions`, `scopes`... irrelevantes para el codigo.
- **Estructura anidada variable**: algunos grupos estan anidados (`bg.surface.primary`), otros planos (`text.error`), otros con claves numericas (`shadow-2.0`).
- **Nombres con espacios y acentos**: `"line height"`, `"wheight"` (typo del plugin), `"semantic tokens"`.

### Que aporta la normalizacion

El fichero normalizado ofrece a los agentes de IA y al codigo frontend:

- **Alias resueltos**: `bg.surface.primary = "#f6f7f7"` + `alias: "colors.neutrals.100"` como referencia.
- **Hex + alpha separados** en sombras, con un string `.css` listo para `box-shadow`.
- **Sombras aplanadas**: `{ layers: [...], css: "0px 2px 4px -2px rgba(...), 0px 4px 6px ..." }`.
- **Sin metadata Figma**: solo lo necesario para aplicar estilos.
- **Claves consistentes** en todos los grupos semanticos (`surface.primary`, `fill.success`...).
- **Nombres normalizados**: `lineHeight`, `weight`, sin espacios ni typos.

Esto hace que el JSON normalizado sea consumible directamente por Tailwind config, CSS variables, o agentes IA sin codigo intermedio de resolucion.

## Opcion 1 — Plugin "Design Tokens" (recomendada)

Via oficial y mas completa. Exporta colores, tipografia, spacing, radius, stroke, sombras, grids y alias siguiendo el **W3C Design Tokens Format**.

Pasos para el usuario:

1. Abrir el archivo de Figma del Molins UI Kit (`rvo1AtV0m41GbQN1JPi8V8`).
2. Menu → **Plugins** → buscar **"Design Tokens"** (autor: Lukas Oppermann).
3. Pulsar **Run** → **Export** → formato **JSON (W3C)**.
4. Guardar el fichero descargado como `apps/frontend/design-tokens/molins-ui-kit.w3c.tokens.json` (sobrescribir).
5. Regenerar la version normalizada:

```bash
pnpm design-tokens:build
```

6. Verificar salida en consola: todas las secciones (colors.primary, neutrals, semantic.bg/text/border, textStyles, space, radius, effects, grids) deben tener conteos > 0.
7. Revisar `molins-ui-kit.json`: `_meta.status === "synced"`, `_meta.lastSyncedAt` con la fecha actual.

## Opcion 2 — MCP de Figma (fallback puntual)

Solo si el plugin no esta disponible o para actualizar un valor aislado. Tiene **limite mensual de llamadas**.

1. `mcp_figma_whoami` para confirmar acceso.
2. `mcp_figma_get_variable_defs` sobre la pagina Styles o nodos concretos.
3. Editar **solo la clave afectada** en `molins-ui-kit.w3c.tokens.json` respetando el formato W3C.
4. Ejecutar `pnpm design-tokens:build` para regenerar.

No inventes valores. Si algo no se puede leer, se deja como estaba y se avisa al usuario.

## Cuando regenerar

Hay que ejecutar `pnpm design-tokens:build` siempre que:

- Se haya actualizado `molins-ui-kit.w3c.tokens.json` (nuevo export del plugin, o edicion manual).
- Se haya cambiado `build-normalized.mjs` (nueva logica de normalizacion).
- La fecha en `_meta.lastSyncedAt` del normalizado parezca desactualizada respecto a cambios recientes en Figma.

## Verificacion final

Despues de la sincronizacion, confirma al usuario:

- Fecha y metodo (`_meta.lastSyncedAt`, `_meta.syncMethod`).
- Numero de tokens por seccion.
- Cualquier token que falte o haya quedado sin resolver.
- Coherencia con el manual de marca: verificar que `primary.green.500 === "#003e39"` (Molins Green), `primary.sky.500 === "#22abf8"` (Sky), y que la paleta secundaria (land/sun/earth) sigue presente.
