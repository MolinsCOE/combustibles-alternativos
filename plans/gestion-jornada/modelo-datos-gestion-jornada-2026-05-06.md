---
modulo: gestion-jornada
creado: 2026-05-06
revisado: 2026-05-06
estado: CERRADO — listo para implementacion
plan: plans/gestion-jornada/plan-gestion-jornada-2026-05-06.md
tareas: plans/gestion-jornada/tareas-gestion-jornada-2026-05-06.md
---

# Modelo de Datos — Gestion de Jornada y Reporte Semanal

## Resumen

El modelo contiene 10 entidades. Las entidades principales del dia a dia son `project`, `task`, `subtask` y `attachment`. El ciclo de vida de los estados queda registrado en `task_status_history` y `subtask_status_history` para habilitar KPIs futuros sin migraciones. Las notificaciones emitidas se almacenan en `notification`. El informe semanal se guarda en `weekly_snapshot`, con cada una de sus 8 secciones desdoblada en version generada por IA y version editada por el usuario. Finalmente, `user_preferences` almacena la configuracion de la unica persona que usa la app.

Todos los datos se conservan de forma permanente. No hay eliminacion automatica ni expiracion de registros.

---

## Bloques funcionales

El modelo se organiza en tres areas de negocio cohesivas:

- **Registro de trabajo**: `project`, `task`, `subtask`, `attachment`, `task_status_history`, `subtask_status_history`.
- **Comunicacion y avisos**: `notification`.
- **Informe semanal**: `weekly_snapshot`.
- **Configuracion**: `user_preferences`.

---

## Entidades

### project

**Objetivo**: Agrupa las tareas bajo un nombre de proyecto o area de trabajo. Todo el trabajo del usuario pertenece a un proyecto. Un proyecto se cierra manualmente cuando el trabajo finaliza; sus tareas quedan archivadas pero nunca se borran.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Clave unica del proyecto | automatico | si | no | no |
| name | texto | si | Nombre visible del proyecto en todas las vistas | si | si | si | no |
| description | texto | no | Contexto adicional sobre el proyecto | si | si | si | no |
| status | opcion (`open` / `closed`) | si | Indica si el proyecto esta activo o archivado. Solo el usuario lo cambia, nunca el sistema automaticamente. Las transiciones son bidireccionales: un proyecto cerrado puede volver a abrirse. Default: `open` | automatico (open) | si | si | no |
| opened_at | fecha | si | Momento en que se creo el proyecto. Util para KPIs de duracion. | automatico | si | no | no |
| closed_at | fecha | no | Momento en que el usuario cerro el proyecto manualmente. Null mientras este abierto. | no | si | no | no |
| created_at | fecha | si | Timestamp de insercion en base de datos | automatico | no | no | no |
| updated_at | fecha | si | Timestamp de la ultima modificacion | automatico | no | no | no |

**Valores posibles de `status`**: `open`, `closed`.

#### Reglas de negocio

- Un proyecto solo puede cerrarse o reabrirse manualmente por el usuario. No hay cierre ni reapertura automatica.
- Al cerrar un proyecto, `closed_at` se rellena con la fecha actual.
- Al reabrir un proyecto, `closed_at` vuelve a `null` y `status` pasa a `open`. Cada reapertura queda registrada en `task_status_history` de las tareas que se reactiven como consecuencia (si aplica).
- Las transiciones de `status` son bidireccionales: `open → closed` y `closed → open`.
- No se puede eliminar un proyecto. Los datos son permanentes.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | — |
| Ver | si | — |
| Editar | si | Siempre permitido (incluyendo cambiar `status` de `closed` a `open`) |
| Eliminar | no | Los datos son permanentes |

---

### task

