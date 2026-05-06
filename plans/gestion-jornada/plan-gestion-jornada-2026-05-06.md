---
modulo: gestion-jornada
creado: 2026-05-06
tareas: plans/gestion-jornada/tareas-gestion-jornada-2026-05-06.md
---

# Plan Funcional — Gestion de Jornada y Reporte Semanal

## 1. Resumen ejecutivo

Un tecnico de Molins necesita registrar su trabajo diario de forma rapida y sin fricciones: tareas realizadas, tiempo dedicado, proyectos a los que pertenecen y documentos asociados. Al final de cada semana, la app genera automaticamente un borrador del "Weekly Snapshot" en formato estructurado, listo para revisar. El usuario descarga o copia el borrador y lo envia desde su propio correo a la supervisora. El objetivo es eliminar el tiempo que hoy se dedica a reconstruir la semana de memoria y a dar formato manual al informe. Todos los datos se conservan de forma permanente para permitir analisis historicos y KPIs en el futuro.

---

## 2. Objetivo del producto

Permitir al usuario registrar su actividad laboral diaria de forma simple y que, al final de la semana, la app produzca automaticamente el borrador del informe semanal (Weekly Snapshot) sin que el usuario tenga que redactarlo desde cero.

---

## 3. Problema que resuelve

El usuario dedica tiempo cada semana a recordar que hizo, recopilar notas dispersas y dar formato a un informe estructurado de 8 secciones. Este proceso es lento, propenso a olvidos y poco escalable. La app centraliza el registro en el momento en que ocurre y automatiza la generacion del borrador.

---

## 4. Usuarios y perfiles

| Perfil | Descripcion |
|---|---|
| Tecnico (usuario principal) | Registra tareas, gestiona proyectos y genera el informe semanal. Una sola persona por instancia en el MVP. |
| Supervisora | Recibe el informe semanal por correo enviado manualmente por el usuario. No interactua con la app en el MVP. |

---

## 5. Alcance del MVP

- Registro de tareas diarias con: titulo, descripcion, fecha, tiempo dedicado, proyecto asociado, prioridad, estado y adjuntos.
- Gestion de proyectos: nombre, descripcion, estado (abierto/cerrado, cierre manual), sin fecha de cierre obligatoria.
- Subtareas dentro de cada tarea: titulo, fecha limite propia y prioridad propia.
- Adjuntos por tarea: PDF, correos, Excel e imagenes, sin limite de numero ni tamano, visualizados dentro de la app.
- Notificaciones de fechas limite 1 dia antes del vencimiento, por dos canales: dentro de la app y por correo electronico al usuario.
- Generacion automatica del borrador semanal en formato Weekly Snapshot (8 secciones).
- Revision y edicion del borrador antes de que el usuario lo use.
- El usuario descarga o copia el borrador y lo envia desde su propio correo. La app no realiza envios automaticos.
- Conservacion permanente de todos los datos para historial y futuros KPIs.

---

## 6. Fuera de alcance

- Acceso multiusuario o gestion de equipos.
- Portal o vista para la supervisora dentro de la app.
- Aprobacion o firma digital del informe.
- Seguimiento de horas facturables o integracion con sistemas de facturacion.
- Integracion con herramientas de terceros (Jira, Outlook, Teams) en el MVP.
- Envio automatico del Weekly Snapshot desde la app al correo de la supervisora (el usuario gestiona el envio desde su propio cliente de correo).
- Panel de KPIs e informes historicos (los datos se conservan desde el inicio para habilitarlo en una fase futura).

---

## 7. Flujos funcionales principales

### Flujo A — Registro de tarea diaria

1. El usuario accede a la app y ve su vista de trabajo del dia.
2. Crea una tarea nueva: escribe el titulo, selecciona el proyecto, indica el tiempo dedicado y el estado.
3. Opcionalmente: anade descripcion, prioridad, subtareas con fecha limite y adjuntos.
4. Guarda la tarea. Queda asociada a la fecha actual y al proyecto seleccionado.

