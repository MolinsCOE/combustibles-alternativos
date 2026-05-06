# Discovery — Combustibles Alternativos (CMI)

> Documento de discovery funcional generado el 2026-04-29.
> SMEs: Maribel Medrano (mmedrano@cmi.cemolins.es), Antonio Benito (abenito@cmi.cemolins.es)
> Plan completo: plans/combustibles-alternativos/plan-combustibles-alternativos-2026-04-29.md
> Tareas: plans/combustibles-alternativos/tareas-combustibles-alternativos-2026-04-29.md

---

## 1. Resumen ejecutivo

La aplicación web Combustibles Alternativos digitaliza y automatiza el proceso diario de seguimiento y planificación de suministros de combustibles alternativos en Cementos Molins Industrial (CMI). Actualmente el proceso depende de un fichero Excel con macros, acceso manual al sistema SGEX y envío de correos desde Outlook. La aplicación centraliza estas tres tareas en una interfaz web, elimina la dependencia del fichero Excel y ofrece trazabilidad completa de cada ejecución diaria. Los responsables del área de Producción pueden ver, validar y comunicar los datos de viajes sin manipular ficheros ni ejecutar macros.

**Problema principal:** el proceso actual es manual, propenso a errores humanos y sin trazabilidad. Si algo falla, no hay registro de qué ocurrió ni cuándo.

**Valor entregado:** el operador completa el proceso diario en menos tiempo, con menos pasos manuales, con validaciones automáticas y con un historial completo de lo que se ha hecho y enviado.

---

## 2. Usuarios y roles

| Rol | Descripción | Acciones principales |
|-----|-------------|----------------------|
| Operador de producción | Técnico que ejecuta el proceso diario (Maribel Medrano, Antonio Benito) | Cargar viajes, validar datos, enviar correos a proveedores, revisar planificación |
| Administrador del módulo | Responsable de mantener la tabla de mapeo y la configuración | Gestionar mapeos, configurar destinatarios, consultar histórico |

Pendiente de validar con los SMEs si estos dos roles corresponden a personas distintas o a las mismas.

---

## 3. Módulos funcionales

### 3.1 Panel de inicio
- KPIs del día: viajes cargados, desvío vs plan, envíos pendientes, incidencias.
- Accesos directos a las cuatro acciones principales.
- Selector de fecha del proceso (por defecto: día anterior).

### 3.2 Carga y clasificación de viajes
- Subida del fichero Excel exportado desde SGEX.
- Validación del formato del fichero antes de procesar.
- Clasificación automática de cada viaje según la tabla de mapeo activa (combustible, proveedor, porcentaje).
- Vista de viajes clasificados con filtros por combustible.
- Marcado de viajes "sin clasificar" cuando no hay mapeo correspondiente.

### 3.3 Planificación a 11 días
- Vista tabular por combustible: viajes reales, plan y modificación CMI por día.
- Campo editable para la modificación CMI (delta +/-) por día.
- Aviso visual cuando la variación supera ±3 viajes en un día.
- Guardado de borrador y preparación para envío.

### 3.4 Envíos a proveedores
- Envío de planificación 11 días: a todos los proveedores del combustible seleccionado.
- Envío de modificación CMI: solo a los proveedores del combustible modificado.
- Vista previa del correo (asunto y cuerpo con tabla HTML) antes de confirmar el envío.
- Registro de todos los envíos con fecha, hora, tipo, destinatarios y estado.

### 3.5 Envío de resumen diario a SMEs
- Correo automático o manual al finalizar el proceso.
- Destinatarios fijos: mmedrano@cmi.cemolins.es y abenito@cmi.cemolins.es.
- Adjunto: Excel original de SGEX.
- Cuerpo: tabla con combustibles, productos, transportistas y viajes del día.

