---
modulo: combustibles-alternativos
creado: 2026-05-04
plan: plans/combustibles-alternativos/plan-combustibles-alternativos-2026-05-04.md
---

# Tareas Funcionales — Combustibles Alternativos

## Fase 1 — Maestros y configuración base

**Objetivo:** Disponer del catálogo de materiales, proveedores, transportistas, destinos y asignaciones configurado y mantenible por el Administrador antes de activar cualquier flujo operativo.

### ⬜ T1.1 — Gestión de materiales
**Descripción:** El Administrador puede crear, editar y desactivar materiales. Cada material tiene nombre, destino por defecto, restricción horaria opcional (ej. solo 09:00–14:00 h) e indicador de activo/inactivo. El MVP arranca con todos los materiales en uso (Madera Fina, Cáscaras de Anacardo, CSR Fino, CSR Grueso Bunkers, Biomasa Gruesa, NFU, Amoniaco, Sulfato Ferroso y otros). Un material inactivo no aparece en nuevas solicitudes.
**Inicio:** —
**Fin:** —

### ⬜ T1.2 — Gestión de proveedores
**Descripción:** El Administrador puede crear, editar y desactivar proveedores. Cada proveedor tiene nombre y una dirección de correo electrónico de contacto.
**Inicio:** —
**Fin:** —

### ⬜ T1.3 — Gestión de transportistas
**Descripción:** El Administrador puede crear, editar y desactivar transportistas. Cada transportista tiene nombre y puede tener uno o más correos de contacto (ej. RUIZ MILA tiene dos direcciones).
**Inicio:** —
**Fin:** —

### ⬜ T1.4 — Gestión de destinos
**Descripción:** El Administrador puede mantener el catálogo de destinos de descarga en fábrica (QUEMADOR SILO 1, QUEMADOR SILO 2, BUNKERS, PISOS MOVILES, A DEPOSITO, A C-31/C-35). Los destinos se seleccionan al configurar materiales.
**Inicio:** —
**Fin:** —

### ⬜ T1.5 — Asignación proveedor–transportista–porcentaje por material
**Descripción:** El Administrador puede definir, para cada material, qué proveedor lo suministra y qué transportistas lo reparten con qué porcentaje de viajes. El sistema valida que la suma de porcentajes de todas las líneas de un mismo material y proveedor sea exactamente 100% antes de guardar.
**Inicio:** —
**Fin:** —

### ⬜ T1.6 — Carga inicial de maestros
**Descripción:** Se cargan los datos reales de partida: los materiales, proveedores, transportistas, destinos y asignaciones actualmente en uso (tal y como figuran en el Excel de programación actual), para que el sistema arranque ya operativo.
**Inicio:** —
**Fin:** —

**Validación esperada:** El Administrador puede entrar a cada pantalla de maestros, ver los datos cargados, editar un registro y comprobar que el cambio se guarda correctamente. La validación del 100% de porcentajes impide guardar si la suma no cuadra.

---

## Fase 2 — Solicitud semanal de Producción

**Objetivo:** Producción puede crear, editar y enviar a Compres la planificación semanal de viajes por material y día sin usar correo ni Excel.

### ⬜ T2.1 — Formulario de nueva solicitud semanal
**Descripción:** Producción accede a "Nueva solicitud" y encuentra una tabla con una fila por material activo y columnas para cada día de la semana (L–D). Puede introducir el número de viajes en cada celda y añadir comentarios por línea y un comentario general de semana.
**Inicio:** —
**Fin:** —

### ⬜ T2.2 — Guardado en borrador
**Descripción:** Producción puede guardar la solicitud como borrador en cualquier momento sin enviarla. El borrador es editable tantas veces como sea necesario. Solo puede existir un borrador activo por semana.
**Inicio:** —
**Fin:** —

### ⬜ T2.3 — Envío de la solicitud a Compres
**Descripción:** Producción envía la solicitud cuando está lista. El estado pasa a "Pendiente de distribución" y Compres recibe un aviso en la plataforma. A partir de ese momento, Producción solo puede consultar la solicitud hasta que Compres inicie la distribución.
**Inicio:** —
**Fin:** —

### ⬜ T2.4 — Listado de solicitudes
**Descripción:** Producción ve un listado de las solicitudes pasadas y la activa con su estado (Borrador, Pendiente de distribución, En distribución, Enviada, Confirmada, Cerrada) y puede acceder al detalle de cada una.
**Inicio:** —
**Fin:** —

**Validación esperada:** Producción puede crear una solicitud para la semana siguiente, rellenar los viajes de tres materiales, guardar como borrador, volver a editarla y finalmente enviarla. Compres ve la notificación y puede acceder a la solicitud.

---

## Fase 3 — Distribución y envío de Compres

**Objetivo:** Compres distribuye los viajes entre proveedores y transportistas aplicando las asignaciones configuradas, y envía la comunicación semanal de forma automática desde la plataforma.

### ⬜ T3.1 — Vista de solicitud pendiente con distribución propuesta
**Descripción:** Compres accede a la solicitud en estado "Pendiente de distribución" e introduce el total de viajes de la semana por material. El sistema aplica los porcentajes de los maestros sobre ese total semanal y presenta la sugerencia de reparto por proveedor y transportista. Si el cálculo produce decimales, se redondea y el sistema avisa para que Compres cuadre la suma.
**Inicio:** —
**Fin:** —

