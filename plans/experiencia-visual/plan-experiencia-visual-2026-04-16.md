---
modulo: experiencia-visual
creado: 2026-04-16
tareas: plans/experiencia-visual/tareas-experiencia-visual-2026-04-16.md
---

# Plan Funcional — Experiencia Visual

## 1. Resumen ejecutivo

Este módulo eleva la capa visual y de experiencia de la aplicación sin añadir funcionalidad de negocio nueva. Se rediseña la navegación principal con identidad Molins, se reorganiza el acceso a los módulos existentes bajo un apartado de Administración, se crean dos páginas de soporte (Home e Información), se incorpora soporte multi-idioma (español e inglés) y se garantiza que la aplicación funcione con la misma calidad en escritorio, tableta y móvil.

El módulo también deja preparadas las reglas del repositorio para que, a partir de aquí, cualquier desarrollo futuro nazca ya con internacionalización y diseño responsive obligatorios, evitando deuda técnica desde el origen.

## 2. Objetivo del producto

Ofrecer una primera impresión profesional, coherente con la marca Molins, usable desde cualquier dispositivo y disponible en los idiomas de trabajo habituales, manteniendo intacta toda la lógica ya existente de usuarios, roles y salud del sistema.

## 3. Problema que resuelve

- El menú actual tiene fondo oscuro y el logo Molins no se lee correctamente.
- Los textos están escritos fijos en español, lo que impide atender a usuarios en otros idiomas.
- No existe una página de entrada que oriente al usuario ni una página de información básica de la aplicación.
- La navegación es plana: los módulos administrativos (usuarios, roles) no están agrupados y conviven al mismo nivel que el resto.
- No hay garantía de que la experiencia en tableta o móvil sea equivalente a la de escritorio.

## 4. Usuarios y perfiles

- **Usuario administrador**: entra a gestionar usuarios y roles desde cualquier dispositivo.
- **Usuario consultor**: entra a revisar información general o el estado del sistema.
- **Usuario no castellanohablante**: necesita ver la aplicación en inglés.

Todos comparten el mismo menú y la misma estructura; lo que cambia es el idioma y el tamaño de pantalla.

## 5. Alcance del MVP

- Nueva navegación principal con fondo claro, toques Molins, sombras y espaciado consistente.
- Agrupación del acceso a Usuarios y Roles bajo un apartado **Administración** con submenú.
- Dos páginas nuevas: **Home** e **Información**.
- Selector de idioma (ES / EN) visible en la barra de navegación.
- Infraestructura de internacionalización con detección automática del idioma del navegador, valor por defecto español, y memoria de la elección del usuario en el propio navegador.
- Migración de todos los textos fijos existentes (en usuarios, roles, salud y layout) a claves de traducción.
- Comportamiento responsive completo: menú lateral en escritorio, menú compacto/hamburguesa en móvil, tarjetas que se reordenan, legibilidad en cualquier ancho.
- Actualización de las reglas internas del repositorio para que, en adelante, internacionalización y responsive sean obligatorios en cualquier desarrollo nuevo.

## 6. Fuera de alcance

Queda **explícitamente fuera** de este módulo:

- **Aplicación móvil nativa o envoltorio tipo Capacitor.** Este módulo es solo web responsive.
- **Modo PWA o instalable.** No se incorpora en esta iteración.
- **Cambios en la lógica de backend.** No se tocan endpoints, base de datos, reglas de negocio ni permisos.
- **Módulos funcionales nuevos.** No se crean nuevas entidades, ni pantallas de gestión adicionales.
- **Créditos, información legal, datos de contacto o descripción del stack técnico** en la página de Información.
- **Traducción a idiomas distintos de español e inglés** en esta iteración (la base queda preparada para añadir más en el futuro).
- **Modo claro / modo oscuro configurable por el usuario.** Solo se entrega el modo claro alineado con la marca.

## 7. Navegación propuesta

### Estructura