### Flujo B — Gestion de proyecto

1. El usuario crea un proyecto con nombre y descripcion.
2. Asocia tareas al proyecto a medida que trabaja.
3. Cuando el proyecto termina, lo cierra manualmente. Las tareas asociadas quedan archivadas pero se conservan en el historial de forma permanente.

### Flujo C — Notificacion de fecha limite

1. Una tarea o subtarea tiene una fecha limite al dia siguiente.
2. La app avisa al usuario mediante dos canales: una notificacion dentro de la app y un correo electronico al usuario.
3. El usuario puede marcar la tarea como completada o actualizar la fecha desde la notificacion.

### Flujo D — Generacion del Weekly Snapshot

1. Al final de la semana (o cuando el usuario lo solicita), la app recopila todas las tareas registradas en los ultimos 7 dias.
2. Clasifica la informacion en las 8 secciones del Weekly Snapshot:
   - Resumen ejecutivo
   - Reuniones clave
   - Proyectos en curso
   - Facturacion / Administracion
   - Desarrollos / Automatizaciones / Documentacion
   - Soporte a otros equipos
   - Necesidades / Recordatorios para la supervisora
   - Carga estimada
3. Genera el borrador y lo presenta al usuario en una pantalla de revision.
4. El usuario edita libremente cualquier seccion del borrador.
5. Cuando esta conforme, descarga el borrador (o lo copia) y lo envia desde su propio correo a la supervisora.

### Flujo E — Visualizacion de adjuntos

1. El usuario abre una tarea que tiene adjuntos.
2. Ve la lista de ficheros adjuntos (PDF, correo, Excel, imagen).
3. Hace clic en un adjunto y lo visualiza dentro de la app sin necesidad de descargarlo.

---

## 8. Reglas de negocio

1. Una tarea siempre pertenece a un proyecto. No se permiten tareas sin proyecto asignado.
2. El cierre de un proyecto es manual y exclusivo del usuario. No hay cierre automatico por fechas.
3. Las subtareas heredan el proyecto de la tarea padre pero pueden tener fecha limite y prioridad independientes.
4. El borrador del Weekly Snapshot se genera a partir de las tareas de los ultimos 7 dias naturales (lunes a domingo). Si el usuario lo genera en mitad de la semana, incluye solo los dias transcurridos.
5. El borrador es editable en su totalidad antes de que el usuario lo use. La app no envia ningun correo automaticamente.
6. Los adjuntos se visualizan dentro de la app. El usuario puede anadir o eliminar adjuntos de una tarea en cualquier momento mientras la tarea este abierta. No hay limite de numero ni de tamano de adjuntos.
7. Las notificaciones de fecha limite se emiten 1 dia antes del vencimiento, tanto dentro de la app como por correo electronico al usuario.
8. Todos los datos (tareas, subtareas, proyectos, snapshots) se conservan de forma permanente. No hay eliminacion automatica ni politica de expiracion.

---

## 9. Informacion clave que se gestiona

| Informacion | Quien la crea | Quien la consulta | Cuando cambia |
|---|---|---|---|
| Tareas | Usuario | Usuario | Al registrar, actualizar o cerrar |
| Subtareas | Usuario | Usuario | Al crear o completar |
| Proyectos | Usuario | Usuario | Al crear, actualizar o cerrar |
| Adjuntos | Usuario | Usuario | Al adjuntar o eliminar |
| Borrador Weekly Snapshot | App (automatico) | Usuario | Al generar o editar |
| Snapshots generados | App | Usuario (historial) | Una vez por semana; conservados permanentemente |

---

## 10. Integraciones y dependencias externas

| Integracion | Proposito | Estado |
|---|---|---|
| Correo electronico (SMTP o similar) | Envio de notificaciones de fecha limite al usuario (1 dia antes) | Necesaria en MVP |
| IA generativa (Claude / ChatGPT API) | Generar el borrador estructurado del Weekly Snapshot a partir de las tareas de la semana | Necesaria en MVP |
| Envio del Weekly Snapshot | El usuario envia el informe desde su propio correo. La app solo genera el borrador descargable. Sin integracion SMTP para el envio del snapshot. | Fuera del MVP |

