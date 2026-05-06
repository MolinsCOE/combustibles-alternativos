---
modulo: gestion-jornada
creado: 2026-05-06
plan: plans/gestion-jornada/plan-gestion-jornada-2026-05-06.md
---

# Tareas Funcionales — Gestion de Jornada y Reporte Semanal

## Fase 1 — Registro y estructura basica

**Objetivo:** El usuario puede crear proyectos, registrar tareas con sus detalles y gestionar subtareas. Es la base sobre la que se construyen todas las funcionalidades siguientes.

### ⬜ T1.1 — Crear y gestionar proyectos
**Descripcion:** El usuario puede crear un proyecto con nombre y descripcion, editarlo y cerrarlo manualmente cuando termina. Los proyectos cerrados quedan archivados y sus tareas asociadas dejan de aparecer como activas, pero se conservan en el historial de forma permanente.
**Inicio:** —
**Fin:** —

### ⬜ T1.2 — Registrar una tarea diaria
**Descripcion:** El usuario puede crear una tarea indicando titulo, descripcion, fecha, proyecto asociado, tiempo dedicado, prioridad y estado. La tarea queda vinculada a la fecha del dia y al proyecto seleccionado.
**Inicio:** —
**Fin:** —

### ⬜ T1.3 — Anadir subtareas a una tarea
**Descripcion:** El usuario puede crear subtareas dentro de una tarea, cada una con su propio titulo, fecha limite y prioridad. Las subtareas se marcan como completadas de forma independiente.
**Inicio:** —
**Fin:** —

### ⬜ T1.4 — Editar y cerrar tareas
**Descripcion:** El usuario puede editar cualquier campo de una tarea mientras esta abierta y marcarla como completada cuando termina. Una tarea cerrada sigue siendo visible en el historial permanentemente pero no aparece como pendiente.
**Inicio:** —
**Fin:** —

### ⬜ T1.5 — Vista de trabajo diaria y semanal
**Descripcion:** El usuario ve de un vistazo las tareas del dia actual y puede navegar por la semana en curso. La vista muestra estado, proyecto y tiempo dedicado de cada tarea.
**Inicio:** —
**Fin:** —

**Validacion esperada:** El usuario puede crear un proyecto, registrar una tarea con subtareas y ver su actividad del dia y la semana sin perderse informacion.

---

## Fase 2 — Adjuntos y notificaciones

**Objetivo:** El usuario puede adjuntar documentos a sus tareas y recibe avisos 1 dia antes de que venza una fecha limite, tanto dentro de la app como por correo electronico.

### ⬜ T2.1 — Adjuntar ficheros a una tarea
**Descripcion:** El usuario puede adjuntar PDF, correos, Excel e imagenes a cualquier tarea, sin limite de numero ni de tamano. Los adjuntos quedan guardados y asociados a esa tarea.
**Inicio:** —
**Fin:** —

### ⬜ T2.2 — Visualizar adjuntos dentro de la app
**Descripcion:** El usuario puede abrir y ver un adjunto directamente en la app, sin necesidad de descargarlo ni abrir otra herramienta. Se contempla la visualizacion de PDF, imagenes y, si es viable tecnicamente, Excel.
**Inicio:** —
**Fin:** —

### ⬜ T2.3 — Eliminar adjuntos de una tarea
**Descripcion:** El usuario puede eliminar un adjunto de una tarea abierta si ya no es relevante. La eliminacion pide confirmacion antes de ejecutarse. El registro de que el adjunto existio se conserva en el historial.
**Inicio:** —
**Fin:** —

### ⬜ T2.4 — Notificacion de fecha limite dentro de la app
**Descripcion:** Cuando una tarea o subtarea tiene una fecha limite al dia siguiente, la app muestra una notificacion visible dentro de la aplicacion. El usuario puede marcar la tarea como completada o actualizar la fecha desde el aviso.
**Inicio:** —
**Fin:** —

