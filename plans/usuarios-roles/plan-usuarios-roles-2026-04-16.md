---
modulo: usuarios-roles
creado: 2026-04-16
tareas: plans/usuarios-roles/tareas-usuarios-roles-2026-04-16.md
---

# Plan Funcional — Usuarios y Roles

## 1. Resumen ejecutivo

Módulo base de gestión de usuarios y roles. Permite a un administrador crear, consultar, editar y eliminar usuarios y roles. Cada usuario pertenece a exactamente un rol. Este módulo sienta las bases para el futuro sistema de autenticación y control de acceso de la aplicación.

## 2. Objetivo del producto

Disponer de un CRUD completo de usuarios y roles que sirva como cimiento para:

- Autenticación (login/logout) en una fase posterior.
- Control de acceso basado en roles (RBAC) cuando se necesite.
- Gestión administrativa centralizada de las cuentas del sistema.

## 3. Problema que resuelve

Sin un registro de usuarios y roles, no hay forma de identificar quién opera en el sistema ni de restringir acciones. Este módulo cubre esa necesidad básica antes de construir autenticación.

## 4. Usuarios y perfiles

| Perfil | Descripción | Acceso al módulo |
|--------|-------------|------------------|
| Administrador | Gestiona usuarios y roles. Acceso total al CRUD. | Sí — completo |
| Usuario básico | Perfil por defecto para futuros usuarios del sistema. | No — el módulo estará oculto para este perfil en el futuro |

En esta fase no hay autenticación implementada, por lo que el módulo es accesible sin restricción. La protección se añadirá cuando se implemente el módulo de autenticación.

## 5. Alcance del MVP

### Roles

- Crear un rol (nombre, descripción).
- Listar roles con paginación.
- Ver detalle de un rol y los usuarios asociados.
- Editar un rol (nombre, descripción).
- Eliminar un rol (solo si no tiene usuarios asignados).

### Usuarios

- Crear un usuario (nombre, email, estado activo/inactivo, rol asignado).
- Listar usuarios con su rol, paginado.
- Ver detalle de un usuario.
- Editar un usuario (nombre, email, estado, rol).
- Eliminar un usuario.

### Datos semilla

- Al inicializar el sistema, existen dos roles predefinidos: **Admin** y **Usuario básico**.

### Reglas generales

- El email del usuario es único en todo el sistema.
- La autenticación se gestionará por SSO en una fase posterior. No se almacena contraseña en este módulo.
- Un usuario siempre tiene exactamente un rol.
- No se puede eliminar un rol que tenga usuarios asignados.

## 6. Fuera de alcance

- Autenticación (login, logout, sesiones, tokens). Se gestionará por SSO en una fase posterior.
- Autorización y control de acceso (protección de rutas por rol).
- Autoregistro de usuarios.
- Gestión de contraseñas (la autenticación irá por SSO).
- Gestión de permisos granulares dentro de un rol.
- Auditoría de cambios (log de quién creó/editó/eliminó).

## 7. Flujos funcionales principales

### 7.1 Gestión de roles

1. El administrador accede a la sección "Roles".
2. Ve la lista de roles existentes (nombre, descripción, número de usuarios).
3. Puede crear un nuevo rol indicando nombre y descripción.
4. Puede editar nombre y descripción de un rol existente.
5. Puede eliminar un rol solo si no tiene usuarios asignados. Si los tiene, se muestra un mensaje indicando que primero debe reasignar o eliminar esos usuarios.

### 7.2 Gestión de usuarios

1. El administrador accede a la sección "Usuarios".
2. Ve la lista de usuarios (nombre, email, rol, estado).
3. Puede crear un nuevo usuario indicando nombre, email, rol y estado.
4. Al crear, el sistema valida que el email no exista ya.
5. Puede editar cualquier campo del usuario (nombre, email, estado, rol).
6. Puede eliminar un usuario.

### 7.3 Relación Roles → Usuarios

- Al ver el detalle de un rol, se muestran los usuarios que pertenecen a él.
- Al crear o editar un usuario, se selecciona el rol de una lista desplegable con los roles disponibles.

## 8. Reglas de negocio

| # | Regla | Comportamiento |
|---|-------|----------------|
| R1 | Email único | Si se intenta crear un usuario con un email existente, se rechaza con mensaje claro. |
| R2 | Sin contraseña local | La autenticación se gestionará por SSO. No se almacena contraseña en este módulo. |
| R3 | Rol obligatorio | Todo usuario debe tener un rol asignado. No se permite guardar sin rol. |
| R4 | Eliminación de rol segura | No se puede eliminar un rol que tenga usuarios asociados. |
| R5 | Roles semilla | Los roles Admin y Usuario básico se crean automáticamente. No tienen protección especial — se pueden editar y eliminar como cualquier otro rol (respetando R4). |
| R6 | Estado por defecto | Al crear un usuario, el estado es activo (`true`) por defecto. |
| R7 | Paginación estándar | Las listas de usuarios y roles se sirven paginadas desde la API. El frontend consume la paginación con controles de navegación (página, tamaño de página, total). |