---

## 11. Riesgos y decisiones pendientes

Todas las decisiones previas han quedado cerradas. No hay decisiones pendientes en este momento.

| # | Asunto | Estado |
|---|---|---|
| R1 | La clasificacion automatica de tareas en las 8 secciones del snapshot depende de la calidad de los datos registrados. Si las tareas tienen descripciones pobres, el borrador sera de menor calidad. | Riesgo asumido; mitigable con buenas practicas de registro |
| R2 | La visualizacion de Excel dentro de la app puede requerir una libreria especifica. Si no existe en el stack aprobado, habra que evaluar alternativas (descarga directa o previsualizacion simplificada). | Pendiente de validacion tecnica en la fase de implementacion |

---

## 12. Datos a conservar para KPIs futuros

Todos los registros se conservan de forma permanente desde el primer dia. El objetivo es poder construir un panel de KPIs e informes historicos en una fase futura sin necesidad de recuperar datos perdidos.

Los campos y entidades que deben quedar en historico son:

**Tareas**
- Titulo, descripcion, fecha de creacion, fecha de cierre.
- Tiempo dedicado declarado por el usuario.
- Estado en cada momento (en curso, completada, bloqueada).
- Prioridad asignada.
- Proyecto al que pertenece.

**Subtareas**
- Titulo, fecha limite, prioridad, estado y fecha de cierre.
- Tarea padre a la que pertenecen.

**Proyectos**
- Nombre, descripcion, fecha de apertura, fecha de cierre manual.
- Estado (abierto / cerrado).

**Adjuntos**
- Nombre del fichero, tipo, fecha de adjunto, tarea asociada.
- No es necesario conservar el fichero eliminado, pero si el registro de que existio.

**Weekly Snapshots**
- Fecha de generacion, semana que cubre (fecha inicio y fin).
- Contenido de cada una de las 8 secciones en el momento de la generacion (antes de edicion y despues de edicion).
- Estado: generado / descargado / no usado.

**Notificaciones**
- Tipo de aviso, fecha en que se emitio, tarea o subtarea a la que hace referencia, canal utilizado (app / correo).

Con estos datos sera posible calcular metricas como: tiempo medio dedicado por proyecto, frecuencia de tareas por prioridad, cumplimiento de fechas limite, evolucion de carga semanal, proyectos con mas retrasos, entre otros.

---

## 13. Fases recomendadas

### Fase 1 — Registro y estructura basica
Gestion de proyectos y tareas: crear, editar, cerrar. Subtareas con fecha limite y prioridad. Sin adjuntos ni notificaciones todavia.

### Fase 2 — Adjuntos y notificaciones
Adjuntar y visualizar ficheros dentro de la app (sin limite de numero ni tamano). Notificaciones de fechas limite 1 dia antes por dos canales: dentro de la app y por correo al usuario.

### Fase 3 — Weekly Snapshot automatico
Generacion automatica del borrador con IA. Pantalla de revision y edicion. Descarga o copia del borrador para envio manual por el usuario.

### Fase 4 — Pulido y mejoras
Historial de snapshots generados. Panel basico de KPIs historicos. Ajustes de usabilidad basados en el uso real.

---

## 14. Criterios funcionales de exito

- El usuario puede registrar una tarea en menos de 60 segundos.
- El borrador del Weekly Snapshot cubre todas las tareas de la semana sin que el usuario tenga que anadir informacion manualmente que ya habia registrado.
- El usuario puede revisar y dejar listo el borrador para enviar en menos de 10 minutos.
- Los adjuntos se abren dentro de la app sin redirigir a otra herramienta.
- Ninguna fecha limite vence sin que el usuario haya recibido un aviso el dia anterior, tanto en la app como por correo.
- Todos los datos quedan en el sistema de forma permanente y son recuperables para analisis futuros.
