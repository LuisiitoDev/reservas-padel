# API Contract: Sistema de Reservas de Canchas de Pádel

**Feature**: `001-court-booking-system` | **Date**: 2026-09-13

API REST JSON servida por el backend Express (`backend/src/api`). Todas las respuestas tienen
`Content-Type: application/json`. Los errores siguen el formato uniforme:

```json
{ "error": { "message": "Mensaje amigable para el usuario final" } }
```

nunca se exponen *stack traces* ni detalles internos (Principio V). Códigos usados en todo el
contrato: `400` petición inválida, `401` no autenticado, `403` prohibido (recurso de otro
usuario), `404` no encontrado, `409` conflicto de reserva/estado.

Autenticación por cookie de sesión `httpOnly` (`express-session`, ver `research.md` §2). El
frontend debe enviar `credentials: 'include'` en cada request. Rutas marcadas 🔒 requieren
sesión activa (Principio III); sin ella responden `401`.

---

## Auth

### `POST /api/auth/registro`

Registra un nuevo usuario e inicia sesión inmediatamente (FR-001).

**Request body**:
```json
{ "email": "jugador@example.com", "password": "minimo8car" }
```

**Responses**:
- `201 Created` → `{ "usuario": { "id": 1, "email": "jugador@example.com" } }` + cookie de
  sesión establecida.
- `400 Bad Request` → email con formato inválido, o `password` con menos de 8 caracteres.
- `409 Conflict` → el email ya está registrado (Acceptance Scenario US1 #5).

### `POST /api/auth/login`

Inicia sesión con credenciales existentes (FR-002).

**Request body**:
```json
{ "email": "jugador@example.com", "password": "minimo8car" }
```

**Responses**:
- `200 OK` → `{ "usuario": { "id": 1, "email": "jugador@example.com" } }` + cookie de sesión.
- `400 Bad Request` → payload inválido/incompleto.
- `401 Unauthorized` → credenciales incorrectas (Acceptance Scenario US1 #3). Mensaje genérico
  ("correo o contraseña incorrectos") que no revela cuál de los dos campos falló.

### `POST /api/auth/logout` 🔒

Cierra la sesión activa (FR-003).

**Responses**:
- `204 No Content` → sesión invalidada, cookie limpiada.

### `GET /api/auth/sesion` 🔒

Consulta quién es el usuario autenticado actual (usado por el frontend al cargar la app para
saber si hay sesión vigente sin forzar login).

**Responses**:
- `200 OK` → `{ "usuario": { "id": 1, "email": "jugador@example.com" } }`.
- `401 Unauthorized` → no hay sesión activa (o expiró por 24h de inactividad).

---

## Canchas

### `GET /api/canchas`

Lista el catálogo fijo de 5 canchas (FR-006). Público (no requiere sesión: el spec solo exige
sesión para ver **disponibilidad completa** y reservar, no para saber que el club existe —
User Story 1, escenario 4).

**Responses**:
- `200 OK` → `{ "canchas": [{ "id": 1, "nombre": "Cancha Laureles" }, ...] }` (5 elementos, en
  orden fijo).

### `GET /api/canchas/:canchaId/disponibilidad?fecha=YYYY-MM-DD` 🔒

Devuelve la grilla de 24 bloques horarios para la cancha y fecha dadas (FR-007, FR-008).

**Responses**:
- `200 OK`:
  ```json
  {
    "canchaId": 1,
    "fecha": "2026-09-20",
    "bloques": [
      { "horaInicio": 0, "estado": "disponible" },
      { "horaInicio": 1, "estado": "reservado" },
      { "horaInicio": 14, "estado": "transcurrido" }
    ]
  }
  ```
  `estado` es uno de `disponible` \| `reservado` \| `transcurrido` (bloque cuya `hora_fin` ya
  pasó, solo posible si `fecha` es hoy; ver Edge Cases del spec). Siempre 24 elementos.
- `400 Bad Request` → `fecha` ausente o con formato inválido.
- `404 Not Found` → `canchaId` no corresponde a ninguna de las 5 canchas.

---

## Reservas

### `POST /api/reservas` 🔒

Crea una reserva sobre un bloque horario completo (FR-009). Revalida disponibilidad y la regla
de "una reserva vigente por usuario" dentro de la misma transacción de base de datos (FR-011,
FR-012, FR-013).

**Request body**:
```json
{ "canchaId": 1, "fecha": "2026-09-20", "horaInicio": 14 }
```

**Responses**:
- `201 Created` → `{ "reserva": { "id": 42, "canchaId": 1, "canchaNombre": "Cancha Laureles", "fecha": "2026-09-20", "horaInicio": 14, "horaFin": 15, "estado": "activa" } }`.
- `400 Bad Request` → payload inválido, `horaInicio` fuera de `0..23`, o `fecha`/bloque ya
  transcurridos respecto al momento actual (FR-010).
- `401 Unauthorized` → sin sesión activa.
- `404 Not Found` → `canchaId` no existe.
- `409 Conflict` → el bloque ya fue tomado por otro usuario entre la consulta y la confirmación
  (Acceptance Scenario US2 #4, #3 — mensaje distingue "bloque ya no disponible" de "ya tienes
  una reserva activa" para cumplir FR-020, aunque el código HTTP sea el mismo):
  ```json
  { "error": { "message": "Ese horario ya no está disponible." } }
  ```
  o
  ```json
  { "error": { "message": "Ya tienes una reserva activa. Cancélala o espera a que finalice para crear otra." } }
  ```

### `GET /api/reservas/mias?ambito=futuras|pasadas` 🔒

Lista las reservas del usuario autenticado, separadas por ámbito (FR-014, FR-015). Nunca
expone reservas de otros usuarios (FR-005, Acceptance Scenario US3 #5) — el filtro por
`usuario_id` de la sesión es implícito y no puede sobreescribirse desde el cliente.

- `ambito=futuras` → reservas con `estado = 'activa'` y no transcurridas (incluye la que está
  en curso ahora mismo).
- `ambito=pasadas` → reservas con `estado = 'activa'` ya transcurridas, **y** reservas
  `estado = 'cancelada'` (ambas aparecen en el historial; ver `data-model.md`).

**Responses**:
- `200 OK`:
  ```json
  {
    "reservas": [
      {
        "id": 42, "canchaId": 1, "canchaNombre": "Cancha Laureles",
        "fecha": "2026-09-20", "horaInicio": 14, "horaFin": 15,
        "estado": "activa", "cancelable": true
      }
    ]
  }
  ```
  `cancelable` es `true` únicamente cuando `ambito=futuras` (nunca en `pasadas`, cumpliendo
  Acceptance Scenarios US3 #3 y #6).
- `400 Bad Request` → `ambito` ausente o con valor distinto de `futuras`/`pasadas`.

### `DELETE /api/reservas/:reservaId` 🔒

Cancela una reserva futura propia, previa confirmación explícita en el frontend (FR-016,
FR-017, FR-018).

**Responses**:
- `204 No Content` → reserva marcada `cancelada`; el bloque queda libre de inmediato.
- `401 Unauthorized` → sin sesión activa.
- `403 Forbidden` → la reserva existe pero pertenece a otro usuario (Edge Case del spec: nunca
  se revela con un `404` para no filtrar existencia, se responde `403` de forma consistente
  cuando el usuario autenticado no es el dueño).
- `404 Not Found` → `reservaId` no existe.
- `409 Conflict` → la reserva ya está cancelada o ya pasó (FR-018):
  ```json
  { "error": { "message": "Esta reserva ya no se puede cancelar." } }
  ```