**Objetivo**: Representa una unidad de trabajo realizada por el usuario en un dia concreto. Es el registro central de la jornada. Cada tarea pertenece a un proyecto, tiene un estado que cambia a lo largo del tiempo y puede llevar adjuntos y subtareas.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Clave unica de la tarea | automatico | si | no | no |
| project_id | referencia a `project` | si | Proyecto al que pertenece la tarea. Obligatorio; no se permiten tareas sin proyecto. | si | si | si | no |
| title | texto | si | Titulo breve de la tarea, visible en todas las vistas | si | si | si | no |
| description | texto | no | Descripcion detallada del trabajo realizado | si | si | si | no |
| task_date | fecha | si | Dia en que se realizo o registro el trabajo. Por defecto, la fecha actual. | si (default hoy) | si | si | no |
| time_spent_minutes | numero | no | Tiempo dedicado declarado por el usuario, en minutos. Clave para KPIs futuros. | si | si | si | no |
| priority | opcion | no | Nivel de prioridad asignado por el usuario. Default: `medium`. | si | si | si | no |
| status | opcion | si | Estado actual de la tarea dentro de su ciclo de vida. Default: `in_progress`. | automatico (in_progress) | si | si | no |
| due_date | fecha | no | Fecha limite de la tarea. Si se fija, el sistema emite una notificacion el dia anterior. | si | si | si | no |
| closed_at | fecha | no | Momento en que la tarea se marco como completada. Null mientras este abierta. | no | si | no | no |
| created_at | fecha | si | Timestamp de insercion en base de datos | automatico | no | no | no |
| updated_at | fecha | si | Timestamp de la ultima modificacion | automatico | no | no | no |

**Valores posibles de `priority`**: `low`, `medium`, `high`.

**Valores posibles de `status`**: `in_progress`, `completed`, `blocked`.

#### Reglas de negocio

- Una tarea siempre debe tener un `project_id` valido. No se permiten tareas huerfanas.
- Cuando `status` cambia a `completed`, el sistema rellena `closed_at` con la fecha actual.
- Cuando una tarea se reabre (transicion `completed → in_progress` o `completed → blocked`), `closed_at` vuelve a `null`. Cada reapertura queda registrada en `task_status_history`.
- Las transiciones de `status` son bidireccionales. El usuario puede reabrir una tarea completada en cualquier momento.
- Cuando `status` cambia (sea cual sea la transicion, incluidas reaberturas), se crea un registro en `task_status_history`.
- Se pueden anadir o eliminar adjuntos a una tarea en cualquier estado: `in_progress`, `blocked` y `completed`. No hay restriccion por estado.
- No se puede eliminar una tarea. Los datos son permanentes.
- Si el proyecto padre esta `closed`, la tarea queda archivada y no aparece como pendiente, pero permanece visible en el historial.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | El proyecto padre debe estar `open` |
| Ver | si | — |
| Editar | si | Siempre permitido (incluyendo reabrir una tarea completada cambiando `status`) |
| Eliminar | no | Los datos son permanentes |

---

### subtask

**Objetivo**: Representa un paso concreto dentro de una tarea mas grande. Tiene su propia fecha limite y prioridad, independientes de la tarea padre. Se completa de forma independiente.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Clave unica de la subtarea | automatico | si | no | no |
| task_id | referencia a `task` | si | Tarea a la que pertenece esta subtarea | si | si | no | no |
| title | texto | si | Titulo de la subtarea, visible dentro de la tarea padre | si | si | si | no |
| priority | opcion | no | Prioridad propia de la subtarea, independiente de la tarea padre. Default: `medium`. | si | si | si | no |
| status | opcion | si | Estado de la subtarea. Default: `pending`. | automatico (pending) | si | si | no |
| due_date | fecha | no | Fecha limite propia. Si se fija, el sistema emite notificacion el dia anterior. | si | si | si | no |
| closed_at | fecha | no | Momento en que la subtarea se marco como completada. Null mientras este pendiente. | no | si | no | no |
| created_at | fecha | si | Timestamp de insercion | automatico | no | no | no |
| updated_at | fecha | si | Timestamp de la ultima modificacion | automatico | no | no | no |

**Valores posibles de `priority`**: `low`, `medium`, `high`.

**Valores posibles de `status`**: `pending`, `completed`.

#### Reglas de negocio

- Una subtarea hereda el proyecto de su tarea padre (relacion indirecta, no columna propia).
- Cuando `status` cambia a `completed`, el sistema rellena `closed_at`.
- Cada cambio de estado genera un registro en `subtask_status_history`.
- No se puede eliminar una subtarea. Los datos son permanentes.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | La tarea padre debe estar `in_progress` o `blocked` |
| Ver | si | — |
| Editar | si | Solo si `status != completed` |
| Eliminar | no | Los datos son permanentes |

---

### attachment