### ⬜ T2.5 — Notificacion de fecha limite por correo electronico
**Descripcion:** Ademas del aviso dentro de la app, el usuario recibe un correo electronico automatico 1 dia antes del vencimiento de cualquier tarea o subtarea con fecha limite. El correo identifica claramente la tarea y su fecha.
**Inicio:** —
**Fin:** —

**Validacion esperada:** El usuario adjunta un PDF a una tarea, lo abre dentro de la app y recibe un aviso el dia anterior al vencimiento tanto en la app como en su correo, sin haber tenido que recordarlo manualmente.

---

## Fase 3 — Weekly Snapshot automatico

**Objetivo:** La app genera el borrador del informe semanal a partir de las tareas registradas, el usuario lo revisa y lo descarga o copia para enviarlo desde su propio correo, sin tener que redactarlo desde cero.

### ⬜ T3.1 — Recopilacion automatica de tareas de la semana
**Descripcion:** Al solicitar el Weekly Snapshot, la app agrupa automaticamente todas las tareas registradas en los ultimos 7 dias (lunes a domingo del ciclo en curso). Si se genera en mitad de semana, incluye solo los dias transcurridos.
**Inicio:** —
**Fin:** —

### ⬜ T3.2 — Generacion del borrador con las 8 secciones
**Descripcion:** A partir de las tareas recopiladas, la app genera un borrador estructurado con las 8 secciones del Weekly Snapshot: Resumen ejecutivo, Reuniones clave, Proyectos en curso, Facturacion/Administracion, Desarrollos/Automatizaciones/Documentacion, Soporte a otros equipos, Necesidades/Recordatorios para la supervisora, y Carga estimada.
**Inicio:** —
**Fin:** —

### ⬜ T3.3 — Pantalla de revision y edicion del borrador
**Descripcion:** El usuario ve el borrador generado seccion por seccion y puede editar libremente cualquier parte antes de usarlo. La app no realiza ningun envio automatico.
**Inicio:** —
**Fin:** —

### ⬜ T3.4 — Descarga o copia del borrador para envio manual
**Descripcion:** Desde la pantalla de revision, el usuario puede descargar el borrador (por ejemplo en formato texto o documento) o copiarlo al portapapeles para enviarlo desde su propio correo. La app guarda el borrador en el historial de snapshots generados.
**Inicio:** —
**Fin:** —

**Validacion esperada:** El usuario pulsa "Generar informe semanal", ve el borrador completo con todas las tareas de la semana clasificadas en las 8 secciones, lo edita si hace falta y lo deja listo para enviar en menos de 10 minutos.

---

## Fase 4 — Pulido y mejoras

**Objetivo:** Mejorar la experiencia basandose en el uso real y anadir el historial y las bases para futuros KPIs.

### ⬜ T4.1 — Historial de Weekly Snapshots generados
**Descripcion:** El usuario puede consultar los borradores de informes semanales generados anteriormente, ver su contenido y saber la semana que cubren. Todos se conservan de forma permanente.
**Inicio:** —
**Fin:** —

### ⬜ T4.2 — Configuracion de preferencias del usuario
**Descripcion:** El usuario puede configurar su direccion de correo para recibir notificaciones de fechas limite y ajustar cualquier otra preferencia de la aplicacion (como el dia de inicio de semana si se decide incorporar).
**Inicio:** —
**Fin:** —

### ⬜ T4.3 — Base de datos historica lista para KPIs
**Descripcion:** Se verifica que todos los campos definidos para analisis historico (tareas, subtareas, proyectos, snapshots, notificaciones) esten correctamente almacenados y sean consultables. Se deja preparado el acceso a estos datos para que un panel de KPIs pueda construirse en el futuro sin migraciones adicionales.
**Inicio:** —
**Fin:** —

**Validacion esperada:** El usuario puede ver sus informes anteriores, ajustar su configuracion de correo y confirmar que todos sus datos historicos estan disponibles para consulta futura.
