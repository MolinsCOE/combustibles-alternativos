---
modulo: combustibles-alternativos
creado: 2026-05-04
plan: plans/combustibles-alternativos/plan-combustibles-alternativos-2026-05-04.md
tareas: plans/combustibles-alternativos/tareas-combustibles-alternativos-2026-05-04.md
---

# Modelo de Datos — Combustibles Alternativos

## Resumen

El módulo gestiona el ciclo completo de la planificación semanal de combustibles alternativos: desde que Producción solicita los viajes por material y día, pasando por la distribución y comunicación que realiza Compras hacia proveedores y transportistas, la confirmación de estos, hasta el cruce final entre los viajes planificados y los realmente recibidos en fábrica. El modelo contiene **11 entidades** agrupadas en tres bloques funcionales: **maestros de configuración** (los catálogos que definen el sistema), **planificación semanal** (el flujo operativo semana a semana) y **seguimiento de entregas** (el registro de lo que ocurrió realmente).

---

## Entidades

### Material

**Objetivo**: Catálogo de combustibles alternativos que Producción puede solicitar. Define el nombre del material, su punto habitual de descarga en fábrica y, si aplica, la franja horaria en la que se puede recibir. Solo los materiales activos aparecen en nuevas solicitudes.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| nombre | texto | si | Nombre del material tal como aparece en solicitudes y correos (ej. "Biomasa Gruesa", "CSR Fino") | si | si | si | no |
| destino_id | referencia (Destino) | si | Punto de descarga habitual en fábrica. Se usa como valor por defecto en las solicitudes | si | si | si | no |
| hora_inicio_restriccion | texto | no | Hora de inicio de la franja permitida de recepción (ej. "09:00"). Solo si el material tiene restricción horaria | si | si | si | no |
| hora_fin_restriccion | texto | no | Hora de fin de la franja permitida de recepción (ej. "14:00"). Solo si el material tiene restricción horaria | si | si | si | no |
| activo | si/no | si | Indica si el material aparece en nuevas solicitudes. Los materiales inactivos no desaparecen del histórico | si | si | si | no |
| creado_en | fecha | si | Fecha y hora de creación del registro | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |

#### Reglas de negocio

- Un material inactivo no aparece en el formulario de nueva solicitud, pero sí es visible en planificaciones anteriores donde ya figuraba.
- Si se informa `hora_inicio_restriccion`, `hora_fin_restriccion` también es obligatoria, y viceversa.
- La restricción horaria se muestra en el correo generado para el proveedor/transportista y en la vista del proveedor en la plataforma.
- Los cambios en un material no afectan a planificaciones ya enviadas.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Solo Administrador |
| Ver | si | Todos los roles |
| Editar | si | Solo Administrador |
| Eliminar | no | Los materiales se desactivan, nunca se borran para preservar el histórico |

---

### Destino

**Objetivo**: Catálogo de puntos de descarga disponibles en fábrica (ej. "QUEMADOR SILO 1", "BUNKERS", "PISOS MOVILES"). Se asigna a materiales y a líneas de solicitud. El Administrador puede añadir nuevos destinos sin intervención técnica.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| nombre | texto | si | Nombre del punto de descarga tal como aparece en solicitudes y correos | si | si | si | no |
| activo | si/no | si | Permite retirar un destino del catálogo sin borrar el histórico | si | si | si | no |
| creado_en | fecha | si | Fecha y hora de creación del registro | automatico | si | no | no |

#### Reglas de negocio

- Un destino inactivo no puede seleccionarse en nuevas solicitudes, pero permanece visible en solicitudes anteriores.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Solo Administrador |
| Ver | si | Todos los roles |
| Editar | si | Solo Administrador |
| Eliminar | no | Se desactiva en lugar de eliminar |

---

### Proveedor

**Objetivo**: Empresa origen del material. Recibe el correo semanal de planificación y tiene acceso a la plataforma para confirmar su asignación. Cada proveedor tiene una única dirección de correo de contacto.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| nombre | texto | si | Nombre comercial del proveedor tal como aparece en correos y listados (ej. "FOMENT") | si | si | si | no |
| email | texto | si | Dirección de correo a la que se envía la comunicación semanal | si | si | si | no |
| activo | si/no | si | Permite retirar un proveedor sin borrar el histórico | si | si | si | no |
| creado_en | fecha | si | Fecha y hora de creación del registro | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |

#### Reglas de negocio