**Objetivo**: Representa un fichero adjunto asociado a una tarea (PDF, correo, Excel, imagen). Los PDF e imagenes se visualizan dentro de la app; los Excel y otros tipos se abren externamente con la aplicacion del sistema operativo. El registro del adjunto persiste permanentemente, incluso si el fichero fisico se elimina.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Clave unica del adjunto | automatico | si | no | no |
| task_id | referencia a `task` | si | Tarea a la que pertenece este adjunto | si | si | no | no |
| file_name | texto | si | Nombre original del fichero, visible al usuario | si | si | no | no |
| file_type | opcion | si | Tipo de fichero para determinar como visualizarlo. Valores: `pdf`, `image`, `excel`, `email`, `other`. | automatico (detectado) | si | no | no |
| storage_path | texto | si | Ruta o referencia interna donde esta guardado el fichero en el sistema de almacenamiento. No visible al usuario. | automatico | no | no | no |
| file_size_bytes | numero | no | Tamano del fichero en bytes. Util para historial y futuros limites. | automatico | si | no | no |
| is_deleted | si/no | si | Indica si el usuario ha eliminado el adjunto. El registro persiste pero el fichero fisico puede borrarse. Default: `false`. | automatico (false) | no | no | no |
| deleted_at | fecha | no | Momento en que el usuario elimino el adjunto. Null si no ha sido eliminado. | no | no | no | no |
| attached_at | fecha | si | Momento en que se adjunto el fichero | automatico | si | no | no |
| created_at | fecha | si | Timestamp de insercion | automatico | no | no | no |

**Valores posibles de `file_type`**: `pdf`, `image`, `excel`, `email`, `other`.

#### Reglas de negocio

- No hay limite de numero ni tamano de adjuntos por tarea en el MVP.
- Al "eliminar" un adjunto, `is_deleted` pasa a `true` y `deleted_at` se rellena. El registro no se borra fisicamente de la base de datos.
- Se pueden anadir y eliminar adjuntos a una tarea en cualquier estado: `in_progress`, `blocked` y `completed`. No hay restriccion por estado de la tarea padre.
- Los ficheros de tipo `pdf` e `image` se visualizan dentro de la propia app. Los ficheros de tipo `excel`, `email` y `other` se abren externamente con la aplicacion del sistema operativo; la app solo proporciona el enlace de descarga.
- El campo `storage_path` lo gestiona el sistema; el usuario nunca lo ve ni lo edita.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear (adjuntar) | si | Sin restriccion por estado de la tarea padre. Permitido en cualquier estado. |
| Ver | si | Solo si `is_deleted = false` |
| Editar | no | Los metadatos del adjunto no se modifican una vez subido |
| Eliminar (logico) | si | Permitido en cualquier estado de la tarea padre. Pide confirmacion. |

---

### task_status_history

**Objetivo**: Registra cada cambio de estado que experimenta una tarea a lo largo de su vida. Permite reconstruir la evolucion completa de cualquier tarea y calcular KPIs como tiempo medio en cada estado o frecuencia de bloqueos.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Clave unica del registro de cambio | automatico | no | no | no |
| task_id | referencia a `task` | si | Tarea cuyo estado cambio | automatico | no | no | no |
| previous_status | opcion | no | Estado anterior. Null en el primer registro (creacion de la tarea). | automatico | no | no | no |
| new_status | opcion | si | Estado nuevo al que transiciono la tarea | automatico | no | no | no |
| changed_at | fecha | si | Momento exacto del cambio de estado | automatico | no | no | no |

**Valores posibles de `previous_status` y `new_status`**: `in_progress`, `completed`, `blocked`.

#### Reglas de negocio

- Este registro lo crea exclusivamente el sistema cuando cambia `task.status`. El usuario no interactua directamente con esta tabla.
- No se puede editar ni eliminar ningun registro. Es un log inmutable.
- El primer registro de una tarea tiene `previous_status = null` y `new_status = in_progress` (o el estado inicial con el que se creo la tarea).
- Las reaberturas de tareas (`completed → in_progress` o `completed → blocked`) tambien generan un registro en esta tabla, de forma que el historial refleja el ciclo completo incluyendo reaberturas.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | automatico | Lo genera el sistema al cambiar `task.status` |
| Ver | no (de momento) | Reservado para el futuro panel de KPIs |
| Editar | no | Log inmutable |
| Eliminar | no | Log inmutable |

---

### subtask_status_history

