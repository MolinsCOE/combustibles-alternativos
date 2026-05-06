---
modulo: combustibles-alternativos
creado: 2026-05-04
tareas: plans/combustibles-alternativos/tareas-combustibles-alternativos-2026-05-04.md
---

# Plan Funcional — Combustibles Alternativos

## 1. Resumen ejecutivo

Módulo para digitalizar y centralizar la gestión semanal de combustibles alternativos (CA) en Cementos Molins. Sustituye el proceso actual basado en correos y Excel entre Producción, Compras, proveedores y transportistas. La plataforma permite a Producción publicar la planificación semanal de viajes por material y día, a Compras distribuirla entre proveedores y transportistas y enviar la comunicación de forma automática, y a proveedores/transportistas confirmarla. Al cierre del día, el sistema cruza la programación validada con los viajes reales registrados por Prosegur y señala desviaciones e incidencias.

## 2. Objetivo del producto

- Eliminar la dependencia de correos manuales y ficheros Excel paralelos para coordinar la logística semanal de CA.
- Automatizar el envío de comunicaciones a proveedores y transportistas desde la misma plataforma.
- Dar visibilidad en tiempo real del cumplimiento proveedor/transportista respecto a la planificación confirmada.
- Proporcionar un histórico centralizado de planificaciones, confirmaciones y entradas reales.

## 3. Problema que resuelve

El proceso actual genera múltiples iteraciones por correo entre Compras y Producción, versiones paralelas del mismo Excel, y ningún cruce automático entre lo programado y lo que realmente entra a fábrica. Cuando un proveedor o transportista no cumple, el equipo lo detecta manualmente al revisar el correo de Prosegur al final del día. No hay registro estructurado de motivos de anulación ni de histórico de cumplimiento por proveedor.

## 4. Usuarios y perfiles

| Perfil | Descripción | Acciones principales |
|--------|-------------|----------------------|
| Producción | Equipo de planta que determina las necesidades semanales de cada material por día. | Crear y editar la solicitud semanal de viajes; consultar el seguimiento de la semana en curso. |
| Compres | Equipo de compras que distribuye viajes a proveedores/transportistas y gestiona la comunicación. | Ver la solicitud de Producción; distribuir viajes por proveedor/transportista; enviar comunicaciones; registrar confirmaciones; ver el cruce real vs planificado. |
| Proveïdor / Transportista | Empresa externa que suministra o transporta el material. | Ver su planificación semanal asignada; confirmar o rechazar (con motivo) cada línea. |
| Administrador | Gestiona la configuración del módulo (maestros). | Mantener el catálogo de materiales, proveedores, transportistas, destinos y asignaciones proveedor–transportista–porcentaje. |

Los roles Producción, Compres, Proveïdor y Administrador se mapean sobre el sistema de usuarios y roles ya definido en el módulo `usuarios-roles`.

## 5. Alcance del MVP

### Maestros de configuración (Administrador)

- Catálogo de materiales con destino por defecto (QUEMADOR SILO 1, QUEMADOR SILO 2, BUNKERS, PISOS MOVILES, A DEPOSITO, A C-31/C-35). Incluye todos los materiales activos: Madera Fina, Cáscaras de Anacardo, CSR Fino, CSR Grueso Bunkers, Biomasa Gruesa, NFU, Amoniaco, Sulfato Ferroso y cualquier otro que esté en uso. El Administrador puede añadir o desactivar materiales en cualquier momento sin intervención técnica.
- Catálogo de proveedores con correo de contacto.
- Catálogo de transportistas con uno o más correos de contacto.
- Tabla de asignación: material → proveedor → transportista → porcentaje de viajes. Un material puede tener varias líneas (ej. 70% FOMENT, 30% RUIZ MILA).
- Restricciones de horario por material (ej. Solución Amoniacal: solo 09:00–14:00 h).

### Flujo 1 — Solicitud de Producción

- Producción crea una solicitud semanal indicando, para cada material activo, el número de viajes por día (L–D).
- Puede añadir comentarios generales y comentarios por línea de material.
- La solicitud queda en estado "Borrador" hasta que Producción la envía a Compres.
- Compres recibe una notificación en la plataforma cuando hay una nueva solicitud pendiente.

### Flujo 2 — Distribución de Compres