## 9. Información clave que se gestiona

### Rol

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre identificativo del rol (único). |
| Descripción | Texto libre que explica el propósito del rol. |

### Usuario

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre completo del usuario. |
| Email | Dirección de correo electrónico (único en el sistema). |
| Estado | Activo o inactivo. |
| Rol | Rol asignado al usuario (exactamente uno). |

## 10. Integraciones y dependencias externas

Ninguna. Este módulo es autocontenido y solo depende de la base de datos local.

## 11. Riesgos y decisiones pendientes

| # | Tema | Estado |
|---|------|--------|
| D1 | ¿Los roles semilla (Admin, Usuario básico) deben ser inmutables? | **Resuelto** — no hay protección especial. Se tratan como cualquier otro rol. |
| D2 | ¿Se necesita paginación en las listas desde el inicio? | **Resuelto** — sí. Paginación estándar en API y frontend desde el primer momento para sentar la base de la app. |
| D3 | ¿El campo "estado" tiene efecto funcional ahora? | **Resuelto** — el campo estado es `activo` por defecto (`true`) al crear un usuario. Es informativo hasta que se implemente auth. |

## 12. Fases recomendadas

### Fase 1 — CRUD de Roles

- Crear, listar (paginado), ver detalle, editar y eliminar roles.
- Roles semilla disponibles al iniciar la app.
- Validación: nombre de rol único.

### Fase 2 — CRUD de Usuarios

- Crear, listar (paginado), ver detalle, editar y eliminar usuarios.
- Asignación de rol al usuario.
- Validaciones: email único, rol obligatorio.

### Fase 3 — Interfaz de administración

- Pantallas para gestionar roles y usuarios.
- Vista de detalle de rol con lista de usuarios asociados.
- Formularios con validación en cliente.

## 13. Criterios funcionales de éxito

- Un administrador puede crear un rol y asignar usuarios a ese rol.
- Un administrador puede crear un usuario con email y rol.
- No se pueden crear dos usuarios con el mismo email.
- No se puede eliminar un rol con usuarios asignados.
- Los roles semilla existen desde el primer arranque de la aplicación.

## 14. Criterios no funcionales

Requisitos transversales que debe cumplir el módulo, expresados en clave funcional:

- **Identidad visual Molins**: todas las pantallas deben aplicar la identidad de marca Molins (logotipo, colores corporativos, tipografía y tono de voz cercano, claro, humano).
- **Uso del design system Molins**: los botones, formularios, tablas, modales, avisos y demás elementos visuales deben construirse con los componentes ya existentes del sistema de diseño. No se introducen componentes ad hoc si ya existe uno equivalente.
- **Idioma**: todos los textos visibles al usuario están en español.
- **Paginación estándar**: las listas de usuarios y de roles se muestran paginadas, con controles visibles de página anterior/siguiente, número de página y tamaño de página. Se aplica desde el primer momento tanto en el servidor como en la pantalla.
- **Accesibilidad básica**: formularios con etiquetas asociadas a cada campo, contraste suficiente, navegación por teclado funcional y mensajes de error anunciables por lectores de pantalla.
- **Validación en dos niveles**: toda entrada del usuario se valida tanto en el formulario (experiencia inmediata) como en el servidor (seguridad e integridad). Si el servidor rechaza, el formulario muestra el motivo concreto sin perder los datos introducidos.
- **Mensajes de error claros**: los mensajes son específicos y accionables (por ejemplo: "Ya existe un usuario con este email" o "No se puede eliminar este rol porque tiene 3 usuarios asignados"). Nunca se muestran errores internos o técnicos al usuario final.
- **Confirmación antes de eliminar**: al eliminar un usuario o un rol, se pide confirmación explícita en un diálogo antes de ejecutar la acción.

## 15. Siguiente paso

Una vez revisado y validado este plan, el siguiente agente a utilizar es **implementacion**, que construirá el módulo a partir del plan funcional, la lista de tareas y el modelo de datos.

- Si la base de datos local y el entorno de desarrollo ya están levantados (aplicación arrancando sin errores), puedes ir directamente al agente **implementacion**.
- Si es la primera vez que trabajas en este proyecto o el entorno no está operativo (por ejemplo, la aplicación no arranca, falta Docker, la base de datos no responde), pasa antes por el agente **setup** para dejar el entorno preparado.
