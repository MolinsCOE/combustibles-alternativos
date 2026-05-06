---
description: "Use when implementing UI components, applying styles, choosing colors/typography, referencing the design system, or working with the Molins UI Kit. Also use when creating new visual components, reviewing design consistency, or checking available UI patterns."
---
<!-- AUTO-GENERATED from .shared_ai/instructions/design-system.md — DO NOT EDIT. Run: pnpm sync-ai -->

# Design System — Molins UI Kit

> **Separacion de responsabilidades**:
> - Esta instruccion cubre **tokens y componentes** (como pintar pixeles coherentes).
> - La identidad de marca (logo, simbolo, tono de voz, nombres, favicon, etc.) esta en [brand.instructions.md](brand.instructions.md). Cargar ambas al implementar UI.

## Fuente de verdad

El sistema de diseño de referencia es el **Molins · Library (UI Kit)** de Figma.

- **URL Figma**: https://www.figma.com/design/rvo1AtV0m41GbQN1JPi8V8/Molins-%C2%B7-Library
- **File key**: `rvo1AtV0m41GbQN1JPi8V8`
- **Copia local normalizada**: `apps/frontend/design-tokens/molins-ui-kit.json` (primera opcion)
- **Export W3C crudo**: `apps/frontend/design-tokens/molins-ui-kit.w3c.tokens.json` (fuente autoritativa para alias/detalles)
- **Flujo de re-sincronizacion**: `.github/prompts/sync-figma-tokens.prompt.md`

## Estrategia de acceso (fallback)

Cuando necesites consultar el sistema de diseño, sigue este orden:

### 1. Primero: copia local normalizada

Lee `apps/frontend/design-tokens/molins-ui-kit.json`. Es la fuente preferida porque:
- Alias ya resueltos a hex/px reales.
- Estructura estable y predecible para codigo e IA.
- No consume llamadas MCP.

Comprueba `_meta.status`:
- `"synced"` → usar directamente.
- cualquier otro estado → re-sincronizar antes de usar.

### 2. Si necesitas detalle crudo o verificar un alias

Lee `molins-ui-kit.w3c.tokens.json` (formato W3C Design Tokens). Util para ver referencias `{colors.neutrals.900}` sin resolver o metadata de variables.

### 3. Solo si falta algo critico

Usa `mcp_figma_*` para consultar Figma en vivo. Hay limite mensual de llamadas, usalo con moderacion. Casos tipicos:
- Una especificacion visual concreta de un componente que no esta en los tokens.
- Confirmar un valor que aparece dudoso.

### Si no puedes acceder a ninguna fuente

- Aplica neutros seguros coherentes con Material Design (base del kit).
- Marca los valores provisionales con `// TODO: aplicar tokens Molins UI Kit`.
- NO inventes hex, px ni nombres de componentes.

## Componentes disponibles en el kit

Estos son los componentes definidos en el Molins UI Kit. Antes de crear un componente nuevo, verifica si ya existe uno equivalente:

| Componente | Uso principal |
|---|---|
| Logo | Logotipo corporativo |
| Alert | Mensajes de estado inline (info, warning, error, success) |
| Button | Acciones del usuario (variantes de estilo y tamaño) |
| Checkbox | Seleccion multiple |
| Radio Button | Seleccion unica en grupo |
| Switch | Toggle on/off |
| Chip | Etiquetas, filtros, tags |
| Navigation / Menu | Navegacion principal y menus |
| Chart | Graficos y datos visuales |
| Tooltip | Info contextual al hover |
| Dropdown | Selector desplegable |
| Popup / Modal | Dialogos y ventanas emergentes |
| Calendar | Selector de fechas |

## Iconos

El kit usa dos sets de iconos:
- **Molins**: iconos corporativos propios
- **Heroicons**: libreria open source como complemento

Al implementar iconos, prioriza Heroicons (ya disponible como dependencia open source) y reserva los iconos Molins para branding.

## Reglas para agentes

- **No inventes componentes** que no estan en el kit sin justificacion.
- **No dupliques** componentes del kit con implementaciones custom.
- **Respeta la nomenclatura** del kit al nombrar componentes React.
- **Los tokens son de solo lectura** — nunca modifiques `molins-ui-kit.json` manualmente: es generado por `build-normalized.mjs` desde el fichero W3C.
- Para actualizar tokens: ver `.github/prompts/sync-figma-tokens.prompt.md` (opcion recomendada: plugin Design Tokens + `pnpm design-tokens:build`).
