---
description: "Usar siempre que se diseñe o modifique UI: páginas, layout, menús, tarjetas, tablas, formularios. Obliga a validar toda pantalla en escritorio, tableta y móvil con criterios concretos."
applyTo: "apps/frontend/**"
---

# Diseño responsive — regla dura

Esta instrucción complementa `frontend.instructions.md` y `design-system.instructions.md`. Si algo aquí contradice el design system, gana el design system (los tokens son la fuente de verdad visual); esta instrucción fija el **comportamiento** adaptativo.

## Principio

Escritorio, tableta y móvil son **ciudadanos de primera**. Ninguno es una versión reducida del otro. Toda pantalla debe ser usable y legible en los tres tamaños antes de darse por terminada.

## Breakpoints obligatorios

Se usan los breakpoints estándar de Tailwind. No se inventan nuevos sin aprobación explícita:

- `sm` → 640px (móvil grande).
- `md` → 768px (tableta en vertical).
- `lg` → 1024px (tableta en apaisado / portátil pequeño).
- `xl` → 1280px (escritorio).
- `2xl` → 1536px (escritorio amplio).

El diseño **parte de móvil** (mobile-first): las clases sin prefijo aplican a móvil; los prefijos escalan hacia arriba.

## Reglas duras

1. **Menú adaptativo.**
   - Escritorio (`lg` y superior): menú lateral fijo siempre visible.
   - Tableta (`md`): menú lateral compacto o plegable.
   - Móvil (por debajo de `md`): menú oculto tras un botón hamburguesa que lo abre en overlay o lateral y se cierra al seleccionar una opción.
2. **Tarjetas apilables.** Rejillas de tarjetas, KPIs y bloques de contenido reordenan columnas automáticamente: varias columnas en escritorio, dos en tableta, una sola en móvil. Usar `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` o equivalente.
3. **Tablas usables en móvil.** Los listados largos (tablas de usuarios, roles, etc.) deben seguir siendo usables en móvil. Opciones válidas: desplazamiento horizontal controlado (con indicación visual), colapsado de columnas secundarias, o presentación en forma de lista/tarjeta. Nunca se deja una tabla que salga de la pantalla sin control.
4. **Tamaño táctil mínimo.** Todo elemento interactivo (botón, enlace de menú, icono clicable, celda de tabla clicable) tiene como mínimo **44 × 44 px** de área de toque en móvil. Los iconos pequeños van dentro de un contenedor con padding suficiente.
5. **Tipografía y espaciado escalables.** Los tamaños de texto y los espacios usan los tokens del Molins UI Kit. Se permiten variantes por breakpoint (`text-base md:text-lg`) pero siempre dentro de la escala del design system — nada de valores ad-hoc.
6. **Sin scroll horizontal involuntario.** Ninguna página puede generar scroll horizontal en móvil salvo en zonas expresamente diseñadas para ello (tablas controladas). Imágenes, vídeos y embeds usan `max-w-full`.
7. **Formularios cómodos en móvil.** Inputs a ancho completo en móvil, labels por encima del campo, botones de acción bien separados y con tamaño táctil.
8. **Navegación cerrable en móvil.** Cualquier menú, modal o panel desplegable debe poder cerrarse en móvil con un gesto claro (botón de cerrar, tocar fuera, tecla `Escape` si hay teclado).

## Cómo validar una tarea responsive

Antes de dar por cerrada cualquier tarea que toque UI:

- Probar la pantalla en al menos tres anchos: ~375px (móvil), ~768px (tableta), ~1280px (escritorio). Las devtools del navegador son suficientes.
- Verificar que el menú se comporta como define la regla 1 en cada ancho.
- Verificar que las tarjetas se reordenan (regla 2) y que las tablas siguen siendo usables (regla 3).
- Verificar que no hay scroll horizontal imprevisto (regla 6).
- Verificar que los botones son cómodos de tocar en móvil (regla 4).
- Verificar que cualquier overlay se cierra con facilidad (regla 8).

Si alguno falla, la tarea no está terminada.

## Anti-patrones

- Diseñar solo para escritorio y esperar que "se vea aceptable" en móvil.
- Usar valores fijos en píxeles fuera de los tokens del design system.
- Tablas con muchas columnas sin plan de adaptación para pantallas estrechas.
- Menús que tapan contenido en móvil y no se pueden cerrar con comodidad.
- Botones pequeños amontonados en móvil.
- Introducir breakpoints custom fuera de los de Tailwind sin necesidad justificada.
