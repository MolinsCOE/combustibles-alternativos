---
modulo: experiencia-visual
creado: 2026-04-16
plan: plans/experiencia-visual/plan-experiencia-visual-2026-04-16.md
---

# Tareas Funcionales — Experiencia Visual

## Fase 1 — Reglas del repositorio

**Objetivo:** dejar escritas las normas internas para que todo desarrollo futuro nazca con idioma y responsive obligatorios.

### ✅ T1.1 — Regla de internacionalización obligatoria
**Descripción:** Añadir una instrucción interna que obligue a que ningún texto visible pueda quedar fijo en el código; toda frase nueva o modificada debe tener su clave en español y en inglés desde el primer momento.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T1.2 — Regla de diseño responsive obligatorio
**Descripción:** Añadir una instrucción interna que obligue a validar toda pantalla nueva en escritorio, tableta y móvil, con criterios claros de menú adaptativo, tarjetas apilables y tamaño cómodo para dedos en móvil.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T1.3 — Regla de uso de iconos mínimo y coherente
**Descripción:** Añadir una instrucción interna que fije el criterio de iconografía de la aplicación: usar los iconos mínimos necesarios (no decorativos), que sean reconocibles y coherentes entre sí, alineados con Molins y, cuando exista, con el catálogo definido en Figma. Define la librería única de iconos permitida, el tamaño estándar, el uso de color y la obligación de acompañar cada icono con un texto accesible. Prohíbe mezclar varias librerías de iconos y el uso decorativo sin función.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:** las tres reglas existen como documentos del repositorio y son localizables por los agentes.

## Fase 2 — Infraestructura de idioma

**Objetivo:** preparar la base técnica de idiomas sin romper lo existente.

### ✅ T2.1 — Soporte de español e inglés
**Descripción:** Habilitar la aplicación para trabajar con español e inglés como idiomas soportados, dejando la puerta abierta a añadir más en el futuro sin rehacer la base.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T2.2 — Detección automática del idioma del navegador
**Descripción:** Al abrir la aplicación, si el navegador del usuario está en inglés (o en otro idioma soportado), la interfaz arranca en ese idioma; si no, arranca en español.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T2.3 — Memoria de la elección del usuario
**Descripción:** Cuando el usuario elige un idioma desde el selector, su elección se recuerda en el propio navegador y se respeta en futuras visitas y al recargar.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:** la aplicación ya soporta cambio de idioma en tiempo real aunque todavía queden textos por traducir.

## Fase 3 — Migración de textos existentes

**Objetivo:** que ningún texto visible de lo ya construido quede fijo en el código.

### ✅ T3.1 — Traducir textos de la zona de Usuarios
**Descripción:** Todos los literales visibles de la pantalla de usuarios (títulos, columnas, botones, mensajes) pasan a claves de traducción en español e inglés.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.2 — Traducir textos de la zona de Roles
**Descripción:** Todos los literales visibles de la pantalla de roles (títulos, columnas, botones, mensajes) pasan a claves de traducción en español e inglés.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.3 — Traducir textos de Salud del sistema
**Descripción:** Todos los textos relacionados con Salud del sistema pasan a claves de traducción en español e inglés. Como Salud deja de ser una pantalla propia y pasa a integrarse como widget dentro de Home, las traducciones se preparan pensando en ese nuevo uso (etiquetas cortas tipo "Estado del sistema", "Operativo", "Con incidencias", etc.).
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.4 — Traducir textos de la barra y el armazón común
**Descripción:** Todos los textos del layout (barra de navegación, títulos comunes, enlaces) pasan a claves de traducción en español e inglés.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:** cambiar el idioma cambia absolutamente todos los textos visibles, sin excepción.

## Fase 4 — Nueva navegación

**Objetivo:** que el menú se vea profesional, con marca Molins, y reorganizar los accesos.

