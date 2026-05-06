---
description: "Usar siempre que un agente hable con el usuario sobre ramas, commits, historial, versiones o hashes. Define el vocabulario que se debe usar de cara al usuario (no tecnico) y la estrategia interna de control de versiones (gitflow + rama por modulo)."
---
<!-- AUTO-GENERATED from .shared_ai/instructions/version-control.md — DO NOT EDIT. Run: pnpm sync-ai -->

# Control de versiones — reglas de agentes

Este proyecto usa **git** internamente siguiendo una variante simplificada de **gitflow**, pero el usuario es una persona de negocio que **no conoce git**. Todos los agentes deben cumplir estas dos reglas:

1. **Internamente** se usa git de forma rigurosa (ramas, commits, historial).
2. **Externamente** (mensajes al usuario) nunca se mencionan terminos tecnicos de git.

## Vocabulario obligatorio de cara al usuario

| No uses (tecnico) | Usa (usuario) |
|---|---|
| Branch, rama | **Linea de trabajo** |
| Commit, checkpoint, hash | **Punto de guardado** |
| SHA / hash hexadecimal | No se muestra al usuario. Se guarda solo en el fichero de estado. |
| Reset / checkout / revert | **Retomar desde un punto de guardado** (siempre creando una nueva linea de trabajo) |
| Merge de `feature/<modulo>` en `develop` | **Unificar el modulo** |
| Push / pull / fetch | **Compartir** / **traer cambios del equipo** (solo si el usuario lo pide) |
| Remote | **Repositorio del equipo** |
| `main`, `develop`, `feature/...` | Se ocultan. Solo se habla de "la linea principal" y "la linea del modulo X". |

## Estrategia interna (gitflow simplificado)

- `main`: version estable. Nunca se trabaja directamente sobre ella.
- `develop`: integracion continua de modulos validados.
- `feature/<modulo>`: una rama por modulo funcional, salida de `develop`.
- `feature/<modulo>-retomado-<fecha>`: cuando el usuario decide retomar desde un punto anterior, se crea una nueva rama desde ese commit. **Nunca se hace reset duro**, no se pierde historial.

### Ciclo de una feature

1. Se crea `feature/<modulo>` desde `develop` al empezar la implementacion.
2. Cada "punto de guardado" es un commit en esa rama, creado **solo cuando el usuario confirma que esta bien** tras pasar las validaciones.
3. Al cerrar el modulo entero, se propone al usuario "unificar el modulo" (merge `--no-ff` a `develop`).

### Procedimiento de commit de un punto de guardado (regla dura)

Un punto de guardado es **un unico commit** en `feature/<modulo>` + una **tag de git anotada** que le pone nombre estable. El JSON del estado del modulo **no** guarda hashes de commit directamente: guardar un hash dentro del propio commit es circular (tras cualquier `--amend` o rebase el hash cambia y queda desactualizado). En su lugar guarda el **nombre de la tag**, que es estable y navegable con `git show <tag>`.

Convencion de nombres de tag: `pg-<modulo>-<NNN>` (tres digitos, en minusculas). Ejemplos: `pg-usuarios-roles-001`, `pg-usuarios-roles-002`.

Procedimiento exacto cuando el usuario valida:

1. Actualizar `tareas-<modulo>-YYYY-MM-DD.md` (iconos, fechas de fin).
2. Actualizar `estado-<modulo>.json`:
   - Marcar tareas como `completada`, rellenar fechas.
   - En el campo `commit` de cada tarea y en `commit` del nuevo entry de `puntosGuardado`, escribir **ya** el nombre futuro de la tag (se conoce de antemano porque sigue la convencion `pg-<modulo>-<NNN>`).
3. Pasar el gate completo (`pnpm lint && pnpm typecheck && pnpm test && pnpm build`). Si falla, corregir y repetir.
4. `git add -A` y `git commit -m "<mensaje descriptivo>"`.
5. Crear la tag anotada sobre `HEAD`: `git tag -a pg-<modulo>-<NNN> -m "<descripcion corta>"`.
6. Verificar: `git show pg-<modulo>-<NNN>` debe mostrar el commit y los ficheros cambiados.