- **Home** (página de inicio). Incluye el estado de salud del sistema como widget; ya no aparece como opción de menú independiente.
- **Administración** (apartado con submenú):
  - Usuarios.
  - Roles.
- **Información** (acerca de la aplicación).
- **Selector de idioma**: ES / EN, en la propia barra de navegación.

La antigua entrada "Salud del sistema" deja de ser una opción del menú y su contenido se integra dentro de la Home.

### Aspecto visual

- Fondo del menú claro (blanco o muy claro) para que el logo Molins se lea con claridad.
- Toques de color Molins (verde corporativo y/o sky) en estado activo, hover y separadores.
- Tipografía Be Vietnam Pro.
- Sombras suaves y bordes redondeados consistentes con el Molins UI Kit.
- Iconografía Molins + Heroicons como complemento.

### Comportamiento

- En **escritorio**: menú lateral fijo, siempre visible.
- En **tableta**: menú lateral más compacto o plegable.
- En **móvil**: menú oculto tras un botón tipo hamburguesa; al abrirse ocupa la pantalla o se despliega lateralmente, y se cierra al seleccionar una opción.

## 8. Páginas nuevas

### 8.1 Home

Bloques visibles, de arriba a abajo:

1. **Bienvenida**: título corto y una frase de bienvenida neutra. Mínimo, limpio, sin ruido visual.
2. **Tarjetas de accesos rápidos**:
   - Tarjeta "Usuarios" → lleva a Administración → Usuarios.
   - Tarjeta "Roles" → lleva a Administración → Roles.
   - Cada tarjeta muestra título, breve descripción y un icono.
3. **KPIs básicos**:
   - Número total de usuarios.
   - Número total de roles.
   - Se muestran como tarjetas o contadores destacados, consumiendo los datos ya existentes (sin crear endpoints nuevos; si el dato se obtiene con llamadas ya existentes, se reutilizan).
4. **Estado de salud del sistema**: widget que refleja el estado actual de la aplicación (la misma información que hoy está en la pantalla de Salud del sistema), con un indicador claro de "operativo" o "con incidencias". Sustituye a la antigua entrada de menú y se integra en Home como parte de la visión general.

### 8.2 Información (About)

Contenido mínimo:

1. **Nombre de la aplicación** y **versión** actual.
2. **Propósito de la aplicación**: texto libre editable. Se entrega con un texto genérico tipo "Describe aquí el propósito de la aplicación" como clave de traducción, de forma que el usuario final pueda modificarlo en el futuro simplemente editando el texto (en español e inglés) sin tocar lógica.

No se incluyen en esta iteración: créditos, información de contacto, avisos legales, ni detalles del stack técnico.

## 9. Internacionalización (i18n)

- Idiomas soportados: **español (ES)** e **inglés (EN)**.
- **Idioma por defecto**: español.
- **Detección automática**: si el navegador del usuario está configurado en inglés u otro idioma, y ese idioma está soportado, se usa ese; si no, se cae al español.
- **Persistencia**: la elección manual del usuario en el selector se recuerda en el propio navegador, de modo que próximas visitas la respeten.
- **Cobertura**: absolutamente todos los textos visibles de la aplicación (incluyendo los ya existentes en usuarios, roles, salud y layout) pasan a claves de traducción. No puede quedar ningún texto fijo en el código.
- **Textos de formularios, mensajes de error y confirmaciones**: también traducidos.
- **Formato de fechas y números**: consistente con el idioma activo cuando aplique.

## 10. Diseño responsive

- **Desktop, tableta y móvil** se tratan como ciudadanos de primera. Ninguno es "versión reducida" del otro.
- **Menú**: lateral fijo en escritorio, plegable en tableta, oculto tras hamburguesa en móvil.
- **Tarjetas de Home**: se reordenan en columnas en escritorio, en dos columnas en tableta y en una sola columna en móvil.
- **Tablas de usuarios y roles**: deben seguir siendo legibles en móvil (scroll horizontal controlado o adaptación a lista/tarjeta).
- **Espaciado y tipografía**: escalan de forma consistente con los tamaños del Molins UI Kit.
- **Interacciones táctiles**: los elementos interactivos tienen un tamaño mínimo cómodo en móvil.