### 3.6 Gestión de mapeos
- Vista completa de la tabla de mapeo (activos e inactivos).
- Alta, edición y desactivación de entradas.
- Validación automática: los porcentajes de un combustible deben sumar 100%.
- Gestión de destinatarios de correo por proveedor/transportista.
- Registro de cambios con fecha y usuario.

### 3.7 Trazabilidad e histórico
- Registro de cada ejecución diaria: fichero, fecha, resultado, usuario.
- Historial de envíos de correo.
- Notificación por correo ante errores (credenciales SGEX caducadas, formato incorrecto, error no contemplado).

---

## 4. Flujos principales

### Flujo diario estándar

1. El operador accede a la aplicación y ve el panel con los KPIs del día.
2. Descarga manualmente el Excel de SGEX (acceso externo, fuera de la app en el MVP) y lo sube a la aplicación.
3. La aplicación clasifica los viajes automáticamente y muestra la tabla de resultados.
4. El operador valida los datos y, si hay viajes sin clasificar, los revisa.
5. El operador accede a la planificación, ajusta las modificaciones CMI si las hay y guarda.
6. El operador envía los correos a proveedores (planificación y/o modificación CMI), con vista previa antes de cada envío.
7. El operador lanza el correo de resumen a los SMEs.
8. La ejecución queda registrada en el historial.

### Flujo de modificación CMI

1. Se produce un cambio en la planificación de un combustible.
2. El operador entra en la vista de planificación del combustible afectado.
3. Introduce el delta (+/-) en el día correspondiente.
4. La aplicación muestra un aviso si la variación supera ±3 viajes.
5. El operador prepara y envía el correo de modificación CMI solo a los proveedores de ese combustible.

### Flujo de excepción

1. Si el fichero subido no tiene el formato correcto, la aplicación muestra un error claro y no procesa datos.
2. Si un producto del fichero no tiene mapeo, se marca como "sin clasificar" y se genera un aviso.
3. Cualquier error no recuperable genera un correo de notificación a los SMEs con el detalle del fallo.

---

## 5. Reglas de negocio clave

1. Cada viaje se clasifica en un único combustible según el nombre de producto en SGEX y la tabla de mapeo vigente.
2. Si un combustible tiene varios proveedores, los viajes se distribuyen según el porcentaje de cada proveedor. Los porcentajes deben sumar 100% obligatoriamente.
3. La fecha de referencia por defecto es el día anterior. El operador puede cambiarla.
4. Un correo de planificación incluye los próximos 11 días desde la fecha de envío.
5. Un correo de modificación CMI solo va a los proveedores del combustible modificado e incluye el delta.
6. El aviso de variación elevada se activa cuando la diferencia entre plan y modificación CMI supera ±3 viajes en un día.
7. El correo de resumen diario va siempre a mmedrano@cmi.cemolins.es y abenito@cmi.cemolins.es, con el Excel de viajes adjunto.
8. Los mapeos desactivados no se aplican en nuevas cargas pero se conservan en el histórico.
9. Ningún correo a proveedores se envía sin que el operador haya visto la vista previa y confirmado.
10. Todo envío queda registrado con fecha, hora, tipo, destinatarios y estado.

---

## 6. Integraciones externas

