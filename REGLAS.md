# REGLAS.md - Reglas de Codificación del Backend (SGM)

Reglas obligatorias para el código nuevo y las modificaciones en `backend/`.
El CI verifica `typecheck`, `typecheck:test` y `npm test` antes de aceptar un PR.

## Arquitectura

1. Capas: `routes` -> `middlewares` -> `controllers` (async) -> `services` -> `models` (Sequelize).
2. Lógica de negocio computacional (sin I/O) se extrae a `utils/` como funciones puras y se testea
   en `tests/unit/` (ej.: `dashboardMath.ts`, `lessonProgress.ts`).
3. Solo existe la versión TypeScript en `src/`. No reintroducir código JS legacy.

## TypeScript

4. `tsconfig.json` es estricto. **Prohibido `any`**; usar tipos derivados de Zod
   (`z.infer<typeof schema>`) y tipos de Sequelize. Prohibido `as unknown as X` innecesario.
5. `npm run typecheck` y `npm run typecheck:test` deben pasar sin errores.
6. Importar solo lo necesario.

## Respuestas y errores

7. Todas las respuestas usan `ok()` / `fail()` de `src/utils/apiResponse.ts`
   (envelope `{ ok, data }` / `{ ok, error: { code, message } }`).
8. Errores de negocio con las clases de `src/utils/errors.ts`: `NotFoundError`,
   `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `ValidationError`,
   `TooManyRequestsError`, `BadRequestError`. Nunca responder `500` con el detalle interno.

## Input y validación

9. Todo input externo (body, query, params, cookies) se valida con Zod en `src/schemas/`.
   Body con `validate(schema)`, query con `validateQuery(schema)`.
10. `sanitizeRequest` (middleware global) elimina caracteres de control y hace `trim` en
    body/query/params. No duplicar esa sanitización en cada controlador.

## Rutas y controladores

11. Los controladores son async y **siempre** se registran con `asyncHandler`
    (`src/utils/asyncHandler.ts`). No registrar controladores async "pelados" en Express 4.
12. Autenticación por cookie HttpOnly con `requireAuth` (`middlewares/auth.middleware.ts`).
    El alcance por iglesia se verifica dentro de cada controller/servicio (403 si no coincide).
13. Rate limits: `express-rate-limit` en login/signup y check-in público (30/min). No reducirlos.

## Seguridad (OWASP)

14. Headers: `helmet()` estricto en `app.ts` (CSP `default-src 'self'`, `frame-ancestors 'none'`,
    HSTS solo en producción). No relajar CSP sin justificación documentada.
15. Cookies con `httpOnly`, `sameSite: 'lax'`, `secure` en producción. No exponer tokens en body.
16. No introducir XSS: nada de HTML inline generado en el servidor; los assets de la página
    check-in viven en `public/` (estáticos) y el HTML pasa datos por atributos `data-*`.
17. No escribir secretos en código ni en el repo. `.env` no se versiona.

## Tests

18. Tests en `tests/`: `unit/` (lógica pura y servicios con mocks) e `integration/`
    (app Express con modelos mockeados o sin consultas a la BD real).
19. Los tests de integración nunca tocan la base de datos real. `tests/setup.ts` sube los límites
    de rate-limit y define `JWT_SECRET` de respaldo para CI.
20. `npm test` y `npm run test:coverage` deben pasar antes de abrir un PR.