## 11. Ajustes a las instrucciones del repositorio

Dentro de este módulo se **documentan y actualizan** (no es código de producto) las reglas internas del repositorio para que cualquier desarrollo futuro nazca con i18n y responsive obligatorios:

- Añadir/ajustar una instrucción específica de **internacionalización** que obligue a:
  - No introducir textos fijos en el código.
  - Crear la clave de traducción correspondiente en ES y EN al mismo tiempo que el componente.
  - Revisar el idioma al añadir mensajes de error, validaciones y notificaciones.
- Añadir/ajustar una instrucción específica de **responsive** que obligue a:
  - Validar cualquier nueva pantalla en escritorio, tableta y móvil antes de dar por terminada la tarea.
  - Seguir los criterios de tamaño mínimo táctil, reordenación de tarjetas y comportamiento de menú.
- Estos ajustes se realizan **como tareas dentro de este plan** y no en otro momento anterior.

## 12. Riesgos y decisiones pendientes

- **Riesgo**: al migrar textos existentes a claves de traducción hay que asegurar que ningún literal queda olvidado. Mitigación: revisión explícita por feature (usuarios, roles, salud, layout).
- **Riesgo**: la obtención de KPIs de la Home depende de lo que ya exponga el backend. Si algún dato no está disponible con lo existente, se documenta como decisión pendiente sin ampliar el backend en este módulo.
- **Decisión pendiente**: traducciones al inglés revisadas por una persona nativa o validación del usuario final. Se entrega una primera versión funcional; la revisión lingüística puede ser una iteración posterior.
- **Decisión pendiente**: versión exacta a mostrar en la página de Información. Se toma la versión del paquete principal del frontend, salvo indicación contraria del usuario.

## 13. Fases recomendadas

1. **Fase 1 — Reglas del repositorio**: dejar escritas las instrucciones de i18n y responsive obligatorios.
2. **Fase 2 — Infraestructura de idioma**: montaje de i18n con ES/EN, detección de navegador y persistencia.
3. **Fase 3 — Migración de textos existentes**: pasar todos los literales de usuarios, roles, salud y layout a claves.
4. **Fase 4 — Nueva navegación**: menú rediseñado, submenú de Administración y selector de idioma.
5. **Fase 5 — Páginas nuevas**: Home e Información.
6. **Fase 6 — Responsive**: pulido y verificación en escritorio, tableta y móvil.
7. **Fase 7 — Validación final**: revisión contra los criterios de aceptación.

## 14. Criterios funcionales de éxito

- El logo Molins se ve con claridad en la barra de navegación en cualquier dispositivo.
- El usuario encuentra Usuarios y Roles agrupados bajo Administración, sin perder ningún acceso existente.
- La aplicación arranca en español por defecto, salvo que el navegador del usuario esté en inglés, en cuyo caso arranca en inglés.
- Cambiar el idioma desde la barra cambia todos los textos de la aplicación, sin excepción.
- La elección del idioma se mantiene al recargar la página y al volver otro día desde el mismo navegador.
- Existe una página Home con bienvenida, tarjetas de acceso a Usuarios y Roles, los contadores de usuarios y roles, y un widget con el estado de salud del sistema.
- La opción "Salud del sistema" ya no aparece como entrada del menú; su información está disponible desde la Home.
- Existe una página Información con nombre de la aplicación, versión y texto de propósito que puede cambiarse editando únicamente los textos de traducción.
- En un móvil, el menú se oculta tras un botón y se puede abrir y cerrar con comodidad; las tarjetas se apilan; las tablas siguen siendo usables.
- Las reglas del repositorio de i18n y responsive están escritas y disponibles para los agentes futuros.
- No se ha tocado la lógica del backend ni el comportamiento funcional de los módulos existentes de usuarios, roles y salud.