**Objetivo**: Igual que `task_status_history` pero para subtareas. Registra cada cambio de estado de una subtarea para habilitar analisis historicos futuros.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Clave unica del registro de cambio | automatico | no | no | no |
| subtask_id | referencia a `subtask` | si | Subtarea cuyo estado cambio | automatico | no | no | no |
| previous_status | opcion | no | Estado anterior. Null en el primer registro (creacion). | automatico | no | no | no |
| new_status | opcion | si | Estado nuevo al que transiciono la subtarea | automatico | no | no | no |
| changed_at | fecha | si | Momento exacto del cambio de estado | automatico | no | no | no |

**Valores posibles de `previous_status` y `new_status`**: `pending`, `completed`.

#### Reglas de negocio

- Lo crea exclusivamente el sistema cuando cambia `subtask.status`. Log inmutable.
- No se puede editar ni eliminar ningun registro.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | automatico | Lo genera el sistema al cambiar `subtask.status` |
| Ver | no (de momento) | Reservado para el futuro panel de KPIs |
| Editar | no | Log inmutable |
| Eliminar | no | Log inmutable |

---

### notification

**Objetivo**: Registra cada aviso emitido al usuario sobre una fecha limite proxima. Sirve tanto para controlar que no se dupliquen avisos como para el historial de alertas y futuros KPIs de cumplimiento.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Clave unica de la notificacion | automatico | no | no | no |
| type | opcion | si | Tipo de evento que genero el aviso. Valor en MVP: `due_date_reminder`. | automatico | si | no | no |
| channel | opcion | si | Canal por el que se emitio el aviso: `in_app` o `email`. Por cada evento se crean dos registros, uno por canal. | automatico | si | no | no |
| task_id | referencia a `task` | no | Tarea a la que hace referencia el aviso. Null si el aviso es de una subtarea. | automatico | si | no | no |
| subtask_id | referencia a `subtask` | no | Subtarea a la que hace referencia el aviso. Null si el aviso es de una tarea. | automatico | si | no | no |
| sent_at | fecha | si | Momento en que se emitio el aviso | automatico | si | no | no |
| is_read | si/no | si | Indica si el usuario ha visto el aviso dentro de la app. Solo aplica a `channel = in_app`. Default: `false`. | automatico (false) | si | si | no |
| created_at | fecha | si | Timestamp de insercion | automatico | no | no | no |

**Valores posibles de `type`**: `due_date_reminder` (ampliable en el futuro).

**Valores posibles de `channel`**: `in_app`, `email`.

#### Reglas de negocio

- Por cada fecha limite que vence al dia siguiente, el sistema crea dos registros: uno con `channel = in_app` y otro con `channel = email`.
- Solo uno de `task_id` o `subtask_id` puede tener valor en un mismo registro; el otro debe ser null.
- `is_read` solo es relevante para `channel = in_app`. Para `channel = email` siempre sera `false` (no se puede saber si el usuario leyo el correo).
- No se pueden crear notificaciones manualmente. Solo el sistema las genera.
- No se pueden editar ni eliminar registros. El usuario solo puede marcar `is_read = true` en las notificaciones de app.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | automatico | Lo genera el sistema el dia antes del vencimiento |
| Ver | si | El usuario ve las notificaciones dentro de la app |
| Editar | condicional | Solo `is_read` puede cambiar, y solo en registros `channel = in_app` |
| Eliminar | no | Los datos son permanentes |

---

### weekly_snapshot

**Objetivo**: Almacena el informe semanal generado para un periodo concreto (lunes a domingo). Guarda el texto original producido por la IA y el texto editado por el usuario en cada una de las 8 secciones, de forma que el historial conserva ambas versiones para cualquier analisis futuro.

#### Columnas — identificacion y metadatos

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Clave unica del snapshot | automatico | si | no | no |
| week_start_date | fecha | si | Primer dia (lunes) de la semana que cubre este snapshot | automatico | si | no | no |
| week_end_date | fecha | si | Ultimo dia (domingo) de la semana que cubre este snapshot | automatico | si | no | no |
| status | opcion | si | Estado del snapshot: `generated` (recien creado), `downloaded` (el usuario lo descargo o copio), `unused` (generado pero no utilizado). Default: `generated`. | automatico (generated) | si | si | no |
| generated_at | fecha | si | Momento en que la IA genero el borrador | automatico | si | no | no |
| last_edited_at | fecha | no | Ultima vez que el usuario edito alguna seccion. Null si no ha editado nada. | automatico | si | no | no |
| created_at | fecha | si | Timestamp de insercion | automatico | no | no | no |
| updated_at | fecha | si | Timestamp de la ultima modificacion | automatico | no | no | no |

