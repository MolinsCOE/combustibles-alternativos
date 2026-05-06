---
description: "Usar siempre que se añadan, modifiquen o revisen iconos en la interfaz. Fija la librería única permitida, el principio de uso mínimo y los criterios de tamaño, color y accesibilidad."
---
<!-- AUTO-GENERATED from .shared_ai/instructions/icons.md — DO NOT EDIT. Run: pnpm sync-ai -->

# Iconografía — reglas obligatorias

Complementa a `design-system.instructions.md` y `brand.instructions.md`. Si hay contradicción, gana marca y design system.

## Librería única permitida

- La única librería de iconos autorizada es **`lucide-react`**.
- **Prohibido** mezclar varias librerías de iconos en la aplicación (Heroicons, Font Awesome, Material Icons, Tabler, etc.).
- Si en el futuro se decide cambiar de librería, se cambia **a la vez en toda la app**, no por pantalla. La migración requiere aprobación explícita.
- **Prohibido** SVG inline sueltos que duplican algo que `lucide-react` ya ofrece.
- **Prohibido** usar emojis como iconos funcionales (botones, estados, menú). Solo caben en mensajes de texto del producto si el copy lo pide.

## Catálogo Molins en Figma (prioridad cuando exista)

- Cuando exista en Figma un catálogo de iconos propio de Molins referenciado desde una pantalla concreta, **ese catálogo manda** sobre `lucide-react` para esa pantalla. Se descarga/exporta siguiendo el flujo de sincronización del design system.
- Mientras no exista catálogo propio, `lucide-react` es la fuente de verdad.

## Principio de uso mínimo

Un icono solo entra en la UI si cumple **al menos una** de estas condiciones:

- Aporta comprensión real (un ojo indica "ver", una papelera indica "eliminar").
- Ahorra espacio en un sitio donde el texto completo no cabe (acciones de tabla en móvil, ítems de menú en barra estrecha).
- Representa un estado reconocible de un vistazo (candado, check, alerta).

**Prohibido** iconos decorativos que no aportan información ni ahorran espacio.

En cualquier PR que añada iconos, el agente debe justificar en una línea por qué cada icono aporta.

## Tamaños estándar

Solo se permiten estos tamaños, según contexto:

| Tamaño | Contexto |
|--------|----------|
| `16` | Acciones en tablas, chips, badges |
| `20` | Ítems de menú, botones estándar, topbar |
| `24` | Hero/encabezados, vacíos ilustrados, tarjetas grandes |

Sin tamaños arbitrarios (ni `18`, ni `22`, ni `32`). Si un caso nuevo no encaja, se añade aquí antes de usarlo.

## Color

- El color del icono **siempre hereda** de su contenedor (`color: currentColor`, que es el default de `lucide-react`).
- **Prohibido** colores hexadecimales hardcodeados en `stroke` o `fill`.
- El color del contenedor se controla con clases Tailwind que respeten los tokens Molins (verdes, neutros, estados). Nunca colores sueltos fuera de paleta.

## Accesibilidad

- Si un icono **acompaña texto visible**, es decorativo a efectos accesibles y debe llevar `aria-hidden="true"`.
- Si un icono **es el único contenido** de un elemento interactivo (botón sin label), el elemento debe tener un `aria-label` traducido (ES + EN) con una clave i18n dedicada. Cumplir siempre `i18n.instructions.md`.
- Botones con icono deben mantener área táctil mínima de 44×44 px (cumplir `responsive.instructions.md`).

## Revisión

- Toda PR que añada iconos justifica cada uno brevemente (una línea por icono).
- Revisar que no se ha introducido una segunda librería de iconos.
- Revisar tamaños (16/20/24), color heredado y accesibilidad.

## Resumen — lo que NO se hace

- Mezclar `lucide-react` con otra librería de iconos.
- Añadir iconos decorativos sin función.
- Tamaños arbitrarios distintos de 16/20/24.
- Colores hardcodeados en el SVG.
- Iconos clicables sin `aria-label` traducido.
- Emojis como iconos funcionales.
- SVG inline duplicando iconos que ya ofrece la librería.