### ⬜ T3.2 — Distribución manual por días
**Descripción:** A partir de la sugerencia de total semanal por empresa, Compres distribuye manualmente los viajes de cada proveedor y transportista por días (L–D). El sistema muestra en todo momento si la suma de días cuadra con el total semanal asignado a cada empresa, alertando si hay diferencia.
**Inicio:** —
**Fin:** —

### ⬜ T3.3 — Generación de correos por empresa destino
**Descripción:** El sistema genera un correo por cada empresa destinataria (proveedor y transportista) con una tabla que muestra sus materiales asignados, origen, destino y número de viajes por día de la semana. El formato del correo es equivalente al producido por la macro actual de Excel (tabla HTML con asunto "Programación de suministros - Semana X - [Nombre empresa]").
**Inicio:** —
**Fin:** —

### ⬜ T3.4 — Envío de comunicaciones
**Descripción:** Compres revisa los correos generados y lanza el envío. El sistema los envía a todos los destinatarios configurados en los maestros desde la dirección `compras@molins` (configurable por variable de entorno). La planificación pasa a estado "Enviada". Compres puede reenviar el correo a un destinatario concreto de forma individual si es necesario.
**Inicio:** —
**Fin:** —

**Validación esperada:** Compres lanza el proceso para una semana real y los correos llegan a las direcciones de FOMENT, RUIZ MILA, RUMO y demás con la tabla de su planificación correcta. La planificación queda en estado "Enviada" en la plataforma.

---

## Fase 4 — Confirmación de proveedores y transportistas

**Objetivo:** El proveedor/transportista puede entrar a la plataforma y confirmar o rechazar su planificación semanal, eliminando el circuito de confirmación por correo.

### ⬜ T4.1 — Vista de planificación del proveedor/transportista
**Descripción:** El usuario con rol Proveïdor accede a la plataforma y ve únicamente su planificación semanal: los materiales asignados, el destino, la restricción horaria si la hay, y el número de viajes por día. No ve datos de otras empresas.
**Inicio:** —
**Fin:** —

### ⬜ T4.2 — Confirmación o rechazo por línea
**Descripción:** El proveedor/transportista puede marcar cada línea como Confirmada o Rechazada. Si rechaza, debe indicar obligatoriamente un motivo en texto libre antes de poder guardar.
**Inicio:** —
**Fin:** —

### ⬜ T4.3 — Confirmación global
**Descripción:** El proveedor/transportista puede usar "Confirmar todo" para confirmar todas las líneas de la semana a la vez cuando no hay ninguna objeción.
**Inicio:** —
**Fin:** —

### ⬜ T4.4 — Visibilidad de confirmaciones para Compres
**Descripción:** Compres tiene una vista en tiempo real del estado de confirmación de todas las líneas de la semana: qué empresas han confirmado, cuáles han rechazado (con el motivo visible) y cuáles están pendientes. Puede filtrar por estado.
**Inicio:** —
**Fin:** —

### ⬜ T4.5 — Redistribución ante rechazos
**Descripción:** Si Compres decide redistribuir viajes tras recibir rechazos, puede volver a la distribución, ajustarla y reenviar el correo al proveedor/transportista afectado. La planificación vuelve a estado "Enviada" para las líneas modificadas.
**Inicio:** —
**Fin:** —

**Validación esperada:** Un usuario de FOMENT entra a la plataforma, ve su planificación de la semana, confirma tres líneas y rechaza una con motivo "No hay disponibilidad de camiones el miércoles". Compres ve ese rechazo en tiempo real con el motivo visible.

---

## Fase 5 — Cruce real vs planificado y dashboard

**Objetivo:** Detectar y registrar automáticamente las desviaciones entre viajes confirmados y viajes realmente recibidos, y ofrecer una vista consolidada del estado de la semana.

### ⬜ T5.1 — Registro manual de viajes reales
**Descripción:** Compres o Producción puede introducir, para cualquier día de la semana, los viajes realmente recibidos en fábrica: material, proveedor, transportista y número de viajes. Esta entrada es manual en el MVP (los datos los proporciona actualmente Prosegur por correo).
**Inicio:** —
**Fin:** —

### ⬜ T5.2 — Cruce automático planificado vs real
**Descripción:** Al guardar los viajes reales de un día, el sistema los compara con la planificación confirmada de ese mismo día. Genera una tabla con: viajes previstos, viajes realizados, diferencia y estado (OK si coinciden o hay más, Incidencia si hay menos).
**Inicio:** —
**Fin:** —

### ⬜ T5.3 — Registro de incidencias
**Descripción:** Cuando los viajes reales son inferiores a los confirmados, el sistema crea automáticamente una incidencia asociada a la línea afectada (fecha, material, proveedor/transportista, desviación). Compres puede añadir un comentario interno a cada incidencia.
**Inicio:** —
**Fin:** —

### ⬜ T5.4 — Dashboard de la semana
**Descripción:** Producción y Compres tienen acceso a un panel con los KPIs de la semana en curso: total de viajes previstos vs realizados, porcentaje de cumplimiento, número de incidencias abiertas, líneas pendientes de confirmación y acceso rápido al cruce del día anterior.
**Inicio:** —
**Fin:** —

**Validación esperada:** Para un día con datos reales introducidos, el sistema muestra correctamente qué proveedor/transportista ha cumplido y cuál ha desviado. El dashboard refleja los totales actualizados. Las incidencias quedan registradas y son consultables.
