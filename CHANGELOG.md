# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
Las fechas usan el formato YYYY-MM-DD.

## [Unreleased]

### Iniciativa de modernización — inicio (2026-08-09)

Arranca la iniciativa de modernización, endurecimiento y escalado del sistema. Esta rama
(`chore/baseline`) fija el punto de partida sobre el estado real del código.

#### Fase 1 — Correcciones críticas (en curso)

- **Se eliminaron los servicios huérfanos `src/services/goal.service.ts` y
  `src/services/metric.service.ts` junto con sus tests** (`tests/unit/goal.service.test.ts`,
  `tests/unit/metric.service.test.ts`). Ya no quedaban consumidores: sus controladores y rutas
  (`goal.controller.ts`, `metric.controller.ts`, `goal.routes.ts`, `metric.routes.ts`) se habían
  retirado en el sprint anterior y nadie más importaba estos servicios. Los modelos
  (`QuarterlyGoal`, `WeeklyMetric`) y `dashboard.service.ts` **se conservan**: el dashboard sigue
  leyéndolos directamente. *Breadcrumb para Fase 4:* cuando se construya la feature real de metas
  trimestrales y métricas semanales, estos servicios (y sus tests) se regenerarán desde cero,
  probablemente con una API distinta y siempre conectados a un controlador/ruta real.

#### Fase 0 — Preparación (completada)

- **Baseline**: se commitea el estado real del working tree en la rama `chore/baseline`
  (incluye la migración completa a TypeScript en `src/` y la eliminación del JS legacy).
- **Suite de pruebas (foto inicial)**: `npm run typecheck`, `npm run typecheck:test` y
  `npm test` en verde — **10 archivos / 100 tests pasan**. `npm run build` sin errores.
- **Entorno**: `.env` verificado contra `src/config/env.ts` — todas las variables requeridas
  presentes (`JWT_SECRET`) y las opcionales declaradas o con default. No se versiona el `.env`.
- **CI**: se agrega `.github/workflows/ci.yml` (typecheck + typecheck:test + test + build) que
  corre en cada PR y push a `main`.
- **`.gitignore`**: ahora se versiona `package-lock.json` (el CI usa `npm ci`, que lo exige).