### ✅ T4.1 — Menú con fondo claro y toques Molins
**Descripción:** Rediseñar la barra de navegación con fondo claro, colores corporativos Molins en estados activos, sombras suaves y espaciado consistente con la marca, de forma que el logo se lea con claridad.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T4.2 — Agrupar Usuarios y Roles bajo "Administración"
**Descripción:** Crear el apartado "Administración" en el menú con submenú desplegable que contiene Usuarios y Roles, sin perder los accesos existentes.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T4.3 — Selector de idioma en la barra
**Descripción:** Añadir en la barra un desplegable con las opciones "ES" y "EN" que permite cambiar el idioma al instante y recuerda la elección.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:** el menú es limpio, la marca se ve, Administración agrupa correctamente y el idioma se cambia desde la propia barra.

## Fase 5 — Páginas nuevas

**Objetivo:** ofrecer una entrada clara y una página de información básica.

### ✅ T5.1 — Página Home con bienvenida
**Descripción:** Crear la pantalla de inicio con un título de bienvenida sobrio y limpio, como primer bloque visible.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T5.2 — Tarjetas de accesos rápidos en Home
**Descripción:** Añadir en Home dos tarjetas visibles con icono, título y breve descripción, que llevan respectivamente a Administración → Usuarios y Administración → Roles.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T5.3 — KPIs básicos en Home
**Descripción:** Mostrar en Home dos contadores destacados: número total de usuarios y número total de roles, usando los datos ya disponibles.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T5.4 — Widget de Salud del sistema en Home
**Descripción:** Integrar en Home un widget que muestra el estado de salud del sistema (la misma información que hoy vive en la pantalla de Salud del sistema), con un indicador claro de "operativo" o "con incidencias". Con esto, la opción "Salud del sistema" deja de aparecer en el menú principal y su contenido queda accesible desde Home.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T5.5 — Página de Información con nombre y versión
**Descripción:** Crear una página "Información" que muestra el nombre de la aplicación y su versión actual.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T5.6 — Texto de propósito editable en Información
**Descripción:** Añadir en la página de Información un bloque de texto con el propósito de la aplicación, entregado como texto genérico de tipo "Describe aquí el propósito de la aplicación" en español e inglés, de forma que se pueda cambiar después editando solo los textos de traducción.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:** desde Home se accede rápido a Usuarios y Roles, se ven los dos contadores y el estado de salud del sistema, y la página de Información muestra nombre, versión y un propósito editable.

## Fase 6 — Responsive

**Objetivo:** que la aplicación se vea y se use igual de bien en escritorio, tableta y móvil.

### ✅ T6.1 — Menú responsive (lateral / hamburguesa)
**Descripción:** El menú se comporta como lateral fijo en escritorio, plegable en tableta, y oculto tras un botón hamburguesa en móvil, cerrándose al seleccionar una opción.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T6.2 — Tarjetas y KPIs adaptativos en Home
**Descripción:** Las tarjetas de accesos rápidos y los contadores de Home se reordenan automáticamente: varias columnas en escritorio, dos en tableta, una sola en móvil.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T6.3 — Revisión de listados de Usuarios y Roles en móvil
**Descripción:** Las tablas de Usuarios y Roles se mantienen legibles y usables en móvil, con una adaptación razonable (desplazamiento horizontal controlado o presentación en lista).
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T6.4 — Revisión general de espaciado y tipografía
**Descripción:** Ajustar márgenes, tamaños de texto y tamaños mínimos de elementos interactivos para que la experiencia sea cómoda en cualquier ancho de pantalla.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:** en un móvil la aplicación se ve ordenada, se puede navegar cómodamente y todas las pantallas son usables.

## Fase 7 — Validación final

**Objetivo:** confirmar que todo el módulo cumple lo acordado.

### ✅ T7.1 — Verificación contra criterios de aceptación
**Descripción:** Revisar punto por punto los criterios funcionales de éxito del plan (logo visible, idiomas, detección automática, persistencia, Home, Información, Administración, responsive, sin cambios de backend) y dejar constancia de que todos están cumplidos.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:** el usuario confirma que ve lo esperado en escritorio, tableta y móvil, en español y en inglés, y da el módulo por cerrado.