- El campo `email` se usa como destinatario del correo generado en el flujo de distribución (Flujo 2).
- Un proveedor inactivo no puede asignarse en nuevas distribuciones, pero sus datos históricos se conservan.
- El usuario de plataforma del proveedor se gestiona en el módulo `usuarios-roles`; la relación entre ese usuario y este registro de proveedor se establece fuera de este modelo.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Solo Administrador |
| Ver | si | Administrador y Compras |
| Editar | si | Solo Administrador |
| Eliminar | no | Se desactiva en lugar de eliminar |

---

### Transportista

**Objetivo**: Empresa que realiza el transporte físico del material desde el proveedor hasta fábrica. Puede tener uno o más correos de contacto (algunos transportistas tienen varias personas que deben recibir la comunicación). También confirma su planificación en la plataforma de forma independiente al proveedor.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| nombre | texto | si | Nombre comercial del transportista tal como aparece en correos y listados (ej. "RUIZ MILA") | si | si | si | no |
| activo | si/no | si | Permite retirar un transportista sin borrar el histórico | si | si | si | no |
| creado_en | fecha | si | Fecha y hora de creación del registro | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |

#### Reglas de negocio

- Un transportista puede tener varios correos de contacto; estos se almacenan en la entidad `TransportistaEmail`.
- El usuario de plataforma del transportista se gestiona en el módulo `usuarios-roles`.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Solo Administrador |
| Ver | si | Administrador y Compras |
| Editar | si | Solo Administrador |
| Eliminar | no | Se desactiva en lugar de eliminar |

---

### TransportistaEmail

**Objetivo**: Almacena las direcciones de correo de un transportista. Como un transportista puede tener más de una persona de contacto que deba recibir la comunicación, se modela como una lista independiente en lugar de un único campo en Transportista.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| transportista_id | referencia (Transportista) | si | Transportista al que pertenece este correo | si | si | no | no |
| email | texto | si | Dirección de correo del contacto | si | si | si | si |
| creado_en | fecha | si | Fecha y hora de creación del registro | automatico | si | no | no |

#### Reglas de negocio

- Cada fila representa un destinatario de los correos generados para ese transportista.
- Debe existir al menos un correo por transportista activo.
- Si se elimina un correo y el transportista se queda sin ninguno, el sistema debe advertir al Administrador.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Solo Administrador |
| Ver | si | Administrador y Compras |
| Editar | si | Solo Administrador |
| Eliminar | si | Solo Administrador; siempre que quede al menos un correo para ese transportista |

---

### AsignacionMaterialProveedor

**Objetivo**: Regla de distribución que indica qué transportista(s) se encargan de un material concreto suministrado por un proveedor concreto, y en qué porcentaje de viajes. Esta tabla es la fuente de verdad que usa el sistema para calcular la sugerencia de reparto cuando Compras distribuye la planificación semanal.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| material_id | referencia (Material) | si | Material al que aplica esta regla de asignación | si | si | si | no |
| proveedor_id | referencia (Proveedor) | si | Proveedor que suministra ese material | si | si | si | no |
| transportista_id | referencia (Transportista) | si | Transportista que realizará el transporte en este porcentaje | si | si | si | no |
| porcentaje | numero | si | Porcentaje de viajes semanales asignado a este transportista para este material y proveedor (ej. 70) | si | si | si | no |
| creado_en | fecha | si | Fecha y hora de creación del registro | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |

#### Reglas de negocio

- La suma de los `porcentaje` de todas las filas con el mismo `material_id` y `proveedor_id` debe ser exactamente 100%. El sistema valida esto al guardar.
- Los cambios en esta tabla solo afectan a nuevas distribuciones; no retroactúan sobre planificaciones ya enviadas.
- Un par material–proveedor puede tener entre 1 y N líneas (un transportista al 100%, o varios sumando 100%).

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Solo Administrador |
| Ver | si | Administrador y Compras |
| Editar | si | Solo Administrador |
| Eliminar | si | Solo Administrador; el sistema revalida que la suma restante siga siendo 100% o que no queden líneas huérfanas |

---

### PlanificacionSemanal