#### Columnas — seccion 1: Resumen ejecutivo

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| resum_executiu_generated | texto | si | Texto generado por la IA para el resumen ejecutivo de la semana | automatico | si | no | no |
| resum_executiu_edited | texto | no | Version que el usuario ha editado. Null si no ha modificado nada. El sistema usa este valor si existe; si no, usa el generado. | no | si | si | no |

#### Columnas — seccion 2: Reuniones clave

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| reunions_clau_generated | texto | si | Texto generado por la IA con las reuniones relevantes de la semana | automatico | si | no | no |
| reunions_clau_edited | texto | no | Version editada por el usuario | no | si | si | no |

#### Columnas — seccion 3: Proyectos en curso

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| projectes_en_curs_generated | texto | si | Texto generado por la IA sobre el avance de proyectos activos | automatico | si | no | no |
| projectes_en_curs_edited | texto | no | Version editada por el usuario | no | si | si | no |

#### Columnas — seccion 4: Facturacion y administracion

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| facturacio_administracio_generated | texto | si | Texto generado por la IA con tareas administrativas o de facturacion de la semana | automatico | si | no | no |
| facturacio_administracio_edited | texto | no | Version editada por el usuario | no | si | si | no |

#### Columnas — seccion 5: Desarrollos, automatizaciones y documentacion

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| desenvolupaments_generated | texto | si | Texto generado por la IA sobre desarrollos tecnicos, automatizaciones o documentacion producida | automatico | si | no | no |
| desenvolupaments_edited | texto | no | Version editada por el usuario | no | si | si | no |

#### Columnas — seccion 6: Soporte a otros equipos

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| suport_altres_equips_generated | texto | si | Texto generado por la IA sobre ayuda prestada a otros equipos durante la semana | automatico | si | no | no |
| suport_altres_equips_edited | texto | no | Version editada por el usuario | no | si | si | no |

#### Columnas — seccion 7: Necesidades para la supervisora

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| necessitats_supervisora_generated | texto | si | Texto generado por la IA con recordatorios o peticiones para la supervisora | automatico | si | no | no |
| necessitats_supervisora_edited | texto | no | Version editada por el usuario | no | si | si | no |

#### Columnas — seccion 8: Carga estimada

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| carrega_estimada_generated | texto | si | Texto generado por la IA con la estimacion de carga de trabajo para la semana siguiente | automatico | si | no | no |
| carrega_estimada_edited | texto | no | Version editada por el usuario | no | si | si | no |

**Valores posibles de `status`**: `generated`, `downloaded`, `unused`.

#### Reglas de negocio

- Solo puede existir un snapshot por semana. El campo `week_start_date` debe ser unico en la tabla (constraint UNIQUE). Si el usuario genera el informe dos veces en la misma semana, el sistema sobreescribe el snapshot existente para esa semana en lugar de crear uno nuevo.
- Si el usuario genera un snapshot en mitad de semana, `week_end_date` es el domingo del ciclo en curso aunque aun no haya llegado; el contenido refleja solo los dias transcurridos hasta ese momento.
- Las columnas `_generated` las rellena exclusivamente el sistema al llamar a la IA. El usuario no puede modificarlas.
- Las columnas `_edited` las rellena el usuario libremente desde la pantalla de revision. Son opcionales: si el usuario no edita una seccion, queda a null y el sistema utiliza la version generada.
- Al descargar o copiar el snapshot, `status` pasa a `downloaded` y se actualiza `updated_at`.
- No se puede eliminar un snapshot. Los datos son permanentes.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | automatico | Lo genera el sistema al solicitar el informe semanal |
| Ver | si | — |
| Editar | condicional | Solo las columnas `_edited` y `status`. Las columnas `_generated` son inmutables. |
| Eliminar | no | Los datos son permanentes |

---

### user_preferences

**Objetivo**: Almacena la configuracion personal del unico usuario de la app: su correo para recibir notificaciones y cualquier otra preferencia de comportamiento de la aplicacion. Solo existe un registro en esta tabla.

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Clave unica del registro de preferencias | automatico | no | no | no |
| notification_email | texto | no | Direccion de correo a la que se envian los avisos de fechas limite. Si esta vacio, el sistema usa el correo del propio usuario como destinatario de fallback. | si | si | si | no |
| week_start_day | opcion | si | Dia con el que empieza la semana para calcular el snapshot. Default: `monday`. Ampliable en el futuro. | automatico (monday) | si | si | no |
| created_at | fecha | si | Timestamp de creacion del registro | automatico | no | no | no |
| updated_at | fecha | si | Timestamp de la ultima modificacion | automatico | no | no | no |

