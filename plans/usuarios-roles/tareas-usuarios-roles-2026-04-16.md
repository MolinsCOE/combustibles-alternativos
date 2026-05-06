---
modulo: usuarios-roles
creado: 2026-04-16
plan: plans/usuarios-roles/plan-usuarios-roles-2026-04-16.md
---

# Tareas Funcionales — Usuarios y Roles

## Fase 1 — CRUD de Roles

**Objetivo:** Que el administrador pueda gestionar los roles del sistema.

### ✅ T1.1 — Crear rol
**Descripcion:** Permitir crear un rol indicando nombre y descripción.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T1.2 — Validar nombre de rol único
**Descripcion:** Rechazar la creación de un rol cuyo nombre ya exista, mostrando un mensaje claro.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T1.3 — Listar roles paginados
**Descripcion:** Mostrar todos los roles con paginación (página, tamaño de página, total), indicando nombre, descripción y número de usuarios asociados.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T1.4 — Ver detalle de rol con sus usuarios
**Descripcion:** Permitir consultar el detalle de un rol, incluyendo la lista de usuarios que lo tienen asignado.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T1.5 — Editar rol
**Descripcion:** Permitir editar el nombre y la descripción de un rol existente.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T1.6 — Eliminar rol con validación de uso
**Descripcion:** Permitir eliminar un rol solo si no tiene usuarios asignados. Si los tiene, mostrar un mensaje explicando que debe reasignar o eliminar esos usuarios primero.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T1.7 — Roles semilla Admin y Usuario básico
**Descripcion:** Al iniciar la aplicación por primera vez, los roles "Admin" y "Usuario básico" deben existir automáticamente. No tienen protección especial — se pueden editar y eliminar como cualquier otro rol.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:**
- Existen al menos dos roles tras el primer arranque.
- Se puede crear un tercer rol, editarlo y eliminarlo sin problemas.
- Intentar crear un rol con nombre duplicado muestra un error claro.
- Intentar eliminar un rol con usuarios asignados es rechazado.

---

## Fase 2 — CRUD de Usuarios

**Objetivo:** Que el administrador pueda gestionar los usuarios del sistema y asignarles un rol.

### ✅ T2.1 — Crear usuario
**Descripcion:** Permitir crear un usuario indicando nombre, email y rol. El estado se establece como activo (`true`) por defecto si no se indica.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T2.2 — Validar email único
**Descripcion:** Rechazar la creación de un usuario cuyo email ya exista en el sistema, mostrando un mensaje claro.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T2.3 — Listar usuarios paginados
**Descripcion:** Mostrar todos los usuarios con paginación (página, tamaño de página, total), indicando nombre, email, rol asignado y estado.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T2.4 — Ver detalle de usuario
**Descripcion:** Permitir consultar el detalle de un usuario con todos sus datos visibles (nombre, email, estado, rol).
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T2.5 — Editar usuario
**Descripcion:** Permitir editar cualquier campo del usuario (nombre, email, estado, rol), respetando las validaciones de unicidad.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T2.6 — Eliminar usuario
**Descripcion:** Permitir eliminar un usuario del sistema.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T2.7 — Selector de rol desde roles existentes
**Descripcion:** Al crear o editar un usuario, el rol se selecciona de la lista de roles existentes, garantizando que siempre tenga un rol válido asignado.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:**
- Se puede crear un usuario, verificar que aparece en la lista y ver su detalle.
- Intentar crear un usuario con email duplicado muestra un error claro.
- Un usuario siempre tiene un rol asignado visible en la lista y el detalle.

---

## Fase 3 — Interfaz de administración

**Objetivo:** Que todas las operaciones de usuarios y roles se puedan realizar desde la interfaz web, aplicando la identidad de marca Molins y el design system.

### ✅ T3.1 — Pantalla de lista de roles
**Descripcion:** Pantalla que muestra los roles con paginación y permite crear, editar y eliminar desde ahí.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.2 — Pantalla de detalle de rol con usuarios asociados
**Descripcion:** Pantalla de detalle de un rol que muestra su información y la lista de usuarios que lo tienen asignado.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.3 — Pantalla de lista de usuarios
**Descripcion:** Pantalla que muestra los usuarios con paginación y permite crear, editar y eliminar desde ahí.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.4 — Formulario de usuario con selector de rol
**Descripcion:** Formulario de creación y edición de usuario, incluyendo un selector desplegable con los roles disponibles.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.5 — Formulario de rol
**Descripcion:** Formulario de creación y edición de rol (nombre y descripción).
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.6 — Validaciones en el formulario
**Descripcion:** Validaciones del lado del cliente: campos obligatorios, formato de email correcto, longitudes mínimas. Experiencia inmediata sin perder datos ya introducidos.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.7 — Mensajes de error claros
**Descripcion:** Mostrar mensajes de error específicos y accionables cuando una operación es rechazada (email duplicado, rol con usuarios asignados, campos faltantes, etc.), sin exponer errores internos.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

### ✅ T3.8 — Confirmación antes de eliminar
**Descripcion:** Antes de eliminar un usuario o un rol, mostrar un diálogo de confirmación explícito.
**Inicio:** 2026-04-16
**Fin:** 2026-04-16

**Validación esperada:**
- Todas las operaciones CRUD son realizables desde el navegador sin usar herramientas externas.
- Los errores de validación se muestran en el formulario sin perder los datos introducidos.
- Eliminar un elemento muestra una confirmación previa.
- El detalle de un rol muestra correctamente los usuarios asociados.
- Las pantallas respetan la identidad Molins y utilizan los componentes del design system.
