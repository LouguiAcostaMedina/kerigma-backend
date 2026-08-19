# Backend - Sistema de Gestión Misionera (SGM)

API REST del SGM en **TypeScript estricto**. Stack: Express 4, Sequelize 6 + PostgreSQL, Redis (caché opcional),
Zod (validación), Vitest (tests).

> La versión heredada en JavaScript (`app.js`, `models/*.js`, `routes/*.js`, etc.) fue eliminada.
> Todo el código activo vive en `src/`.

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- Redis (opcional; sin `REDIS_URL` se usa caché en memoria)

## Configuración

1. Crear `backend/.env` con las variables necesarias. La única **obligatoria** es `JWT_SECRET`
   (`src/config/env.ts` lanza error si falta). Las principales:

   | Variable | Obligatoria | Default |
   |----------|-------------|---------|
   | `JWT_SECRET` | sí | — |
   | `DATABASE_URL` | no | `postgres://user:pass@localhost:5432/mission_system_db` (o `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) |
   | `REDIS_URL` | no | sin Redis usa caché en memoria |
   | `PORT` | no | `3000` |
   | `API_BASE_PATH` / `API_VERSION` | no | `/api` / `v1` |
   | `FRONTEND_URL` / `ALLOWED_ORIGINS` | no | `http://localhost:5173` |
   | `ADMIN_EMAIL` (para `create-admin`) | no | `admin@sistema-misionero.com` |

   > No existe `.env.example` versionado; `.env` no se sube al repo (ver `.gitignore`).

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Migraciones y seed:

   ```bash
   npm run migrate
   npm run seed
   # o reseteo completo: npm run db:reset
   ```

4. Crear usuario administrador:

   ```bash
   npm run create-admin
   ```

## Comandos

| Comando                  | Descripción                                             |
|--------------------------|---------------------------------------------------------|
| `npm run dev`            | Desarrollo con nodemon + ts-node                        |
| `npm start`              | Producción (node `dist/server.js`)                      |
| `npm run build`          | `tsc -p tsconfig.json` -> `dist/`                       |
| `npm run typecheck`      | `tsc --noEmit` (solo `src/`)                            |
| `npm run typecheck:test` | `tsc -p tsconfig.test.json --noEmit` (src + tests)      |
| `npm test`               | `vitest run` (unit + integración)                       |
| `npm run test:coverage`  | Cobertura con v8 sobre `src/**/*.ts`                    |
| `npm run migrate`        | `sequelize-cli db:migrate`                              |
| `npm run seed`           | `sequelize-cli db:seed:all`                             |
| `npm run db:reset`       | `migrate:undo` + `migrate` + `seed`                     |

## Estructura

```
src/
├── app.ts               # Configuración Express (helmet, sanitize, rutas, errores)
├── server.ts            # Bootstrap del servidor
├── config/
│   ├── database.ts      # Conexión Sequelize + testConnection
│   └── env.ts           # Variables de entorno validadas
├── constants/           # Constantes (caché, lecciones)
├── controllers/         # Controladores async (auth, dashboard, metric, group, ...)
├── middlewares/
│   ├── auth.middleware.ts   # requireAuth (cookie HttpOnly)
│   ├── validate.middleware.ts
│   ├── sanitize.middleware.ts
│   ├── scopeByChurch.ts     # Aislamiento por iglesia (test oficial)
│   └── error.middleware.ts
├── models/              # Modelos Sequelize (index.ts exporta `db`)
├── routes/              # Routers Express (controladores envueltos con asyncHandler)
├── schemas/             # Esquemas Zod (z.infer -> tipos)
├── services/            # Lógica de negocio (metric, attendance, goal, auth, ...)
├── types/               # Tipos compartidos
├── utils/               # apiResponse, errors, asyncHandler, jwt, logger, dashboardMath, lessonProgress
└── scripts/             # Scripts (create-admin)
```

## Arquitectura

```
routes -> middlewares -> controllers (async) -> services -> models (Sequelize)
```

- Validación de entrada: Zod en `schemas/`.
- Respuestas: envelope unificado `ok()` / `fail()` (`utils/apiResponse.ts`).
- Errores de negocio: clases de `utils/errors.ts`.
- Controladores async siempre envueltos con `asyncHandler`.

## Testing

- `tests/unit/` — lógica pura y servicios con modelos mockeados (sin BD real).
- `tests/integration/` — app Express con modelos mockeados o sin consultas.
- `tests/setup.ts` — sube límites de rate-limit y define `JWT_SECRET` de respaldo.

```bash
npm test
npm run test:coverage
```

Servicios cubiertos al 100% (líneas/funciones): `metric.service`, `attendance.service`, `goal.service`.

### Smoke Test (endpoints contra BD real)

Verifica que cada endpoint principal devuelve una respuesta válida (no 500) haciendo login real y consultando cada feature.

```bash
# Con defaults (localhost:5000, admin@misionero.com)
node scripts/smoke-test.js

# Con variables personalizadas
BASE_URL=https://your-api.com SMOKE_USER=admin@misionero.com SMOKE_PASS=secret node scripts/smoke-test.js
```

El script: (1) hace login, (2) envía GET a 23 endpoints principales, (3) reporta OK/FAIL por endpoint, (4) exit code 1 si algún endpoint devuelve 5xx.

## Documentación

- `REGLAS.md` — reglas de codificación del backend.
- `APIDOCUMENTATION.md` — endpoints, autenticación, envelope y rate limits.
- `AGENTS.md` — contexto para agentes de IA.