**Objetivo**: Registro central de una semana de trabajo. Agrupa la solicitud de Producción, la distribución de Compras y las confirmaciones de proveedores/transportistas bajo un mismo ciclo semanal. Existe como máximo una planificación activa por semana del año.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| anyo | numero | si | Año ISO al que corresponde la semana (ej. 2026) | automatico | si | no | no |
| semana | numero | si | Número de semana ISO (1–53). Junto con `anyo` identifica unívocamente el ciclo semanal | automatico | si | no | no |
| estado | opcion | si | Estado actual del ciclo: Borrador / Pendiente de distribución / En distribución / Enviada / Confirmada / Cerrada | automatico | si | condicional | no |
| comentario_general | texto | no | Texto libre que Producción añade para dar contexto a Compras sobre la semana (ej. "Semana festiva, reducir viajes el jueves") | si | si | si | no |
| creado_por_id | referencia (Usuario) | si | Usuario de Producción que creó la solicitud | automatico | si | no | no |
| creado_en | fecha | si | Fecha y hora de creación | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |
| cerrado_por_id | referencia (Usuario) | no | Usuario de Producción que cerró la planificación. Nulo hasta que se cierra | automatico | si | no | no |
| cerrado_en | fecha | no | Fecha y hora en que la planificación fue cerrada. Nulo hasta que se cierra | automatico | si | no | no |

**Valores posibles del campo `estado`:**

| Valor | Significado |
|-------|-------------|
| Borrador | Producción ha empezado la solicitud pero no la ha enviado |
| Pendiente de distribución | Producción la ha enviado; Compras aún no ha iniciado la distribución |
| En distribución | Compras ha abierto la distribución; Producción ya no puede editar |
| Enviada | Compras ha lanzado los correos a proveedores y transportistas |
| Confirmada | Todas las líneas de distribución tienen respuesta (confirmada o rechazada) |
| Cerrada | Producción ha cerrado el ciclo manualmente al finalizar la semana |

#### Reglas de negocio

- Solo puede existir una `PlanificacionSemanal` por combinación de `anyo` + `semana`. Si ya existe una para esa semana, Producción debe editar la existente.
- El campo `estado` solo avanza; nunca retrocede salvo la excepción de redistribución (ver Flujo 3).
- Solo Producción puede cambiar el estado a "Cerrada". Compras no tiene ese permiso (decisión confirmada por el usuario, P2).
- La edición del `comentario_general` está permitida mientras el estado sea "Borrador" o "Pendiente de distribución". Una vez Compras inicia la distribución, Producción solo puede consultar.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Solo Producción |
| Ver | si | Producción, Compras; Proveedor/Transportista solo ven sus líneas, no el registro global |
| Editar | condicional | Producción puede editar mientras estado sea Borrador o Pendiente de distribución. Compras puede editar la distribución mientras estado sea En distribución o Enviada |
| Eliminar | no | Las planificaciones no se eliminan; se archivan mediante el estado Cerrada |

---

### LineaSolicitud

**Objetivo**: Cada fila de la solicitud semanal de Producción. Representa la necesidad de un material concreto para esa semana, con el número de viajes requeridos por cada día (lunes a domingo) y el destino de descarga. Hay una línea por cada material activo en cada planificación.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| planificacion_id | referencia (PlanificacionSemanal) | si | Planificación a la que pertenece esta línea | automatico | si | no | no |
| material_id | referencia (Material) | si | Material que se solicita | si | si | no | no |
| destino_id | referencia (Destino) | si | Punto de descarga. Se pre-rellena con el destino por defecto del material; Producción puede cambiarlo | si | si | si | no |
| viajes_lunes | numero | no | Número de viajes solicitados para el lunes. Cero o vacío si no se necesitan ese día | si | si | si | no |
| viajes_martes | numero | no | Número de viajes solicitados para el martes | si | si | si | no |
| viajes_miercoles | numero | no | Número de viajes solicitados para el miércoles | si | si | si | no |
| viajes_jueves | numero | no | Número de viajes solicitados para el jueves | si | si | si | no |
| viajes_viernes | numero | no | Número de viajes solicitados para el viernes | si | si | si | no |
| viajes_sabado | numero | no | Número de viajes solicitados para el sábado | si | si | si | no |
| viajes_domingo | numero | no | Número de viajes solicitados para el domingo | si | si | si | no |
| total_viajes | calculado | si | Suma de los viajes de los siete días. Lo calcula el sistema para facilitar la vista de Compras | automatico | si | no | no |
| comentario_linea | texto | no | Nota libre de Producción para ese material concreto esa semana (ej. "Pendiente confirmar disponibilidad") | si | si | si | no |
| creado_en | fecha | si | Fecha y hora de creación | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |

#### Reglas de negocio

- Las celdas de viajes por día admiten cero; no son obligatorias individualmente, pero la línea debe tener al menos un día con viajes mayor que cero para ser válida al enviar.
- Producción puede editar los campos de viajes y `comentario_linea` mientras la planificación esté en estado Borrador o Pendiente de distribución.
- Una vez la planificación pasa a En distribución, estas líneas son de solo lectura para todos los roles.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | automatico | Las líneas se crean automáticamente al crear la planificación, una por cada material activo |
| Ver | si | Producción y Compras |
| Editar | condicional | Solo Producción; solo si la planificación está en Borrador o Pendiente de distribución |
| Eliminar | no | Las líneas son parte estructural de la planificación |

---

### LineaDistribucion

**Objetivo**: Cada línea de la distribución que Compras construye a partir de la solicitud de Producción. Representa la asignación de viajes de un material concreto a un proveedor y un transportista concretos, con el detalle de cuántos viajes les corresponden cada día de la semana. Es la base de los correos que se envían a las empresas externas.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| planificacion_id | referencia (PlanificacionSemanal) | si | Planificación a la que pertenece esta línea de distribución | automatico | si | no | no |
| linea_solicitud_id | referencia (LineaSolicitud) | si | Línea de solicitud de Producción de la que procede esta distribución. Permite trazabilidad entre lo que pidió Producción y lo que distribuyó Compras | automatico | si | no | no |
| material_id | referencia (Material) | si | Material asignado en esta línea | automatico | si | no | no |
| proveedor_id | referencia (Proveedor) | si | Proveedor que suministrará este material | si | si | si | no |
| transportista_id | referencia (Transportista) | si | Transportista que realizará el transporte | si | si | si | no |
| destino_id | referencia (Destino) | si | Punto de descarga en fábrica para esta línea | si | si | si | no |
| viajes_lunes | numero | no | Viajes asignados al lunes para este proveedor y transportista | si | si | si | no |
| viajes_martes | numero | no | Viajes asignados al martes | si | si | si | no |
| viajes_miercoles | numero | no | Viajes asignados al miércoles | si | si | si | no |
| viajes_jueves | numero | no | Viajes asignados al jueves | si | si | si | no |
| viajes_viernes | numero | no | Viajes asignados al viernes | si | si | si | no |
| viajes_sabado | numero | no | Viajes asignados al sábado | si | si | si | no |
| viajes_domingo | numero | no | Viajes asignados al domingo | si | si | si | no |
| total_viajes | calculado | si | Suma de los viajes de los siete días. Debe cuadrar con la parte proporcional asignada a esta empresa sobre el total semanal del material | automatico | si | no | no |
| correo_enviado_en | fecha | no | Fecha y hora en que se envió el correo de comunicación para esta línea. Nulo si aún no se ha enviado | automatico | si | no | no |
| creado_en | fecha | si | Fecha y hora de creación | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |

#### Reglas de negocio

- La suma de `total_viajes` de todas las `LineaDistribucion` de un mismo `material_id` dentro de una planificación debe coincidir con el `total_viajes` de la `LineaSolicitud` correspondiente.
- Si el cálculo por porcentaje produce decimales, se redondea al entero más cercano. El sistema avisa a Compras si la suma de las líneas no coincide exactamente con el total de la solicitud para que cuadre manualmente.
- Compras puede editar los viajes por día mientras la planificación esté en En distribución o, tras un rechazo, en Enviada (solo las líneas afectadas).
- Una vez la planificación está Confirmada o Cerrada, estas líneas son de solo lectura.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Solo Compras |
| Ver | si | Compras y Producción; Proveedor/Transportista solo ven sus propias líneas |
| Editar | condicional | Solo Compras; mientras la planificación esté en En distribución o Enviada (redistribución tras rechazo) |
| Eliminar | condicional | Solo Compras; solo mientras la planificación esté en En distribución y la línea no tenga confirmación asociada |

---

### LineaConfirmacion

