# Research: Sistema de Reservas de Canchas de Pádel

**Feature**: `001-court-booking-system` | **Date**: 2026-09-13

El stack base (React + Tailwind, Node.js + Express, SQLite/`better-sqlite3`, TypeScript en
todo el stack) ya está fijado por la constitución (`Stack Tecnológico`), por lo que no requiere
investigación adicional. Este documento resuelve las decisiones de implementación que la
constitución y el spec dejan abiertas.

## 1. Hashing de contraseñas (FR-021)

- **Decision**: `bcrypt` (paquete `bcrypt` o `bcryptjs` si hay problemas de compilación nativa),
  con factor de costo 10-12.
- **Rationale**: algoritmo estándar de la industria para hashing de contraseñas, con salado
  automático incorporado; amplio soporte en Node.js y suficiente para la escala de este proyecto
  (un solo club).
- **Alternatives considered**: `argon2` (más moderno y recomendado por OWASP, pero requiere
  compilación nativa adicional sin beneficio claro a esta escala); hashing manual con `crypto`
  (rechazado: reinventar primitivas de seguridad viola el principio de simplicidad y añade
  riesgo).

## 2. Manejo de sesión con expiración por inactividad de 24h (FR-003)

- **Decision**: `express-session` con cookie `httpOnly`, `sameSite=lax`, y un store persistente
  respaldado por SQLite (`connect-sqlite3` o `better-sqlite3-session-store`) usando la misma base
  `padel.db`. `rolling: true` para que cada request válida reinicie el contador de expiración
  (`maxAge = 24h`), cumpliendo "expira tras 24 horas de **inactividad**".
- **Rationale**: mantiene la sesión en el servidor (no un JWT sin revocación), lo cual permite
  invalidar sesiones al cerrar sesión de forma inmediata y es coherente con la simplicidad del
  stack (sin necesidad de gestionar refresh tokens). Persistir en SQLite evita perder sesiones
  al reiniciar el proceso Node y evita añadir una dependencia externa (Redis) para un proyecto
  de este tamaño.
- **Alternatives considered**: JWT en cookie (rechazado: revocar sesión al hacer logout o forzar
  expiración por inactividad real es más complejo sin una lista de invalidación); sesión en
  memoria (rechazado: se pierde en cada reinicio del servidor, inaceptable incluso para un
  proyecto pequeño).

## 3. Prevención de colisiones de reserva (FR-011, FR-012, Principio II)

- **Decision**: restricción `UNIQUE(cancha_id, fecha, hora_inicio)` en la tabla `reservas` a
  nivel de base de datos (sobre las filas con estado activo), combinada con un `INSERT`
  envuelto en una transacción SQLite. Si el `INSERT` viola la restricción única, el backend
  captura el error y responde `409 Conflict` con el mensaje amigable definido en Principio V.
  SQLite serializa escrituras por diseño (un solo escritor a la vez), lo que hace que esta
  restricción sea suficiente para garantizar atomicidad sin necesidad de locks explícitos a
  nivel de aplicación.
- **Rationale**: delega la garantía de exclusión mutua al motor de base de datos en lugar de
  coordinarla en la capa de aplicación (más simple y a prueba de condiciones de carrera reales,
  incluso bajo múltiples requests concurrentes de Node gracias al modelo de escritura serializada
  de SQLite).
- **Alternatives considered**: verificar disponibilidad con un `SELECT` previo y luego `INSERT`
  en pasos separados sin restricción única (rechazado: ventana de carrera clásica
  TOCTOU/check-then-act, viola FR-011/FR-012 directamente); locking manual en memoria
  (rechazado: no escala a múltiples procesos y añade complejidad innecesaria).
- Para modelar "reserva activa única por usuario" (FR-013) se aplica la misma estrategia: un
  índice único parcial/condicional sobre `usuario_id` para filas cuyo estado sea "activa", o
  una verificación dentro de la misma transacción antes del `INSERT` (rechazo con `409` si ya
  existe una vigente).

## 4. Framework y estrategia de testing

- **Decision**: `vitest` como test runner para backend y frontend (TypeScript-first, rápido,
  compatible con ESM sin configuración adicional). Backend: `supertest` para tests de contrato
  HTTP contra la API Express. Frontend: `@testing-library/react` para tests de componentes.
- **Rationale**: `vitest` es el estándar de facto para proyectos TypeScript modernos, con API
  compatible con Jest (baja curva de aprendizaje) y arranque más rápido, coherente con el
  principio de simplicidad.
- **Alternatives considered**: `jest` (rechazado: configuración de ESM/TS más pesada sin
  beneficio adicional); no automatizar tests (rechazado: Principio II es NON-NEGOTIABLE y
  requiere verificación automatizada de la prevención de colisiones).

## 5. Manejo de fechas/horas para los bloques de 24h

- **Decision**: `date-fns` (funciones puras, sin extender prototipos nativos) para formateo y
  comparación de fechas en frontend y backend. Los bloques horarios se representan como enteros
  `0-23` (hora de inicio) junto con la `fecha` (`YYYY-MM-DD`) en la zona horaria local del
  servidor, sin conversión de zona horaria por usuario (ver Assumptions del spec).
- **Rationale**: `date-fns` es funcional (coherente con Principio IV), liviano y evita mutar
  objetos `Date` compartidos, un origen común de bugs en lógica de disponibilidad/expiración.
- **Alternatives considered**: `moment.js` (rechazado: deprecado/pesado); cálculo manual con
  `Date` nativo (rechazado: propenso a errores de mutabilidad y zona horaria sin aportar
  simplicidad real).

## 6. Comunicación frontend-backend

- **Decision**: API REST JSON simple consumida con `fetch` nativo desde React (sin cliente HTTP
  adicional como axios), con `credentials: 'include'` para enviar la cookie de sesión.
- **Rationale**: `fetch` es suficiente para el volumen de endpoints de este proyecto; añadir una
  librería de cliente HTTP no aporta valor a esta escala (Principio IV).
- **Alternatives considered**: `axios` (rechazado: dependencia adicional sin necesidad clara);
  GraphQL (rechazado: sobreingeniería para 6-8 endpoints REST bien definidos, viola Principio
  VI).

## Resumen de NEEDS CLARIFICATION

Ninguno pendiente: todas las decisiones técnicas quedan resueltas arriba o ya estaban fijadas
por la constitución.