- Compres ve la solicitud aprobada de Producción.
- Compres introduce el total de viajes de la semana para cada material. El sistema aplica los porcentajes configurados en los maestros sobre ese total semanal y muestra una sugerencia de reparto por proveedor/transportista.
- Compres puede ajustar manualmente el número de viajes asignados a cada día antes de confirmar. Si el cálculo produce decimales, se aplica redondeo y el sistema avisa para que Compres cuadre la suma.
- Compres envía la comunicación: el sistema genera y envía un correo por cada proveedor y transportista implicado con la tabla de su planificación semanal (mismo formato que la macro actual de Excel, pero generado desde la plataforma). Los correos se envían desde `compras@molins` (dirección configurable).
- La planificación queda en estado "Enviada".

### Flujo 3 — Confirmación de proveedores/transportistas

- Cada proveedor/transportista accede a la plataforma con su usuario y ve su planificación semanal pendiente de confirmar.
- Puede confirmar cada línea o rechazarla indicando un motivo de anulación (campo texto obligatorio si rechaza).
- También puede confirmar o rechazar la planificación completa de una vez.
- Compres ve en tiempo real el estado de confirmación de cada línea.
- Una vez todas las líneas tienen respuesta, la planificación pasa a estado "Confirmada".
- Compres puede volver a distribuir si hay rechazos significativos.

### Flujo 4 — Cruce real vs planificado

- Al final del día, un usuario de Compres o Producción introduce (o importa) el detalle de viajes reales recibidos ese día (datos que actualmente envía Prosegur).
- El sistema cruza viajes planificados vs viajes reales por material, proveedor y transportista.
- Muestra un resumen con: viajes previstos, viajes realizados, diferencia, y proveedor/transportista responsable de cada desviación.
- Si hay viajes en menos respecto a lo confirmado, el sistema lo marca como incidencia.
- Los motivos de rechazo/anulación indicados en la confirmación (flujo 3) se vinculan con las incidencias detectadas.

### Dashboard

- Accesible para Producción y Compres.
- KPIs de la semana en curso: viajes previstos vs realizados, % de cumplimiento, incidencias abiertas, líneas pendientes de confirmación.
- Acceso rápido a la planificación activa y al cruce del día anterior.

## 6. Fuera de alcance

- Autoconfirmación desde el correo (enlace en el email para confirmar sin entrar en la plataforma). Se valora para Fase 2.
- Importación automática del fichero de Prosegur. En MVP la entrada de viajes reales es manual. Se automatiza en Fase 2.
- Histórico y análisis de cumplimiento por proveedor a lo largo del tiempo (informes, tendencias). Fase 2.
- Integración con SAP u otros sistemas ERP.
- Notificaciones por SMS o WhatsApp.
- Gestión de incidencias de calidad del material (solo se recoge la desviación de viajes, no defectos de producto).
- Soporte a múltiples plantas. El MVP es para una planta (Molins de Rei).

## 7. Flujos funcionales principales

### 7.1 Solicitud semanal de Producción

1. Producción accede a "Nueva solicitud" y selecciona la semana objetivo (por defecto, la semana siguiente).
2. El sistema carga la lista de materiales activos con una fila por material y columnas L–D.
3. Producción introduce el número de viajes para cada celda y, opcionalmente, comentarios por línea y un comentario general.
4. Producción guarda en borrador o envía directamente a Compres.
5. Al enviar, la solicitud queda en estado "Pendiente de distribución" y Compres recibe aviso.
6. Producción puede editar la solicitud mientras Compres no haya iniciado la distribución. Una vez iniciada, solo puede consultar.

### 7.2 Distribución y envío de Compres

1. Compres accede a la solicitud en estado "Pendiente de distribución".
2. Para cada material, Compres introduce el total de viajes previstos para la semana.
3. El sistema aplica los porcentajes de los maestros sobre ese total semanal y presenta la sugerencia de reparto por proveedor y transportista (nº de viajes totales de la semana por empresa).
4. Compres distribuye manualmente los viajes de cada empresa por días (L–D). El sistema muestra en todo momento si la suma de días cuadra con el total semanal asignado a esa empresa, alertando si hay diferencia.
5. Si el cálculo por porcentaje produce decimales, se aplica redondeo y Compres ajusta manualmente.
6. Compres revisa y confirma la distribución completa.
7. El sistema genera un correo por cada empresa destino (proveedor y transportista) con la tabla de su semana. Todos los correos se envían desde `compras@molins`.
8. Compres lanza el envío. La planificación pasa a "Enviada".
9. Compres puede reenviar a un destinatario concreto si hay error o si se hace una corrección.

