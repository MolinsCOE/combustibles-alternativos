---
modulo: usuarios-roles
creado: 2026-04-16
plan: plans/usuarios-roles/plan-usuarios-roles-2026-04-16.md
tareas: plans/usuarios-roles/tareas-usuarios-roles-2026-04-16.md
---

# Modelo de Datos — Usuarios y Roles

## Resumen

Modelo de dos entidades con relación 1:N. Un **Rol** agrupa usuarios por perfil de acceso. Un **Usuario** es una persona registrada en el sistema que siempre pertenece a exactamente un rol. La autenticación se gestionará por SSO en una fase posterior y no forma parte de este modelo.

## Entidades

### Rol

**Objetivo**: Representar las categorías de acceso del sistema. Cada rol define un perfil (Admin, Usuario básico, o cualquier otro creado por el administrador). Sirve como base para el futuro control de acceso (RBAC).

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador unico del rol | automatico | si | no | no |
| nombre | texto | si | Nombre identificativo del rol. Debe ser unico en el sistema. | si | si | si | no |
| descripcion | texto | no | Texto libre que explica el proposito del rol | si | si | si | no |
| fecha_creacion | fecha | si | Momento en que se creo el rol | automatico | si | no | no |
| fecha_actualizacion | fecha | si | Momento de la ultima modificacion del rol | automatico | si | no | no |

#### Reglas de negocio

- El nombre del rol debe ser unico. No pueden existir dos roles con el mismo nombre.
- Los roles "Admin" y "Usuario basico" se crean automaticamente como datos semilla al iniciar la aplicacion por primera vez.
- Los roles semilla no tienen proteccion especial: se pueden editar y eliminar como cualquier otro rol (respetando la regla de eliminacion segura).
- Un rol solo se puede eliminar si no tiene usuarios asignados.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Nombre no duplicado |
| Ver | si | — |
| Editar | si | — |
| Eliminar | condicional | Solo si no tiene usuarios asignados |

---

### Usuario

**Objetivo**: Representar a las personas registradas en el sistema. Cada usuario tiene un nombre, email y un rol asignado. El estado activo permite identificar cuentas habilitadas o deshabilitadas (informativo hasta que se implemente autenticacion por SSO).

#### Columnas

| Columna | Tipo | Obligatoria | Objetivo funcional | Crear | Ver | Editar | Eliminar |
|---------|------|-------------|-------------------|-------|-----|--------|----------|
| id | identificador | si | Identificador unico del usuario | automatico | si | no | no |
| nombre | texto | si | Nombre completo del usuario | si | si | si | no |
| email | texto | si | Direccion de correo electronico. Debe ser unica en el sistema. | si | si | si | no |
| activo | si/no | si | Indica si el usuario esta habilitado. Por defecto `true` al crear. | automatico | si | si | no |
| rol | referencia (Rol) | si | Rol asignado al usuario. Siempre exactamente uno. | si | si | si | no |
| fecha_creacion | fecha | si | Momento en que se creo el usuario | automatico | si | no | no |
| fecha_actualizacion | fecha | si | Momento de la ultima modificacion del usuario | automatico | si | no | no |

#### Reglas de negocio

- El email debe ser unico en todo el sistema. No pueden existir dos usuarios con el mismo email.
- El campo activo se establece como `true` por defecto al crear un usuario.
- Todo usuario debe tener exactamente un rol asignado. No se permite guardar sin rol.
- El campo activo es informativo en esta fase. Tendra efecto funcional cuando se implemente la autenticacion por SSO.

#### Operaciones sobre el registro completo

| Operacion | Permitida | Condicion |
|-----------|-----------|-----------|
| Crear | si | Email no duplicado, rol existente |
| Ver | si | — |
| Editar | si | — |
| Eliminar | si | — |

---

## Relaciones

| Entidad origen | Entidad destino | Tipo | Descripcion funcional |
|---------------|-----------------|------|----------------------|
| Rol | Usuario | 1:N | Un rol puede tener muchos usuarios. Cada usuario pertenece a exactamente un rol. Al ver el detalle de un rol se muestran sus usuarios asociados. |

## Decisiones pendientes

- Ninguna. Todas las decisiones han sido resueltas en el plan funcional (secciones D1, D2, D3) y la eliminacion de la contraseña ha sido confirmada (la autenticacion ira por SSO).

## Notas de alineacion

Notas de compatibilidad con la arquitectura y el stack del repositorio, verificadas contra `architecture.instructions.md` y `backend.instructions.md`:

- **Hexagonal por modulo**: las entidades `Rol` y `Usuario` se ubicaran en `apps/backend/src/modules/usuarios-roles/domain/` como objetos de dominio puros (sin dependencias de Drizzle, Express ni HTTP). Los puertos (interfaces de repositorio) viven en `domain/ports/`. Las implementaciones con Drizzle viven en `infrastructure/`. Los casos de uso en `application/`. Las rutas HTTP y validacion Zod en `interfaces/http/`.
- **Modulo unico**: aunque son dos entidades, se tratan como un unico modulo funcional (`usuarios-roles`) porque estan fuertemente relacionadas y se gestionan juntas. No se crean dos modulos separados.
- **Persistencia**: tabla `roles` y tabla `usuarios` definidas con Drizzle sobre PostgreSQL. La relacion 1:N se modela con una clave foranea `rol_id` en `usuarios`, con restriccion de integridad que impide eliminar un rol con usuarios asociados (la validacion se hace primero en el caso de uso para dar un mensaje funcional claro; la restriccion de base de datos actua como defensa en profundidad).
- **Unicidad**: indices unicos en `roles.nombre` y en `usuarios.email` a nivel de base de datos. La validacion se realiza tambien en el caso de uso para devolver un error de dominio claro antes de llegar a la base de datos.
- **Tipos de columnas**: `id` como `uuid` generado por la aplicacion o por la base de datos segun convencion del repositorio; `fecha_creacion` y `fecha_actualizacion` como `timestamptz`; `activo` como `boolean` con valor por defecto `true`.
- **Paginacion**: los casos de uso de listado devuelven `{ items, page, pageSize, total }`. La validacion Zod del endpoint limita `pageSize` a un maximo razonable para evitar consultas abusivas.
- **Semillas**: los roles "Admin" y "Usuario basico" se crean mediante el mecanismo de seed de Drizzle/Atlas en el arranque inicial, no por codigo ad hoc en el caso de uso.
- **Sin contrasena**: no hay campo `password` ni `hash` en `usuarios`. La autenticacion SSO se añadira en un modulo separado en el futuro.
- **Validacion Zod en los limites**: todos los inputs de la API (body, query, params) se validan con Zod antes de entrar al caso de uso. El frontend valida tambien con Zod en el formulario para coherencia y experiencia inmediata.