Asi el commit es uno solo, el JSON queda autoconsistente (no hay placeholders ni hashes circulares) y el punto de guardado se identifica por un nombre estable en vez de por un hash que puede quedar huerfano.

Nunca hacer `--amend` sobre commits ya mergeados a `develop` o compartidos con el equipo. Nunca borrar ni mover tags de puntos de guardado ya validados.

### Reglas duras

- **Nunca** `git reset --hard`, `git push --force`, `rebase` de commits ya validados, ni borrar ramas con puntos de guardado del usuario.
- **Nunca** hacer `push` sin confirmacion explicita del usuario.
- **Nunca** operar sobre el remoto por defecto del skeleton (`Molins-Development/webapp-skeleton-ai-stack`). El remoto debe haberse cambiado en la fase de setup.
- Antes de cualquier commit, ejecutar en orden y corregir errores: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Solo cuando todo pasa se pide validacion al usuario.

## Ficheros de estado por modulo

Cada modulo en `plans/<modulo>/` tiene dos ficheros complementarios.

**Regla dura sobre los ficheros de `plans/<modulo>/`** (aplica a `estado-<modulo>.json`, `tareas-<modulo>-*.md`, `plan-<modulo>-*.md`, `modelo-datos-<modulo>-*.md` y cualquier otro documento del modulo):

- **NUNCA se borran.** Son fuente de verdad historica del modulo.
- **NUNCA se recrean desde cero** (borrar + crear de nuevo) aunque el contenido sea casi igual. Solo se **editan en sitio** con operaciones de edicion parcial que preserven el historial de cambios.
- Si un agente necesita cambiar el estado de una tarea, un punto de guardado, o una fecha, debe hacerlo con una edicion puntual del fichero correspondiente, no sustituyendolo entero.
- Si parece que hay que borrar uno de estos ficheros, es sintoma de un error: parar, releer esta instruccion, y editarlo en su lugar.


### `tareas-<modulo>-YYYY-MM-DD.md` (legible por el usuario)

Lista de tareas con estado visible. Cada tarea incluye:

- Icono de estado: `⬜` pendiente / `🟡` en curso / `✅` completada.
- Identificador corto (`T1.1`, `T1.2`, ...).
- Titulo breve.
- Descripcion en lenguaje funcional.
- Fecha de inicio de desarrollo.
- Fecha de fin de desarrollo.

Nunca aparecen en este fichero: nombres de ramas, hashes, remotos ni terminos de git.

### `estado-<modulo>.json` (interno, no mostrar al usuario)

Estado tecnico del modulo. El agente lo lee y escribe; el usuario no lo abre ni lo entiende. Estructura:

```json
{
  "modulo": "<nombre-modulo>",
  "ramaFeature": "feature/<modulo>",
  "baseRama": "develop",
  "tareas": [
    {
      "id": "T1.1",
      "titulo": "...",
      "estado": "pendiente | en-curso | completada",
      "inicio": "YYYY-MM-DDTHH:mm:ssZ | null",
      "fin": "YYYY-MM-DDTHH:mm:ssZ | null",
      "commit": "<hash | null>",
      "validadaPorUsuario": false
    }
  ],
  "puntosGuardado": [
    {
      "id": "pg-001",
      "descripcion": "Texto humano con lo validado",
      "commit": "<hash>",
      "rama": "feature/<modulo>",
      "fecha": "YYYY-MM-DDTHH:mm:ssZ",
      "tareasIncluidas": ["T1.1", "T1.2"]
    }
  ],
  "lineasDerivadas": [
    {
      "desdePunto": "pg-001",
      "rama": "feature/<modulo>-retomado-YYYY-MM-DD",
      "motivo": "Texto del usuario que explica por que retomo"
    }
  ]
}
```

El JSON es la fuente de verdad de lo tecnico; el MD es la fuente de verdad de lo funcional. **Deben mantenerse sincronizados** por los agentes que tocan tareas.