### 7.3 Confirmación del proveedor/transportista

1. El proveedor/transportista recibe el correo y entra en la plataforma.
2. Ve su planificación semanal con las líneas asignadas, desglosadas por día.
3. Para cada línea puede marcar: Confirmado / Rechazado (con motivo obligatorio si rechaza).
4. También puede usar "Confirmar todo" si no hay ningún problema.
5. Al completar, pulsa "Enviar confirmación".
6. Compres recibe el cambio de estado en tiempo real.

### 7.4 Entrada y cruce de viajes reales

1. Al final del día, Compres o Producción accede a "Registro de entradas del día".
2. Introduce los viajes reales recibidos: material, proveedor, transportista, número de viajes.
3. El sistema compara con la planificación confirmada del mismo día.
4. Se muestra la tabla de cruce: planificado vs real, diferencia y estado (OK / Incidencia).
5. Las incidencias quedan registradas con fecha, material, proveedor/transportista y desviación.
6. Compres puede añadir un comentario interno a cada incidencia.

### 7.5 Gestión de maestros (Administrador)

1. El administrador accede a la sección de configuración del módulo.
2. Puede crear, editar y desactivar materiales, proveedores, transportistas y destinos.
3. Puede configurar las asignaciones proveedor–transportista–porcentaje por material. La suma de porcentajes de todas las líneas de un mismo material debe ser 100%.
4. Puede configurar restricciones horarias por material.
5. Los cambios en maestros no afectan a planificaciones ya enviadas; solo aplican a nuevas distribuciones.

## 8. Reglas de negocio

| # | Regla | Comportamiento |
|---|-------|----------------|
| R1 | Semana única por ciclo | Solo puede haber una solicitud activa por semana. Si ya existe una, Producción debe editarla o archivar la anterior. |
| R2 | Solicitud solo editable antes de distribución | Una vez Compres inicia la distribución, la solicitud queda bloqueada para Producción. |
| R3 | Suma de porcentajes | La suma de porcentajes de asignación de transportistas para un material y proveedor debe ser exactamente 100%. El sistema lo valida al guardar en maestros. |
| R4 | Distribución por total semanal | Los porcentajes de asignación se aplican sobre el total de viajes de la semana introducido por Compres, no sobre los viajes de cada día. Compres distribuye manualmente los viajes por días una vez conoce el reparto total por empresa. Si el cálculo produce decimales, se redondea al entero más cercano y Compres ajusta para cuadrar la suma. |
| R5 | Motivo obligatorio en rechazo | Un proveedor/transportista no puede rechazar una línea sin indicar un motivo. El campo es obligatorio. |
| R6 | Correo a origen y transportista | Cada línea de planificación genera comunicación tanto al proveedor (origen del material) como al transportista asignado. Son envíos independientes. Todos los correos se envían desde la dirección `compras@molins`, configurable mediante variable de entorno. |
| R7 | Restricción horaria | Los materiales con restricción horaria (ej. Solución Amoniacal: 09:00–14:00 h) deben mostrar esa restricción en el correo generado y en la vista del proveedor. |
| R8 | Incidencia por viajes en menos | Si los viajes reales de un día son inferiores a los confirmados, el sistema registra automáticamente una incidencia. Si los viajes reales son superiores, se registra como aviso (no es incidencia bloqueante). |
| R9 | Acceso de proveedor/transportista solo a sus datos | Un usuario con rol Proveïdor solo ve las líneas asignadas a su empresa. No accede a datos de otros proveedores ni a la distribución global. |
| R10 | Estados de la planificación semanal | Los estados posibles son: Borrador → Pendiente de distribución → En distribución → Enviada → Confirmada (parcial o total) → Cerrada. Una planificación se cierra manualmente por Compres al finalizar la semana. |

## 9. Información clave que se gestiona

### Solicitud semanal

