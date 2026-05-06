# Webapp Skeleton — AI Stack

Base lista para arrancar **aplicaciones web nuevas** con un stack definido, reglas claras y **agentes de IA** que te acompañan en todo el camino: desde la idea hasta el código en pantalla.

No empiezas desde cero ni reinventas decisiones: abres el proyecto, eliges qué quieres construir, y los agentes guían el resto.

---

## ¿Qué es esto?

Un **esqueleto reutilizable** para crear aplicaciones web profesionales. Trae ya montado:

- Frontend y backend con un stack fijo y probado.
- Reglas internas que mantienen la calidad del código y la coherencia visual.
- Soporte multi-idioma, diseño responsive y sistema de diseño Molins listos desde el minuto cero.
- Un conjunto de **agentes especializados** que entienden el proyecto y te ayudan a avanzar en lenguaje natural.

Pensado para que un perfil de negocio pueda dirigir el producto y un perfil técnico pueda construirlo, ambos sobre la misma base.

---

## Cómo empezar

1. **Clona** este repositorio como punto de partida de tu proyecto.
2. **Dile al agente de IA**: *"Quiero montar este proyecto por primera vez"*.
   - Se encarga de comprobar que tienes lo necesario (Node.js, pnpm, Docker).
   - Te pregunta el nombre de tu aplicación y ajusta la base.
   - Arranca la base de datos, el backend y el frontend.
3. **Abre** http://localhost:5173 y ya ves la aplicación funcionando.

A partir de ahí, cada funcionalidad nueva sigue el mismo flujo: **idea → plan → modelo de datos → implementación**, siempre asistido por agentes.

---

## Los agentes

Cinco agentes especializados. Tú eliges el que necesitas en cada momento.

| Agente | Para qué lo usas |
|---|---|
| **setup** | Montar el proyecto por primera vez, resolver problemas de entorno, arrancar o reiniciar la base de datos. |
| **product-discovery** | Convertir una idea en un plan funcional claro, con tareas escritas en lenguaje de negocio. |
| **data-model** | Generar el modelo de datos (entidades, relaciones, reglas) a partir de un plan ya validado. |
| **implementacion** | Construir el código (frontend, backend, pruebas) siguiendo los planes y las reglas del proyecto. |
| **lineas-trabajo** | Ver en qué estás, consultar puntos de guardado, volver a un punto anterior o abrir una línea nueva desde ahí. |

Todos hablan en lenguaje no técnico cuando se dirigen a ti y manejan internamente el historial, las ramas y los puntos de guardado.

---

## Qué aporta el stack

- **Backend**: Node.js + TypeScript + Express + Drizzle + PostgreSQL.
- **Frontend**: React + Vite + Tailwind CSS.
- **Infraestructura local**: Docker para la base de datos.
- **Calidad**: tipos estrictos, pruebas automáticas, reglas de estilo y seguridad.
- **Multi-idioma**: español e inglés listos, con detección automática y memoria de la elección.
- **Responsive**: pensado de fábrica para funcionar bien en escritorio, tableta y móvil.
- **Identidad Molins**: tipografía, colores, iconografía y tono de voz coherentes.

Las decisiones de stack son fijas y no se cambian a la ligera. El objetivo es que cada proyecto nuevo arranque rápido y sin dudas sobre qué elegir.

---

## Las reglas del proyecto

Dentro de `.github/instructions/` viven las normas que los agentes respetan automáticamente: arquitectura, backend, frontend, sistema de diseño, identidad de marca, pruebas, seguridad, entrega, control de versiones, multi-idioma, diseño adaptativo e iconografía.

Son la garantía de que todo el código, venga del agente que venga, nace con el mismo criterio.

---

## Cómo se guarda el trabajo

Cada vez que validas un avance, se crea un **punto de guardado** estable al que siempre puedes volver. La idea: nunca pierdes trabajo y puedes explorar alternativas sin miedo.

Pregunta al agente **lineas-trabajo** cuando quieras consultar el historial o retomar desde un punto anterior.

---

## Siguiente paso

Abre la conversación con el agente que necesites y empieza. Si es la primera vez, di: **"Quiero montar este proyecto por primera vez"**.