**Objetivo**: Respuesta de un proveedor o transportista a una línea de distribución. Recoge si la empresa ha confirmado o rechazado su asignación y, en caso de rechazo, el motivo obligatorio. Como proveedor y transportista confirman por separado, una misma `LineaDistribucion` puede tener hasta dos confirmaciones: una del proveedor y otra del transportista.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| linea_distribucion_id | referencia (LineaDistribucion) | si | Línea de distribución a la que responde esta confirmación | automatico | si | no | no |
| confirming_party | opcion | si | Quién confirma esta línea: "proveedor" o "transportista". Permite distinguir las dos confirmaciones independientes de una misma línea | si | si | no | no |
| estado | opcion | si | Respuesta dada: Pendiente / Confirmada / Rechazada | automatico | si | si | no |
| motivo_rechazo | texto | condicional | Motivo por el que se rechaza la línea. Obligatorio si `estado` es Rechazada; no aplica si es Confirmada | condicional | si | condicional | no |
| confirmado_por_id | referencia (Usuario) | no | Usuario externo (proveedor o transportista) que registró la respuesta. Nulo hasta que se responde | automatico | si | no | no |
| respondido_en | fecha | no | Fecha y hora en que el proveedor o transportista registró su respuesta. Nulo hasta que se responde | automatico | si | no | no |
| creado_en | fecha | si | Fecha y hora de creación del registro (cuando se generó la línea pendiente de confirmación) | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |

**Valores posibles del campo `estado`:**

| Valor | Significado |
|-------|-------------|
| Pendiente | La empresa aún no ha respondido |
| Confirmada | La empresa acepta los viajes asignados |
| Rechazada | La empresa rechaza total o parcialmente la asignación |

**Valores posibles del campo `confirming_party`:**

| Valor | Significado |
|-------|-------------|
| proveedor | Esta confirmación la realiza el proveedor (empresa origen del material) |
| transportista | Esta confirmación la realiza el transportista (empresa que realiza el transporte) |

#### Reglas de negocio

- Cada `LineaDistribucion` genera exactamente dos registros `LineaConfirmacion` al enviarse: uno con `confirming_party = proveedor` y otro con `confirming_party = transportista`, ambos en estado Pendiente.
- El campo `motivo_rechazo` es obligatorio cuando `estado = Rechazada`. No puede guardarse un rechazo sin motivo.
- Un proveedor con rol externo solo puede ver y editar las confirmaciones donde `confirming_party = proveedor` de sus propias líneas.
- Un transportista con rol externo solo puede ver y editar las confirmaciones donde `confirming_party = transportista` de sus propias líneas.
- La `PlanificacionSemanal` pasa a estado Confirmada cuando todos los registros `LineaConfirmacion` de la semana tienen estado distinto de Pendiente.
- Compras puede ver todas las confirmaciones en tiempo real, incluyendo los motivos de rechazo.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | automatico | El sistema crea los registros Pendiente al enviar la planificación |
| Ver | si | Compras y Producción ven todas; Proveedor/Transportista solo ven las suyas |
| Editar | condicional | Solo el proveedor o transportista correspondiente puede cambiar el estado (de Pendiente a Confirmada o Rechazada). Compras no puede confirmar en nombre de la empresa externa |
| Eliminar | no | Las confirmaciones son trazabilidad permanente |

---

### ViajeReal

**Objetivo**: Registro manual de los viajes efectivamente recibidos en fábrica en un día concreto. En el MVP se introduce a mano por Compras o Producción a partir de la información que proporciona Prosegur. Es la base del cruce con la planificación confirmada y la detección de incidencias.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| planificacion_id | referencia (PlanificacionSemanal) | si | Planificación semanal a la que pertenece este registro de entrada real | si | si | no | no |
| fecha | fecha | si | Día al que corresponden estos viajes reales (dentro de la semana de la planificación) | si | si | si | no |
| material_id | referencia (Material) | si | Material recibido | si | si | si | no |
| proveedor_id | referencia (Proveedor) | si | Proveedor origen del material recibido | si | si | si | no |
| transportista_id | referencia (Transportista) | si | Transportista que realizó el transporte | si | si | si | no |
| viajes_reales | numero | si | Número de viajes efectivamente recibidos ese día para esa combinación de material, proveedor y transportista | si | si | si | no |
| fuente | opcion | si | Origen del dato: "manual" en MVP, "prosegur" en Fase 2 | automatico | si | no | no |
| introducido_por_id | referencia (Usuario) | si | Usuario que registró los datos | automatico | si | no | no |
| creado_en | fecha | si | Fecha y hora del registro | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |

#### Reglas de negocio