| Campo | Descripción |
|-------|-------------|
| Semana | Año y número de semana ISO. |
| Estado | Borrador, Pendiente de distribución, En distribución, Enviada, Confirmada, Cerrada. |
| Comentario general | Texto libre de Producción para esa semana. |
| Líneas de solicitud | Una por cada material activo: material, destino, viajes por día (L–D), comentario de línea. |

### Línea de distribución

| Campo | Descripción |
|-------|-------------|
| Material | Material de la línea. |
| Proveedor | Empresa origen del material. |
| Transportista | Empresa que realiza el transporte. |
| Destino | Punto de descarga en fábrica. |
| Viajes por día | Número de viajes asignados para cada día de la semana. |
| Estado de confirmación | Pendiente, Confirmada, Rechazada. |
| Motivo de rechazo | Texto libre obligatorio si el estado es Rechazada. |

### Entrada de viajes reales

| Campo | Descripción |
|-------|-------------|
| Fecha | Día al que corresponde el registro. |
| Material | Material recibido. |
| Proveedor | Empresa origen. |
| Transportista | Empresa que realizó el transporte. |
| Viajes reales | Número de viajes efectivamente recibidos. |
| Fuente | Manual (MVP) / Importación Prosegur (Fase 2). |

### Incidencia

| Campo | Descripción |
|-------|-------------|
| Fecha | Día de la incidencia. |
| Material | Material afectado. |
| Proveedor / Transportista | Empresa responsable. |
| Viajes previstos | Cantidad según planificación confirmada. |
| Viajes realizados | Cantidad real. |
| Desviación | Diferencia (positiva o negativa). |
| Comentario interno | Nota libre de Compres. |

### Material (maestro)

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre del material (ej. Biomasa Fina, CSR Grueso Bunkers). |
| Destino por defecto | Punto de descarga habitual. |
| Restricción horaria | Franja permitida, si aplica (ej. 09:00–14:00 h). |
| Activo | Si aparece en nuevas solicitudes. |

### Asignación proveedor–transportista

| Campo | Descripción |
|-------|-------------|
| Material | Material al que aplica la regla. |
| Proveedor | Empresa origen. |
| Transportista | Empresa transportista. |
| Porcentaje | % de viajes asignados a este transportista para este material y proveedor. |

## 10. Integraciones y dependencias externas

| Sistema / Servicio | Relación | Estado |
|--------------------|----------|--------|
| Correo electrónico (SMTP corporativo) | Envío de comunicaciones a proveedores y transportistas. Los correos salen desde `compras@molins` (dirección genérica configurable por variable de entorno). Se usa el servidor SMTP corporativo de Molins. | Pendiente de confirmar los parámetros SMTP con IT (host, puerto, autenticación). |
| Prosegur (entradas de fábrica) | En MVP los viajes reales se introducen manualmente. En Fase 2 se valorará importación del fichero diario de Prosegur. | Fase 2. |
| SAP / ERP | No contemplado en ninguna fase todavía. | Fuera de alcance. |
| Módulo usuarios-roles | Los perfiles Producción, Compres, Proveïdor y Administrador se crean como roles sobre la infraestructura ya construida. | Dependencia directa — el módulo `usuarios-roles` debe estar operativo antes de iniciar la implementación de este módulo. |

## 11. Riesgos y decisiones pendientes

