# APIDOCUMENTATION.md - API del Backend (SGM)

Documentación de referencia del backend `backend/src/`. La fuente de verdad de las rutas es
`backend/src/routes/`.

## Base URL

Todas las rutas (excepto `/health`) cuelgan de `{API_BASE_PATH}/{API_VERSION}`.
Con la configuración actual:

```
http://localhost:5000/api/v1
```

- `API_BASE_PATH` y `API_VERSION` se definen en `backend/.env` (`env.apiBasePath` / `env.apiVersion` en `src/config/env.ts`).
- El frontend apunta a esta base con `VITE_API_URL` (`iglesia-frontend/.env`), ej. `/api/v1`.

## Autenticación

- Sesión por **cookies HttpOnly** (`SameSite=Lax`, `Secure` en producción) + token de refresco.
- Los endpoints protegidos requieren la cookie de sesión (no se envía token por header).
- Alcance por iglesia: `requireAuth` + chequeo de iglesia en cada recurso (403 si no coincide).

## Envelope de respuesta

- Éxito (200/201): `{ "ok": true, "data": ... }`
- Error: `{ "ok": false, "error": { "code": "CODIGO", "message": "mensaje" } }`

## Códigos de error comunes

| HTTP | Código            | Significado                                   |
|------|-------------------|-----------------------------------------------|
| 400  | `BAD_REQUEST`     | Solicitud mal formada                         |
| 401  | `UNAUTHORIZED`    | No autenticado o token inválido               |
| 401  | `INVALID_TOKEN`   | Token de refresco/sesión inválido o expirado  |
| 403  | `FORBIDDEN`       | Sin permisos o iglesia no coincide            |
| 404  | `NOT_FOUND`       | Recurso no existe                             |
| 409  | `CONFLICT`        | Conflicto de datos (ej.: métrica ya registrada) |
| 422  | `VALIDATION_ERROR`| Fallo de validación Zod (detalle en `details`)|
| 429  | `TOO_MANY_REQUESTS` | Rate limit excedido                         |
| 500  | `INTERNAL_ERROR`  | Error interno (sin detalle interno)           |

## Rate limits

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `POST /auth/login` | 10 / IP | 15 min |
| `POST /auth/signup` | 5 / IP | 15 min |
| `POST /attendance/checkin/:groupId` (público) | 30 / IP | 1 min |

Headers `RateLimit-*` activados (`standardHeaders: true`).

## Endpoints

### Health

`GET /health`
```
200 { "status": "ok", "timestamp": "..." }
```

### Auth

| Método | Ruta                  | Protegido | Descripción |
|--------|-----------------------|-----------|-------------|
| POST   | `/auth/login`         | no        | Inicia sesión y emite cookies |
| POST   | `/auth/signup`        | no        | Registro; usuario queda pendiente de aprobación |
| POST   | `/auth/refresh`       | no        | Rota la sesión con el refresh token |
| POST   | `/auth/logout`        | no        | Limpia cookies |
| GET    | `/auth/me`            | sí        | Usuario autenticado actual |

`POST /auth/login` body:
```json
{ "email": "admin@iglesia.com", "password": "..." }
```
Éxito (200): `data` incluye el usuario y se emiten `accessToken`/`refreshToken` como cookies HttpOnly.

`POST /auth/signup` body:
```json
{
  "email": "usuario@correo.com",
  "password": "Mayuscula1",
  "firstName": "Nombre",
  "lastName": "Apellido",
  "phone": "5551234567",
  "churchId": "uuid-optativo"
}
```
Reglas de contraseña: mín. 8 caracteres, al menos una mayúscula, una minúscula y un número.

### Dashboard

| Método | Ruta                              | Protegido | Descripción |
|--------|-----------------------------------|-----------|-------------|
| GET    | `/dashboard/spiritual-health`     | sí        | Salud espiritual por grupo (3 pilares) |
| GET    | `/dashboard/kpis`                 | sí        | KPIs del dashboard (asistencia, crecimiento, metas) |