- La fecha debe pertenecer a la semana de la planificación referenciada.
- Puede haber cero viajes en un día concreto (el proveedor no entregó nada ese día); el sistema interpretará eso como desviación respecto a lo confirmado.
- Al guardar o actualizar un `ViajeReal`, el sistema ejecuta automáticamente el cruce con la `LineaDistribucion` confirmada del mismo día, material, proveedor y transportista, y crea o actualiza la `Incidencia` correspondiente si procede.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Compras y Producción |
| Ver | si | Compras y Producción |
| Editar | si | Compras y Producción; mientras la planificación no esté Cerrada |
| Eliminar | condicional | Compras y Producción; solo si la planificación no está Cerrada. Al eliminar, el sistema recalcula las incidencias asociadas |

---

### Incidencia

**Objetivo**: Desviación detectada automáticamente entre los viajes confirmados en la planificación y los viajes realmente recibidos. El sistema la crea sin intervención manual cuando los viajes reales son inferiores a los confirmados. Compras puede añadir un comentario interno para documentar la gestión de la incidencia.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador único del registro | automatico | no | no | no |
| planificacion_id | referencia (PlanificacionSemanal) | si | Planificación semanal a la que pertenece la incidencia | automatico | si | no | no |
| viaje_real_id | referencia (ViajeReal) | si | Registro de viajes reales que originó esta incidencia | automatico | si | no | no |
| linea_distribucion_id | referencia (LineaDistribucion) | si | Línea de distribución confirmada con la que se detectó la desviación | automatico | si | no | no |
| fecha | fecha | si | Día de la incidencia | automatico | si | no | no |
| material_id | referencia (Material) | si | Material afectado | automatico | si | no | no |
| proveedor_id | referencia (Proveedor) | si | Proveedor responsable de la desviación | automatico | si | no | no |
| transportista_id | referencia (Transportista) | si | Transportista responsable de la desviación | automatico | si | no | no |
| viajes_previstos | numero | si | Viajes confirmados en la planificación para ese día, material y empresa | automatico | si | no | no |
| viajes_realizados | numero | si | Viajes realmente recibidos ese día | automatico | si | no | no |
| desviacion | calculado | si | Diferencia entre `viajes_realizados` y `viajes_previstos`. Negativo indica menos viajes de los confirmados | automatico | si | no | no |
| tipo | opcion | si | Clasificación automática: "incidencia" si `desviacion` < 0; "aviso" si `desviacion` > 0 | automatico | si | no | no |
| comentario_interno | texto | no | Nota libre de Compras para documentar la gestión de la desviación (ej. "Proveedor avisó de avería") | no | si | si | no |
| creado_en | fecha | si | Fecha y hora de creación automática | automatico | si | no | no |
| actualizado_en | fecha | si | Fecha y hora de la última modificación | automatico | si | no | no |

**Valores posibles del campo `tipo`:**

| Valor | Significado |
|-------|-------------|
| incidencia | Los viajes reales son inferiores a los confirmados. Requiere atención |
| aviso | Los viajes reales son superiores a los confirmados. Se registra como información, no es bloqueante |

#### Reglas de negocio

- Las incidencias las crea y actualiza el sistema automáticamente; no las crea ningún usuario manualmente.
- Si los viajes reales coinciden exactamente con los confirmados, no se crea ningún registro de incidencia para esa combinación.
- Si se edita un `ViajeReal`, el sistema recalcula y actualiza o elimina la incidencia asociada.
- El único campo editable por usuarios es `comentario_interno`, accesible solo para Compras y Producción.
- El motivo de rechazo registrado en `LineaConfirmacion` se vincula a la incidencia por la relación `linea_distribucion_id`, permitiendo cruzar "el transportista nos avisó que no podría" con "efectivamente no llegaron los viajes".

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | automatico | Solo el sistema, al guardar o actualizar un ViajeReal |
| Ver | si | Compras y Producción |
| Editar | condicional | Solo el campo `comentario_interno`; solo Compras y Producción |
| Eliminar | automatico | Solo el sistema, si se elimina o corrige el ViajeReal que la originó |

---

## Relaciones