| Sistema | Relación | Detalle |
|---------|----------|---------|
| SGEX (http://10.1.1.187:8080/SGEx/) | Entrada de datos | En el MVP el operador descarga el Excel manualmente y lo sube a la app. En fases futuras se puede automatizar. |
| Servidor SMTP corporativo CMI | Salida | Envío de correos a proveedores y SMEs. Host, puerto y credenciales a confirmar con IT de CMI. |
| Fichero Excel de viajes SGEX | Entrada | Columnas requeridas: Punto de expedición, Carta, Matrícula, Fecha Entrada, Fecha Salida, Emp. Transporte, Producto, Estado, Poids Sortie, Peso Neto. |

---

## 7. Backlog funcional priorizado

### Fase 1 — Base operativa (máxima prioridad)

| ID | Tarea | Valor |
|----|-------|-------|
| T1.1 | Panel de inicio con KPIs del día | Alto — primer contacto del operador con la app |
| T1.2 | Carga del fichero de viajes SGEX | Alto — entrada principal de datos |
| T1.3 | Clasificación automática de viajes por combustible y proveedor | Alto — núcleo del proceso |
| T1.4 | Vista de viajes del día clasificados | Alto — validación por el operador |
| T1.5 | Registro de ejecuciones (trazabilidad) | Alto — requisito de auditoría |
| T1.6 | Notificación por correo ante errores de carga | Medio — gestión de excepciones |

### Fase 2 — Planificación y envíos

| ID | Tarea | Valor |
|----|-------|-------|
| T2.1 | Vista de planificación a 11 días por combustible | Alto — operativa principal |
| T2.2 | Edición de la modificación CMI | Alto — operativa principal |
| T2.3 | Aviso visual por variación elevada | Medio — prevención de errores |
| T2.4 | Vista previa del correo de planificación | Alto — control antes de enviar |
| T2.5 | Envío del correo de planificación a proveedores | Alto — output principal |
| T2.6 | Envío del correo de modificación CMI | Alto — output principal |
| T2.7 | Envío del correo de resumen diario a SMEs | Alto — cierre del proceso |
| T2.8 | Historial de envíos | Medio — trazabilidad y auditoría |

### Fase 3 — Gestión de mapeos

| ID | Tarea | Valor |
|----|-------|-------|
| T3.1 | Vista de la tabla de mapeo completa | Alto — visibilidad de la configuración |
| T3.2 | Creación de un nuevo mapeo | Alto — mantenimiento sin Excel |
| T3.3 | Edición de un mapeo existente | Alto — mantenimiento sin Excel |
| T3.4 | Desactivación de un mapeo | Medio — gestión del ciclo de vida |
| T3.5 | Gestión de destinatarios de correo por proveedor | Alto — prerequisito para envíos correctos |

### Fase 4 — Automatización avanzada (post-MVP)

| ID | Tarea | Valor |
|----|-------|-------|
| T4.1 | Evaluación de integración directa con SGEX | Alto (decisión) |
| T4.2 | Descarga automatizada de viajes desde SGEX | Alto si T4.1 es viable |
| T4.3 | Soporte multi-planta | Medio |

---

## 8. Fuera de alcance del MVP

- Conexión directa y automatizada a SGEX (se evalúa en la fase 4).
- Soporte para más de una planta simultáneamente (el selector de planta queda preparado en la UI pero sin funcionalidad real en el MVP).
- Histórico de viajes más allá del año en curso.
- Panel de reporting avanzado o exportación a formatos adicionales.
- Aplicación móvil o PWA.
- Automatización del login en SGEX (bot/RPA).
- Integración con sistemas distintos al SMTP corporativo de CMI.

---

## 9. Decisiones y datos pendientes de validar con los SMEs

1. **Emails de proveedores**: no están en el PDD. Deben recopilarse y validarse antes de implementar los envíos (T3.5 es prerequisito).
2. **Separación de roles**: confirmar si el operador y el administrador son personas distintas o la misma.
3. **Configuración SMTP**: host, puerto y credenciales del servidor de correo corporativo de CMI.
4. **Hora de ejecución**: la frecuencia es diaria, pero la hora exacta del proceso no está definida.
5. **Envío automático vs. manual del resumen diario**: ¿el correo de resumen a los SMEs se lanza automáticamente o el operador lo inicia?
6. **Formato exacto del Excel de SGEX**: confirmar nombres de columnas y codificación del fichero exportado.
7. **Significado funcional de "Fila Planificación" y "Fila ACTUAL-S"**: estas referencias a filas del Excel original deben traducirse a un modelo propio de la aplicación. Requiere sesión de trabajo con los SMEs.