### Grupos

| Método | Ruta                                | Protegido | Descripción |
|--------|-------------------------------------|-----------|-------------|
| GET    | `/groups`                           | sí        | Lista grupos de la iglesia |
| POST   | `/groups`                           | sí        | Crear grupo |
| GET    | `/groups/:id`                       | sí        | Detalle de grupo |
| PUT    | `/groups/:id`                       | sí        | Actualizar grupo |
| POST   | `/groups/:id/assign-teachers`       | sí        | Asignar maestros |
| GET    | `/groups/:id/disciple-pairs`        | sí        | Listar pares de discipulado |
| POST   | `/groups/:id/disciple-pairs`        | sí        | Crear par de discipulado |

### Estudiantes

| Método | Ruta                            | Protegido | Descripción |
|--------|---------------------------------|-----------|-------------|
| POST   | `/students`                     | sí        | Crear estudiante bíblico |
| GET    | `/students/group/:groupId`      | sí        | Estudiantes de un grupo |
| GET    | `/students/:id`                 | sí        | Detalle de estudiante |
| PUT    | `/students/:id`                 | sí        | Actualizar estudiante |
| PUT    | `/students/:id/lessons`         | sí        | Actualizar progreso de lecciones (1-20) |

Progreso de lecciones: 1 a 20; el avance se resume por porcentaje.
Graduación elegible al completar el 80% (16/20).

### Métricas

| Método | Ruta                                 | Protegido | Descripción |
|--------|--------------------------------------|-----------|-------------|
| POST   | `/metrics/weekly`                    | sí        | Registrar métrica semanal |
| GET    | `/metrics/weekly`                    | sí        | Métricas semanales de la iglesia (query: `from`, `to`, `groupId`) |
| GET    | `/metrics/weekly/group/:groupId`     | sí        | Métricas semanales de un grupo (query: `quarterId`) |

`POST /metrics/weekly` valida con `createWeeklyMetricSchema` (`src/schemas/metric.schema.ts`).
Si ya existe una métrica para la misma semana/grupo responde `409 CONFLICT`.

### Asistencia

| Método | Ruta                                    | Protegido | Descripción |
|--------|-----------------------------------------|-----------|-------------|
| POST   | `/attendance/bulk`                      | sí        | Registrar asistencia masiva |
| GET    | `/attendance/group/:groupId`            | sí        | Asistencia de un grupo (query: `meetingDate`, `meetingType`) |
| GET    | `/attendance/checkin/:groupId`          | no        | Página HTML pública de check-in (QR) |
| POST   | `/attendance/checkin/:groupId`          | no        | Check-in público desde la página |

`POST /attendance/checkin/:groupId` body:
```json
{ "memberId": "uuid-del-miembro" }
```
Respuesta 200 al registrar asistencia; 429 si la IP excede 30 check-ins/min.

### Metas

| Método | Ruta                                        | Protegido | Descripción |
|--------|---------------------------------------------|-----------|-------------|
| POST   | `/goals/quarterly`                          | sí        | Crear meta trimestral |
| PUT    | `/goals/quarterly/:id/close`                | sí        | Cerrar meta trimestral |
| GET    | `/goals/quarterly/group/:groupId`           | sí        | Metas de un grupo (query: `quarterId`) |
| GET    | `/goals/quarterly/quarter/:quarterId`       | sí        | Metas por trimestre |

## Estructura relevante

```
backend/src/
  routes/         # Definición de rutas + middlewares
  controllers/    # Lógica de endpoint (async, envueltos en asyncHandler)
  services/       # Lógica de negocio y acceso a datos
  schemas/        # Esquemas Zod (input)
  middlewares/    # auth, validate, sanitize, error
  utils/          # ok/fail, errors, asyncHandler, dashboardMath, logger
  models/         # Modelos Sequelize (index.ts exporta `db`)
  public/         # Assets estáticos (página check-in)
```
