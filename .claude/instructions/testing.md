---
description: "Use when writing, reviewing, or planning tests: unit tests, integration tests, E2E with Playwright, coverage goals, Testcontainers setup, or test strategy decisions."
---
<!-- AUTO-GENERATED from .shared_ai/instructions/testing.md — DO NOT EDIT. Run: pnpm sync-ai -->

# Testing y QA

## Estrategia y piramide
- Todo cambio funcional o de logica debe ir acompañado por pruebas adecuadas.
- Orienta la distribucion de tests hacia la piramide: mayoria unit (~70%), integracion (~20%), E2E (~10%). Son proporciones orientativas, no rigidas.
- Mantén el objetivo de cobertura >= 90% en branches, functions, lines y statements.

## Tipos de test y cuando usarlos (alineado con arquitectura hexagonal)

- **Unit tests** (Vitest): tests sobre `domain/` y `application/` **puros**, sin DB, sin HTTP. Los puertos se mockean con objetos in-memory o stubs tipados. Son la mayoria y deben ser rapidos (<100ms por test).
- **Integration tests** (Supertest + Testcontainers): validan la composicion completa: controller + use-case + repo Drizzle contra PostgreSQL real. Usan el global setup de Testcontainers y el `composition-root` en modo test. Verifican contratos HTTP, persistencia, transacciones.
- **E2E tests** (Playwright): flujos criticos de usuario cruzando frontend y backend. Prioriza por riesgo de negocio (login, alta de entidad principal, busqueda), no por cantidad.
- **Load/smoke tests** (k6): valida comportamiento bajo carga esperada. Ejecutar cuando el cambio afecte rendimiento.

### Que probar en cada capa

- `domain/`: entidades, invariantes, value objects, validators puros. Tests 100% unitarios sin mocks (solo tipos).
- `application/use-cases/`: logica de orquestacion. Mock de los puertos del dominio. Cubrir happy path + errores de dominio esperados (NotFound, Conflict, Validation).
- `infrastructure/*.repository.ts`: en integration contra la DB real. Incluir casos de constraints (unique, FK, check).
- `interfaces/` (controllers + routes): integration con Supertest. Cubrir 200/400/401/403/404/409/422 segun aplique.
- Frontend `features/*/services/`: unit con `fetch` mockeado o MSW. Componentes con Testing Library cuando haya logica no trivial.

## Convencion de ubicacion

- Backend: `apps/backend/__tests__/` organizados por tipo: `unit/`, `integration/`, `e2e/`, `setup/`.
- Los tests unitarios de dominio pueden vivir tambien junto al codigo (`<fichero>.test.ts`) si eso mejora la cercania.
- El global setup de Testcontainers esta en `apps/backend/__tests__/setup/testcontainers.global-setup.ts`.
- Frontend: tests junto al fichero o en `__tests__/` de la feature correspondiente.

## Datos de test y aislamiento
- Cada test debe ser independiente: no depender del orden de ejecucion ni del estado dejado por otro test.
- Usa factories o fixtures para generar datos de test; no hardcodees datos magicos dispersos entre tests.
- En tests de integracion, limpia o aisla los datos entre tests para evitar contaminacion cruzada.

## Regresion y mantenimiento
- Los tests existentes son el safety net de regresion. No borres ni deshabilites tests sin justificacion clara.
- Si un test falla por un cambio esperado, actualiza el test para reflejar el nuevo comportamiento, no lo silencios.

## Reglas operativas
- Si un cambio no requiere cierto tipo de prueba, indicalo explicitamente en la respuesta final.
- No cierres una tarea como terminada si no se ha validado, como minimo, lo que razonablemente corresponda entre `lint`, `typecheck`, `test` y `build`.
