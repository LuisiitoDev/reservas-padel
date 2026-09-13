---

description: "Task list template for feature implementation"
---

# Tasks: Sistema de Reservas de Canchas de Pádel

**Input**: Design documents from `/specs/001-court-booking-system/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Incluidos. `plan.md` (Testing) y `research.md` §4 comprometen `vitest`/`supertest` como
estrategia de verificación, y el Principio II (NON-NEGOTIABLE, prevención de colisiones) exige un
test automatizado de concurrencia — no es opcional para esta feature.

**Organization**: Las tareas están agrupadas por historia de usuario (US1, US2, US3) para permitir
implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: A qué historia de usuario pertenece la tarea (US1, US2, US3)
- Se incluyen rutas de archivo exactas en cada descripción

## Path Conventions

Estructura fijada por `plan.md` (Web application, Opción 2): `backend/`, `frontend/`, `db/` en la
raíz del repositorio (sin carpeta `/shared`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto y estructura base

- [X] T001 Crear estructura de carpetas per plan.md: `backend/src/{models,services,api,api/routes,api/middleware}`, `backend/tests/{contract,unit}`, `frontend/src/{components,pages,services}`, `frontend/tests`, `db/`
- [X] T002 Inicializar proyecto backend en `backend/` (`package.json`, `tsconfig.json`) con dependencias: `express`, `better-sqlite3`, `bcrypt`, `express-session`, `connect-sqlite3` (o `better-sqlite3-session-store`), `date-fns`, `zod`, y devDependencies `typescript`, `vitest`, `supertest`, `@types/*`
- [X] T003 [P] Inicializar proyecto frontend en `frontend/` (Vite + React 18 + TypeScript) con `react-router-dom`, `tailwindcss`, `date-fns`, y devDependencies `vitest`, `@testing-library/react`
- [X] T004 [P] Configurar ESLint + Prettier compartidos para `backend/` y `frontend/` (estilo funcional, sin clases salvo obligación externa — Principio IV)
- [X] T005 [P] Crear `db/schema.sql` con DDL de `usuarios`, `canchas`, `reservas` según `data-model.md`: incluir `CREATE UNIQUE INDEX ux_reserva_bloque ON reservas(cancha_id, fecha, hora_inicio) WHERE estado = 'activa'`
- [X] T006 [P] Crear `db/seed.sql` con el catálogo fijo de 5 canchas (FR-006): `Cancha Laureles`, `Cancha El Poblado`, `Cancha Belén`, `Cancha Robledo`, `Cancha Envigado`, en ese orden con `id` 1..5
- [X] T007 Crear scripts npm `db:setup` (aplica `db/schema.sql` + `db/seed.sql` sobre `db/padel.db`) y `db:reset` (borra y recrea) en `backend/package.json`, usados por `quickstart.md`

**Checkpoint**: Estructura y bases de datos listas antes de la fase Foundational

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura común que TODAS las historias de usuario necesitan

**⚠️ CRITICAL**: Ninguna historia de usuario puede empezar hasta que esta fase esté completa

- [X] T008 Implementar módulo de conexión `better-sqlite3` (abre `db/padel.db`, habilita `pragma foreign_keys = ON`) en `backend/src/models/db.ts`
- [X] T009 [P] Implementar modelo Usuario (`crear(email, passwordHash)`, `buscarPorEmail(email)`, `buscarPorId(id)`; `email` normalizado a minúsculas per `data-model.md`) en `backend/src/models/usuarioModel.ts`
- [X] T010 [P] Implementar modelo Cancha (`listarTodas()` en orden fijo de `id`) en `backend/src/models/canchaModel.ts`
- [X] T011 [P] Implementar modelo Reserva (`insertar(...)` capturando violación de `ux_reserva_bloque`, `buscarActivaPorUsuario(usuarioId, ahora)`, `buscarPorCanchaYFecha(canchaId, fecha)`, `buscarPorId(id)`, `listarPorUsuario(usuarioId, ambito)`, `cancelar(id)`) en `backend/src/models/reservaModel.ts`
- [X] T012 Configurar middleware `express-session` con store SQLite (`db/padel.db`), cookie `httpOnly`, `sameSite=lax`, `rolling: true`, `maxAge = 24h` (FR-003, expiración por inactividad) en `backend/src/api/session.ts`
- [X] T013 [P] Implementar middleware `requireAuth` (responde `401` si no hay `req.session.usuarioId`, Principio III) en `backend/src/api/middleware/requireAuth.ts`
- [X] T014 [P] Implementar middleware central de manejo de errores (traduce errores de dominio/BD a `400/401/403/404/409` + `{ "error": { "message": ... } }` amigable, nunca stack traces — Principio V) en `backend/src/api/middleware/errorHandler.ts`
- [X] T015 Ensamblar la app Express (monta middleware de sesión, routers, `errorHandler`; sin side effect de `listen`) en `backend/src/app.ts`
- [X] T016 Crear punto de entrada del backend (`app.listen`) en `backend/server.ts`
- [X] T017 [P] Configurar esqueleto de rutas del frontend (React Router: `/`, `/registro`, `/login`, `/disponibilidad`, `/mis-reservas`) en `frontend/src/main.tsx` y `frontend/src/App.tsx`
- [X] T018 [P] Implementar cliente API base (`fetch` con `credentials: 'include'`, parseo JSON, propagación de `{ error: { message } }`) en `frontend/src/services/apiClient.ts`
- [X] T019 [P] Implementar contexto/hook de sesión de autenticación (estado de usuario actual, carga inicial vía `GET /api/auth/sesion`) en `frontend/src/services/authContext.tsx`

**Checkpoint**: Fundamento listo — las historias de usuario pueden implementarse

---

## Phase 3: User Story 1 - Registro e inicio de sesión (Priority: P1) 🎯 MVP

**Goal**: Un visitante se registra con correo/contraseña, inicia sesión, cierra sesión, y sin
sesión activa queda bloqueado de disponibilidad/reservas.

**Independent Test**: Registrar una cuenta nueva, cerrar sesión, iniciar sesión de nuevo con esas
credenciales, y verificar que un usuario sin sesión activa es bloqueado al intentar acceder a la
disponibilidad o crear una reserva.

### Tests for User Story 1 ⚠️

> Escribir estos tests primero y verificar que fallan antes de implementar

- [X] T020 [P] [US1] Contract test `POST /api/auth/registro` (201 + sesión creada; 409 email duplicado; 400 password < 8 caracteres o email inválido) en `backend/tests/contract/auth.registro.test.ts`
- [X] T021 [P] [US1] Contract test `POST /api/auth/login` (200 + sesión; 401 con mensaje genérico "correo o contraseña incorrectos" que no revela cuál campo falló; 400 payload incompleto) en `backend/tests/contract/auth.login.test.ts`
- [X] T022 [P] [US1] Contract test `POST /api/auth/logout` y `GET /api/auth/sesion` (sesión establecida tras registro/login, `204` en logout, `401` en `/sesion` sin sesión o tras logout) en `backend/tests/contract/auth.session.test.ts`
- [X] T023 [P] [US1] Contract test de guardas de autenticación: `GET /api/canchas/:canchaId/disponibilidad` y `POST /api/reservas` responden `401` sin sesión activa (FR-004) en `backend/tests/contract/auth.guard.test.ts`

### Implementation for User Story 1

- [X] T024 [US1] Implementar validación de entrada con `zod`: `email` con formato válido, `password` con longitud mínima de 8 caracteres (FR-001, sin reglas adicionales de complejidad) en `backend/src/services/validation/authValidation.ts`
- [X] T025 [US1] Implementar `AuthService`: `registrar` (hash `bcrypt` costo 10-12, email normalizado a minúsculas, `409` si ya existe — FR-021, FR-001), `login` (comparación `bcrypt`, `401` genérico — FR-002), `logout` en `backend/src/services/authService.ts`
- [X] T026 [US1] Implementar rutas de auth (`POST /registro`, `POST /login`, `POST /logout` 🔒, `GET /sesion` 🔒) montadas en `/api/auth` en `backend/src/api/routes/authRoutes.ts`
- [X] T027 [P] [US1] Construir `RegistroPage` (formulario email+password, aviso de mínimo 8 caracteres, envía a `authApi.registrar`, muestra error de email duplicado) en `frontend/src/pages/RegistroPage.tsx`
- [X] T028 [P] [US1] Construir `LoginPage` (formulario email+password, muestra mensaje genérico de error en `401`) en `frontend/src/pages/LoginPage.tsx`
- [X] T029 [US1] Implementar `authApi` (`registrar`, `login`, `logout`, `sesion`) en `frontend/src/services/authApi.ts`
- [X] T030 [US1] Implementar componente `RequireAuth` (redirige a `/login` si no hay sesión activa; protege rutas de disponibilidad y mis-reservas — FR-004) en `frontend/src/components/RequireAuth.tsx`
- [X] T031 [US1] Construir `HomePage` pública (muestra que el club existe, sin exponer grilla de disponibilidad ni permitir reservar a visitantes sin sesión) en `frontend/src/pages/HomePage.tsx`

**Checkpoint**: User Story 1 completamente funcional y probable de forma independiente

---

## Phase 4: User Story 2 - Explorar disponibilidad y crear una reserva (Priority: P2)

**Goal**: Un usuario autenticado elige cancha y fecha, ve la grilla de 24 bloques, y confirma una
reserva sobre un bloque disponible con prevención estricta de colisiones concurrentes.

**Independent Test**: Con un usuario autenticado, seleccionar una cancha, una fecha futura y un
bloque disponible, confirmar la reserva, y verificar que ese bloque pasa a "Reservado" para esa
cancha y fecha.

### Tests for User Story 2 ⚠️

- [X] T032 [P] [US2] Contract test `GET /api/canchas` (200, público sin sesión, exactamente 5 canchas en orden fijo — FR-006) en `backend/tests/contract/canchas.list.test.ts`
- [X] T033 [P] [US2] Contract test `GET /api/canchas/:canchaId/disponibilidad` (siempre 24 bloques con estado `disponible`/`reservado`/`transcurrido`; `400` fecha ausente/inválida; `404` cancha inexistente — FR-007, FR-008) en `backend/tests/contract/canchas.disponibilidad.test.ts`
- [X] T034 [P] [US2] Contract test `POST /api/reservas` camino feliz (`201`, y la disponibilidad subsiguiente marca ese bloque como `reservado` — FR-009) en `backend/tests/contract/reservas.create.test.ts`
- [X] T035 [US2] Contract test de rechazos de `POST /api/reservas`: fecha/hora ya transcurrida (`400`, FR-010), usuario con reserva activa existente (`409` "Ya tienes una reserva activa..." — FR-013), `canchaId` inexistente (`404`) en `backend/tests/contract/reservas.create.rejections.test.ts`
- [X] T036 [US2] Test de concurrencia (Principio II, NON-NEGOTIABLE): disparar dos `POST /api/reservas` casi simultáneos de usuarios distintos sobre el mismo bloque/cancha/fecha y verificar que exactamente uno recibe `201` y el otro `409` "Ese horario ya no está disponible." (FR-011, FR-012) en `backend/tests/contract/reservas.concurrency.test.ts`

### Implementation for User Story 2

- [X] T037 [US2] Implementar `CanchaService.listar()` (orden fijo de las 5 canchas) en `backend/src/services/canchaService.ts`
- [X] T038 [US2] Implementar `DisponibilidadService.obtenerGrilla(canchaId, fecha)`: construye los 24 bloques, deriva `disponible`/`reservado`/`transcurrido` comparando con la hora actual del servidor vía `date-fns` (bloque `transcurrido` solo posible si `fecha` es hoy) en `backend/src/services/disponibilidadService.ts`
- [X] T039 [US2] Implementar `ReservaService.crear(usuarioId, canchaId, fecha, horaInicio)`: valida `horaInicio` en `0..23` y que `fecha`+bloque no haya transcurrido (FR-010); dentro de una única transacción, verifica que el usuario no tenga una reserva vigente (`fecha+hora_fin` no transcurrida, FR-013) y ejecuta el `INSERT` confiando en `ux_reserva_bloque`; captura la violación de restricción única y distingue el mensaje `409` de colisión de bloque del de reserva activa existente (FR-011, FR-012, FR-020) en `backend/src/services/reservaService.ts`
- [X] T040 [US2] Implementar rutas de canchas (`GET /api/canchas` público, `GET /api/canchas/:canchaId/disponibilidad` 🔒) en `backend/src/api/routes/canchaRoutes.ts`
- [X] T041 [US2] Implementar ruta `POST /api/reservas` 🔒 conectada a `ReservaService.crear` en `backend/src/api/routes/reservaRoutes.ts`
- [X] T042 [P] [US2] Implementar `canchasApi` (`listar`, `disponibilidad(canchaId, fecha)`) en `frontend/src/services/canchasApi.ts`
- [X] T043 [P] [US2] Implementar `reservasApi.crear(canchaId, fecha, horaInicio)` en `frontend/src/services/reservasApi.ts`
- [X] T044 [P] [US2] Construir `CanchaSelector` (selector de las 5 canchas + selector de fecha en calendario sin límite máximo de anticipación — FR-019) en `frontend/src/components/CanchaSelector.tsx`
- [X] T045 [US2] Construir `GrillaDisponibilidad` (24 bloques con estado visual `disponible`/`reservado`/`transcurrido`; solo bloques completos de una hora son seleccionables — FR-009) en `frontend/src/components/GrillaDisponibilidad.tsx`
- [X] T046 [US2] Construir `DisponibilidadPage` combinando `CanchaSelector` + `GrillaDisponibilidad` + confirmación de reserva, mostrando el mensaje específico según el tipo de `409` (colisión de bloque vs. reserva activa existente — FR-020) en `frontend/src/pages/DisponibilidadPage.tsx`

**Checkpoint**: User Stories 1 y 2 funcionan de forma independiente

---

## Phase 5: User Story 3 - Gestionar mis reservas (Priority: P3)

**Goal**: Un usuario autenticado consulta sus reservas futuras/pasadas y puede cancelar una
reserva futura con confirmación explícita.

**Independent Test**: Con un usuario que ya tiene una reserva futura, abrir "Mis reservas",
verificar que aparece con cancha/fecha/hora, cancelarla, y confirmar que el bloque vuelve a
"Disponible" en la grilla.

### Tests for User Story 3 ⚠️

- [X] T047 [P] [US3] Contract test `GET /api/reservas/mias?ambito=futuras|pasadas` (separa activas vigentes de pasadas+canceladas, `cancelable` solo `true` en `futuras`, `400` con `ambito` inválido, nunca expone reservas de otro usuario — FR-014, FR-015, FR-005) en `backend/tests/contract/reservas.mias.test.ts`
- [X] T048 [P] [US3] Contract test `DELETE /api/reservas/:reservaId` (`204` + bloque liberado inmediatamente, `403` reserva de otro usuario, `404` inexistente, `409` ya cancelada o ya pasada — FR-016, FR-017, FR-018) en `backend/tests/contract/reservas.cancel.test.ts`

### Implementation for User Story 3

- [X] T049 [US3] Extender `ReservaService` con `listarMias(usuarioId, ambito)`: deriva `futura/activa` (vigente) vs `pasada` a partir de `estado='activa'` y `fecha+hora_fin` frente a "ahora" (`ambito=pasadas` incluye además `estado='cancelada'`), per `data-model.md` en `backend/src/services/reservaService.ts`
- [X] T050 [US3] Extender `ReservaService` con `cancelar(usuarioId, reservaId)`: `403` si la reserva no pertenece al usuario, `409` si ya está `cancelada` o ya transcurrió (FR-018), de lo contrario marca `estado='cancelada'` y `cancelled_at` en `backend/src/services/reservaService.ts`
- [X] T051 [US3] Implementar ruta `GET /api/reservas/mias` 🔒 en `backend/src/api/routes/reservaRoutes.ts`
- [X] T052 [US3] Implementar ruta `DELETE /api/reservas/:reservaId` 🔒 en `backend/src/api/routes/reservaRoutes.ts`
- [X] T053 [P] [US3] Extender `reservasApi` con `listarMias(ambito)` y `cancelar(reservaId)` en `frontend/src/services/reservasApi.ts`
- [X] T054 [P] [US3] Construir `TarjetaReserva` (muestra cancha, fecha, hora; botón de cancelar visible solo cuando `cancelable === true` — FR-015, Acceptance Scenarios US3 #3, #6) en `frontend/src/components/TarjetaReserva.tsx`
- [X] T055 [US3] Construir `MisReservasPage` (secciones separadas de futuras/pasadas, diálogo de confirmación explícita antes de cancelar que no aplica cambios si se descarta — FR-016, Acceptance Scenario US3 #4, refresca estado tras cancelar) en `frontend/src/pages/MisReservasPage.tsx`

**Checkpoint**: Las 3 historias de usuario son funcionales de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que atraviesan las tres historias de usuario

- [X] T056 [P] Tests de componentes frontend para `GrillaDisponibilidad`, `TarjetaReserva`, y los flujos de `RegistroPage`/`LoginPage` en `frontend/tests/`
- [X] T057 [P] Test unitario de la derivación de estado en `ReservaService` (frontera exacta `futura/activa` → `pasada` en `hora_fin`, no en `hora_inicio` — clarificación del spec) en `backend/tests/unit/reservaService.test.ts`
- [X] T058 Ejecutar la validación manual completa de `quickstart.md` para US1-US3 y registrar resultados
- [X] T059 [P] Añadir `README.md` en la raíz con instrucciones de setup/ejecución que referencien `quickstart.md`
- [X] T060 Auditoría de mensajes de error: verificar que ninguna respuesta expone detalles internos/stack traces y que todos los códigos `400/401/403/404/409` siguen el formato `{ error: { message } }` de `contracts/api.md` (Principio V)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede iniciar de inmediato
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA todas las historias de usuario
- **User Stories (Phase 3-5)**: Todas dependen de Foundational
  - Pueden avanzar en paralelo (si hay capacidad) o en orden de prioridad P1 → P2 → P3
  - US2 y US3 comparten `backend/src/services/reservaService.ts` y
    `backend/src/api/routes/reservaRoutes.ts` (US3 extiende archivos creados en US2): si se
    trabajan en paralelo, coordinar esos dos archivos para evitar conflictos de merge
- **Polish (Phase 6)**: Depende de que las historias de usuario deseadas estén completas

### User Story Dependencies

- **User Story 1 (P1)**: Solo depende de Foundational — sin dependencia de otras historias
- **User Story 2 (P2)**: Depende de Foundational; requiere sesión activa de US1 para probarse
  end-to-end, pero su código de disponibilidad/reserva es independiente
- **User Story 3 (P3)**: Depende de Foundational; requiere reservas creadas por US2 para probarse
  end-to-end, y extiende los mismos archivos de servicio/rutas que US2 (T039/T041 → T049/T050,
  T051/T052)

### Within Each User Story

- Tests primero, deben fallar antes de implementar
- Modelos (Phase 2) ya existen antes de servicios de cada historia
- Servicios antes de rutas
- Rutas backend antes de clientes API frontend
- Implementación central antes de integración de páginas

### Parallel Opportunities

- T003, T004, T005, T006 (Setup) en paralelo tras T001/T002
- T009, T010, T011, T013, T014, T017, T018, T019 (Foundational) en paralelo tras T008/T012
- T020-T023 (tests US1) en paralelo entre sí
- T027, T028 (páginas US1) en paralelo
- T032, T033, T034 (tests US2) en paralelo entre sí; T035, T036 después (mismo archivo de servicio subyacente pero distinto archivo de test)
- T042, T043, T044 (clientes/componentes US2) en paralelo
- T047, T048 (tests US3) en paralelo entre sí
- T053, T054 (cliente/componente US3) en paralelo
- T056, T057, T059 (Polish) en paralelo

---

## Parallel Example: User Story 1

```bash
# Lanzar todos los tests de User Story 1 juntos:
Task: "Contract test POST /api/auth/registro en backend/tests/contract/auth.registro.test.ts"
Task: "Contract test POST /api/auth/login en backend/tests/contract/auth.login.test.ts"
Task: "Contract test POST /api/auth/logout y GET /api/auth/sesion en backend/tests/contract/auth.session.test.ts"
Task: "Contract test de guardas de autenticación en backend/tests/contract/auth.guard.test.ts"

# Lanzar las páginas de User Story 1 juntas:
Task: "Construir RegistroPage en frontend/src/pages/RegistroPage.tsx"
Task: "Construir LoginPage en frontend/src/pages/LoginPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloquea todas las historias)
3. Completar Phase 3: User Story 1
4. **DETENER y VALIDAR**: probar User Story 1 de forma independiente (registro/login/logout/guard)
5. Desplegar/demostrar si está listo

### Incremental Delivery

1. Setup + Foundational → Fundamento listo
2. Añadir User Story 1 → Probar de forma independiente → Demo (MVP: cuentas + guardas de acceso)
3. Añadir User Story 2 → Probar de forma independiente (incluye test de concurrencia) → Demo (valor central: reservar)
4. Añadir User Story 3 → Probar de forma independiente → Demo (autoservicio de gestión de reservas)
5. Cada historia añade valor sin romper las anteriores

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational en conjunto
2. Una vez completado Foundational:
   - Desarrollador A: User Story 1
   - Desarrollador B: User Story 2
   - Desarrollador C: User Story 3 (coordinando con B los archivos compartidos `reservaService.ts`/`reservaRoutes.ts`)
3. Las historias se completan e integran de forma independiente

---

## Notes

- `[P]` = archivos distintos, sin dependencias pendientes
- La etiqueta `[Story]` mapea cada tarea a su historia de usuario para trazabilidad
- Cada historia de usuario debe ser completable y probable de forma independiente
- Verificar que los tests fallan antes de implementar
- Confirmar (commit) después de cada tarea o grupo lógico
- Detenerse en cada checkpoint para validar la historia de forma independiente
- Evitar: tareas vagas, conflictos en el mismo archivo, dependencias cruzadas entre historias que rompan la independencia