| # | Tema | Estado |
|---|------|--------|
| D1 | ¿El correo a proveedores/transportistas incluye un enlace de confirmación directa (sin login)? | **Pendiente** — es la opción de "autoconfirmación desde el correo" mencionada. En MVP el proveedor debe entrar a la plataforma. La opción de enlace directo en el correo queda para Fase 2 si el equipo lo prioriza. |
| D2 | ¿Cómo se introduce el fichero de Prosegur en MVP? ¿Formato CSV, tabla manual, otro? | **Pendiente** — en MVP se propone entrada manual en la plataforma. Antes de implementar Fase 2, confirmar el formato exacto del fichero que envía Prosegur. |
| D3 | ¿La distribución propuesta por porcentaje debe calcularse por día o para el total semanal y luego repartir? | **Cerrada** — distribución por total semanal. Compres fija el total de viajes de la semana y lo distribuye manualmente por días. El sistema aplica los porcentajes configurados sobre ese total semanal, muestra la sugerencia de reparto y permite ajuste manual día a día antes de enviar. |
| D4 | ¿Los correos a proveedores/transportistas se envían desde una dirección genérica de Compres o desde el usuario que lanza el envío? | **Cerrada** — los correos se envían siempre desde `compras@molins`, dirección genérica fija y configurable mediante variable de entorno. No depende del usuario que lanza el envío. |
| D5 | ¿Se necesita que el proveedor/transportista pueda ver el histórico de semanas anteriores o solo la semana activa? | **Pendiente** — definir el período de visibilidad para el rol externo. |
| D6 | ¿Los materiales "Sulfato Ferroso" y "Biomasa Gruesa (total)" tienen proveedores y transportistas asignados en los maestros actuales? | **Cerrada** — se incluyen todos los materiales en el MVP: Madera Fina, Cáscaras de Anacardo, CSR Fino, CSR Grueso Bunkers, Biomasa Gruesa, NFU, Amoniaco, Sulfato Ferroso y cualquier otro en uso. El sistema permite añadir y desactivar materiales desde el maestro de administración sin necesidad de intervención técnica. |
| D7 | ¿Quién tiene permiso para cerrar una planificación semanal? ¿Solo Compres o también Producción? | **Pendiente**. |
| D8 | ¿El idioma de la interfaz es catalán, castellano o ambos? El prototipo usa catalán para algunos roles ("Compres", "Proveïdor"). | **Cerrada** — toda la interfaz estará en español. Los nombres de perfil y etiquetas funcionales se escriben en castellano (Compras, Proveedor, Transportista), alineado con el resto de módulos de la plataforma. |

## 12. Fases recomendadas

### Fase 1 — Maestros y configuración base

Objetivo: tener el catálogo de materiales, proveedores, transportistas, destinos y asignaciones configurado y accesible.

- Pantalla de gestión de materiales (nombre, destino, restricción horaria, activo/inactivo).
- Pantalla de gestión de proveedores (nombre, correo).
- Pantalla de gestión de transportistas (nombre, uno o más correos).
- Pantalla de asignación proveedor–transportista–porcentaje por material.
- Validación: suma de porcentajes = 100% por material y proveedor.

### Fase 2 — Solicitud de Producción

Objetivo: Producción puede crear y enviar la solicitud semanal de viajes.

- Formulario de nueva solicitud con filas por material y columnas por día.
- Gestión de estados: Borrador → Pendiente de distribución.
- Listado de solicitudes pasadas y activa.

### Fase 3 — Distribución y envío de Compres

Objetivo: Compres distribuye viajes y envía comunicaciones automáticas.

- Vista de solicitud pendiente con distribución propuesta por porcentaje.
- Edición manual de la distribución.
- Generación y envío de correos a proveedores y transportistas (mismo contenido que la macro actual).
- Cambio de estado a "Enviada".

### Fase 4 — Confirmación de proveedores/transportistas

Objetivo: el proveedor/transportista confirma o rechaza su planificación dentro de la plataforma.

- Vista del proveedor: su planificación semanal.
- Acciones: confirmar por línea, rechazar con motivo, confirmar todo.
- Vista de Compres: estado de confirmación en tiempo real.

### Fase 5 — Cruce real vs planificado

Objetivo: detectar y registrar desviaciones entre lo programado y lo recibido.

- Formulario de entrada manual de viajes reales.
- Tabla de cruce por día: planificado vs real vs diferencia.
- Registro automático de incidencias.
- Dashboard con KPIs de la semana.

## 13. Criterios funcionales de éxito

- Producción puede crear una solicitud semanal sin usar Excel ni correo.
- Compres puede distribuir los viajes y enviar los correos a proveedores y transportistas desde la misma plataforma, sin usar Outlook manualmente.
- Un proveedor puede entrar a la plataforma y confirmar su planificación de la semana.
- Compres puede ver en un solo lugar qué líneas están confirmadas y cuáles pendientes.
- Al introducir los viajes reales del día, el sistema muestra automáticamente qué proveedores/transportistas han desviado respecto a lo confirmado.
- Toda la información de una semana (solicitud, distribución, confirmaciones, entradas reales, incidencias) queda almacenada y es consultable.