**Valores posibles de `week_start_day`**: `monday` (unico valor en MVP; ampliable).

#### Reglas de negocio

- Solo existe un unico registro en esta tabla durante todo el ciclo de vida de la app (MVP de un solo usuario).
- El registro se crea en el primer arranque de la app o durante el proceso de configuracion inicial.
- El campo `notification_email` es opcional. Si el usuario no lo configura (queda a null o vacio), el sistema envia las notificaciones por correo al buzón del propio usuario (arnau.guitart@euncet.es) como direccion de fallback. Este comportamiento es transparente para el usuario.
- No se puede eliminar el registro. Si el usuario quiere "resetear", edita los campos.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | automatico | Se crea una sola vez en el primer arranque |
| Ver | si | — |
| Editar | si | — |
| Eliminar | no | — |

---

## Relaciones

| Entidad origen | Entidad destino | Tipo | Descripcion funcional |
|----------------|-----------------|------|----------------------|
| project | task | 1:N | Un proyecto contiene muchas tareas. Toda tarea pertenece a exactamente un proyecto. |
| task | subtask | 1:N | Una tarea puede tener varias subtareas. Una subtarea pertenece a exactamente una tarea. |
| task | attachment | 1:N | Una tarea puede tener muchos adjuntos. Un adjunto pertenece a exactamente una tarea. |
| task | task_status_history | 1:N | Una tarea genera un registro de historial cada vez que cambia de estado. |
| subtask | subtask_status_history | 1:N | Una subtarea genera un registro de historial cada vez que cambia de estado. |
| task | notification | 1:N | Una tarea puede haber generado varios avisos (uno por canal por cada vencimiento detectado). |
| subtask | notification | 1:N | Una subtarea puede haber generado varios avisos (uno por canal por cada vencimiento detectado). |

**Nota sobre `notification`**: En cada registro, `task_id` o `subtask_id` tiene valor, pero nunca los dos a la vez. Una notificacion hace referencia a una sola entidad (tarea o subtarea).

**Nota sobre `weekly_snapshot`**: No tiene clave foranea directa hacia `task` o `project`. El snapshot se genera consultando las tareas de la semana en el momento de la generacion, pero no mantiene un vinculo referencial permanente con ellas. Esto es intencional: si en el futuro una tarea cambia, el snapshot conserva el texto que reflejo la realidad de esa semana.

---

## Decisiones resueltas

Las siguientes decisiones estaban pendientes en el borrador inicial y han quedado cerradas con las respuestas del usuario el 2026-05-06.

| # | Decision | Resolucion |
|---|----------|-----------|
| 1 | Adjuntos en tareas bloqueadas o completadas | Se pueden anadir y eliminar adjuntos en cualquier estado de la tarea, incluido `blocked` y `completed`. Sin restriccion por estado. |
| 2 | Reapertura de proyectos cerrados | Se permite reabrir un proyecto cerrado. Las transiciones `open → closed` y `closed → open` son bidireccionales. Al reabrir, `closed_at` vuelve a null. |
| 3 | Reapertura de tareas completadas | Se permite reabrir una tarea completada. Las transiciones de `status` son bidireccionales. Cada reapertura queda registrada en `task_status_history`. |
| 4 | Unicidad del snapshot por semana | Solo un snapshot por semana. `week_start_date` tiene constraint UNIQUE. Si se genera el informe dos veces en la misma semana, se sobreescribe el existente. |
| 5 | Visualizacion de Excel en la app | Los Excel no se visualizan dentro de la app; se abren externamente con la aplicacion del sistema operativo. Solo PDF e imagenes se visualizan dentro de la app. |
| 6 | Correo de notificacion sin configurar | Si `notification_email` esta vacio en `user_preferences`, el sistema usa `arnau.guitart@euncet.es` como direccion de fallback. El usuario no recibe ningún error ni aviso por este motivo. |

---

## Estado del modelo

**CERRADO — Listo para implementacion** (2026-05-06)

Todas las decisiones pendientes han sido resueltas. El modelo de datos esta completo y validado. No quedan ambiguedades abiertas que bloqueen el desarrollo.

Para comenzar la implementacion de este modulo, usa el agente **implementacion**.
