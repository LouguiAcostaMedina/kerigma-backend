# AGENTS.md - Backend SGM

Guía de contexto para agentes de IA y desarrolladores que trabajen en `backend/`.

## Contexto

- API REST en TypeScript estricto (Express 4, Sequelize 6 + PostgreSQL, Redis opcional).
- Todo el código activo vive en `src/`. No existe versión heredada en JavaScript.
- `models/index.ts` construye y exporta el objeto `db` con todos los modelos asociados.

## Comandos (ejecutar en `backend/`)

```bash
npm run build           # tsc -p tsconfig.json -> dist/
npm run typecheck       # tsc --noEmit (solo src)
npm run typecheck:test  # tsc -p tsconfig.test.json --noEmit (src + tests)
npm test                # vitest run
npm run test:coverage   # vitest run --coverage (v8)
npm run migrate         # sequelize-cli db:migrate
npm run seed            # sequelize-cli db:seed:all
npm run db:reset        # migrate:undo + migrate + seed
npm run create-admin    # crear usuario admin
npm run dev             # nodemon + ts-node
npm start               # node dist/server.js
```

## Reglas de oro

1. **Prohibido `any`** y `as unknown as X` innecesarios. `typecheck` y `typecheck:test` deben pasar.
2. Las respuestas usan el sobre `ok()` / `fail()` de `src/utils/apiResponse.ts`.
3. Todo input externo se valida con Zod (`src/schemas/`).
4. Errores de negocio con las clases de `src/utils/errors.ts`.
5. Los controladores async se registran SIEMPRE con `asyncHandler` (`src/utils/asyncHandler.ts`).
6. Tests nuevos en `tests/` (`unit/` o `integration/`). Las suites locales deben pasar antes de un PR.

## Patrones de mocks en tests

- `vi.mock('../../src/models')` expone un objeto `db` con los modelos que el servicio usa
  (ver `tests/unit/metric.service.test.ts`, `attendance.service.test.ts`, `goal.service.test.ts`).
- `vi.mock('../../src/services/redis.service')` para aislar `invalidateDashboardCache`.
- Los tests de integración nunca tocan la base de datos real (`tests/setup.ts` configura
  límites de rate-limit y `JWT_SECRET` de respaldo).

## Documentación

- `REGLAS.md` — reglas de codificación.
- `APIDOCUMENTATION.md` — endpoints, autenticación, envelope y rate limits.
- `README.md` — estructura, configuración y comandos.