| Entidad origen | Entidad destino | Tipo | Descripcion funcional |
|---------------|-----------------|------|----------------------|
| Material | Destino | N:1 | Cada material tiene un destino por defecto; un destino puede ser el predeterminado de varios materiales |
| Transportista | TransportistaEmail | 1:N | Un transportista puede tener uno o más correos de contacto |
| AsignacionMaterialProveedor | Material | N:1 | Cada regla de asignación aplica a un material concreto |
| AsignacionMaterialProveedor | Proveedor | N:1 | Cada regla de asignación implica a un proveedor concreto |
| AsignacionMaterialProveedor | Transportista | N:1 | Cada regla de asignación implica a un transportista concreto |
| PlanificacionSemanal | LineaSolicitud | 1:N | Una planificación semanal contiene una línea de solicitud por cada material activo |
| PlanificacionSemanal | LineaDistribucion | 1:N | Una planificación semanal contiene todas las líneas de distribución que Compras genera a partir de la solicitud |
| PlanificacionSemanal | ViajeReal | 1:N | Una planificación semanal agrupa todos los registros de viajes reales de esa semana |
| PlanificacionSemanal | Incidencia | 1:N | Una planificación semanal puede tener múltiples incidencias detectadas durante la semana |
| LineaSolicitud | LineaDistribucion | 1:N | Cada línea de solicitud de Producción puede originar varias líneas de distribución (una por cada proveedor/transportista asignado a ese material) |
| LineaDistribucion | LineaConfirmacion | 1:2 | Cada línea de distribución genera exactamente dos confirmaciones: una para el proveedor y otra para el transportista |
| LineaDistribucion | Incidencia | 1:N | Una línea de distribución confirmada puede tener incidencias en distintos días si los viajes reales difieren de lo confirmado |
| ViajeReal | Incidencia | 1:1 | Cada registro de viajes reales que genera desviación da lugar a exactamente una incidencia |
| LineaDistribucion | Material | N:1 | Cada línea de distribución se refiere a un material concreto |
| LineaDistribucion | Proveedor | N:1 | Cada línea de distribución se asigna a un proveedor concreto |
| LineaDistribucion | Transportista | N:1 | Cada línea de distribución se asigna a un transportista concreto |
| LineaDistribucion | Destino | N:1 | Cada línea de distribución indica el punto de descarga en fábrica |

---

## Bloques funcionales (para referencia del equipo de desarrollo)

El modelo se organiza en tres bloques cohesivos que comparten ciclo de vida y se pueden implementar por fases:

**Maestros**: Material, Destino, Proveedor, Transportista, TransportistaEmail, AsignacionMaterialProveedor. Son el punto de partida; deben estar cargados antes de cualquier flujo operativo.

**Planificación semanal**: PlanificacionSemanal, LineaSolicitud, LineaDistribucion, LineaConfirmacion. Representan el flujo operativo de una semana: desde la solicitud de Producción hasta la confirmación de las empresas externas.

**Seguimiento de entregas**: ViajeReal, Incidencia. Permiten contrastar lo planificado con lo que realmente ocurrió en fábrica y dejar trazabilidad de las desviaciones.

---

## Decisiones pendientes

| # | Pregunta | Impacto en el modelo |
|---|----------|----------------------|
| DP1 | Al redistribuir tras un rechazo (Flujo 3, tarea T4.5), ¿se modifica la `LineaDistribucion` existente o se crea una versión nueva manteniendo la anterior como histórico? | Si se crea una versión nueva, `LineaDistribucion` necesita un campo de versión o un indicador "activa/inactiva" para distinguir la distribución vigente de las anteriores. En el modelo actual se asume que se modifica la existente, lo que simplifica las consultas pero pierde el rastro de redistribuciones intermedias. |
| DP2 | ¿La acción "Confirmar todo" del proveedor/transportista confirma todas las líneas de la semana o solo las que tienen estado Pendiente (excluyendo las ya Rechazadas o Confirmadas en pasos anteriores)? | Afecta a la lógica de la operación en masa sobre `LineaConfirmacion`, pero no cambia la estructura del modelo. Queda como regla de negocio a definir antes de implementar la tarea T4.3. |
| DP3 | ¿Los parámetros SMTP (host, puerto, autenticación) estarán disponibles antes de la implementación de la Fase 3? | No afecta al modelo de datos, pero bloquea la implementación del envío de correos. Pendiente de confirmar con IT según lo indicado en el plan (sección 10). |
| DP4 | ¿El formato exacto del fichero de Prosegur (Fase 2) es conocido? | Afectará a los campos de `ViajeReal` cuando se automatice la importación. En MVP el campo `fuente` quedará siempre como "manual"; en Fase 2 puede ser necesario añadir un campo de identificador externo del registro Prosegur para evitar duplicados en la importación. |
