# Implementation Plan: Sistema de Reservas de Canchas de Pádel

**Branch**: `001-court-booking-system` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-court-booking-system/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Sistema web de reserva de canchas de pádel para un único club con 5 canchas fijas. Los
usuarios se registran/inician sesión con correo y contraseña, consultan una grilla de
disponibilidad de 24 bloques horarios (uno por hora) para una cancha y fecha elegidas, crean
una reserva sobre un bloque libre con prevención estricta de colisiones concurrentes, y
gestionan sus propias reservas (futuras/pasadas, con cancelación) desde un panel personal.
Enfoque técnico: SPA en React + Tailwind que consume una API REST en Express/TypeScript,
persistencia en SQLite (`better-sqlite3`) con una restricción `UNIQUE` a nivel de base de
datos como mecanismo central anti-double-booking, y sesiones de servidor con expiración
deslizante de 24 horas de inactividad.

## Technical Context

**Language/Version**: TypeScript 5.x en todo el stack, ejecutado sobre Node.js 20 LTS
(backend) y compilado/empaquetado para navegadores modernos (frontend, React 18).

**Primary Dependencies**: Backend — Express, `better-sqlite3`, `bcrypt`, `express-session` +
store de sesión respaldado en SQLite, `date-fns`, `zod` (validación de payloads de entrada).
Frontend — React 18, React Router, Tailwind CSS, `date-fns`; comunicación vía `fetch` nativo
(sin cliente HTTP adicional).

**Storage**: SQLite local, archivo `db/padel.db`, acceso mediante `better-sqlite3` (sin ORM
pesado; SQL puro con sentencias preparadas). Esquema y semillas versionados en `db/schema.sql`
y `db/seed.sql` (catálogo cerrado de 5 canchas).

**Testing**: `vitest` como test runner en ambos paquetes. Backend: tests de contrato HTTP con
`supertest` contra la API Express (incluye tests de concurrencia para la prevención de
colisiones). Frontend: `@testing-library/react` para tests de componentes/flows clave.

**Target Platform**: Aplicación web servida desde un backend Node.js (Linux/cualquier entorno
compatible con Node 20) y consumida desde navegadores de escritorio/móviles modernos.

**Project Type**: Web application (frontend + backend separados, según estructura plana fijada
por la constitución: `/frontend`, `/backend`, `/db`).

**Performance Goals**: Carga de la grilla de disponibilidad (24 bloques) en <500ms p95 bajo
uso normal de un solo club; confirmación de reserva con respuesta <300ms p95 (excluye
percepción de red del cliente). No se diseña para alta concurrencia masiva: escala esperada es
la de un único club (decenas de usuarios concurrentes, no miles).

**Constraints**: Sesión de usuario expira tras 24h de inactividad (FR-003, deslizante).
Ninguna reserva puede escribirse sin validar atomicidad de disponibilidad en la misma
operación de base de datos (Principio II, NON-NEGOTIABLE). Todo endpoint de reserva/gestión
exige sesión activa (Principio III, NON-NEGOTIABLE). Catálogo de canchas inmutable en código/
semilla, nunca administrable en runtime (Principio I, NON-NEGOTIABLE).

**Scale/Scope**: Un solo club, 5 canchas fijas, 24 bloques horarios por cancha/día, sin límite
de anticipación de fechas reservables (FR-019). 3 historias de usuario (auth, disponibilidad +
reserva, gestión de "mis reservas"), ~21 requisitos funcionales.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Cómo lo cumple el plan |
|-----------|--------|-------------------------|
| I. Catálogo Cerrado de Canchas (NON-NEGOTIABLE) | ✅ PASS | Las 5 canchas se insertan vía `db/seed.sql` como datos fijos; no existe endpoint ni UI para crear/editar/eliminar canchas (ver `data-model.md`, `contracts/api.md`). |
| II. Prevención de Colisiones y Bloques de 24 Horas (NON-NEGOTIABLE) | ✅ PASS | Restricción `UNIQUE(cancha_id, fecha, hora_inicio)` en SQLite + `INSERT` transaccional; SQLite serializa escrituras. Ver decisión #3 en `research.md`. Tests de contrato cubren el escenario de doble reserva concurrente (US2, escenario 4). |
| III. Autenticación Obligatoria (NON-NEGOTIABLE) | ✅ PASS | Middleware de sesión (`requireAuth`) aplicado a todas las rutas de disponibilidad detallada, creación y gestión de reservas (`contracts/api.md`). |
| IV. Simplicidad Estructural y Estilo Funcional | ✅ PASS | Estructura plana `/frontend`, `/backend`, `/db` (ver Project Structure). Componentes funcionales de React + Hooks; sin clases salvo obligación de librería externa; `camelCase`/`PascalCase` consistentes. |
| V. Errores Amigables y Códigos HTTP Semánticos | ✅ PASS | Middleware central de manejo de errores en Express traduce errores a mensajes amigables + códigos 400/401/403/404/409 (ver `contracts/api.md`). |
| VI. Disciplina de Alcance — Cero Código Sombra | ✅ PASS | Alcance limitado estrictamente a FR-001..FR-021; sin pasarela de pago, perfiles extendidos, recuperación de contraseña ni verificación de email (excluidos explícitamente en Assumptions del spec). |

No hay violaciones; no se requiere `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/001-court-booking-system/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # Acceso a datos: usuarios, canchas, reservas (SQL + better-sqlite3)
│   ├── services/         # Reglas de negocio: auth, disponibilidad, reservas, cancelación
│   ├── api/               # Rutas Express + middlewares (requireAuth, errorHandler)
│   └── app.ts             # Construcción de la app Express (sin side effects de arranque)
├── tests/
│   ├── contract/          # supertest contra la API (incluye test de colisión concurrente)
│   └── unit/              # servicios de negocio en aislamiento
└── server.ts               # Punto de entrada (listen)

frontend/
├── src/
│   ├── components/        # UI reutilizable (GrillaDisponibilidad, TarjetaReserva, etc.)
│   ├── pages/              # RegistroPage, LoginPage, DisponibilidadPage, MisReservasPage
│   └── services/            # Cliente API (fetch) por dominio: authApi, canchasApi, reservasApi
├── tests/                    # @testing-library/react
└── index.html / main.tsx

db/
├── schema.sql                # DDL: usuarios, canchas, reservas (con UNIQUE anti-colisión)
├── seed.sql                   # Catálogo fijo de las 5 canchas
└── padel.db                    # Archivo SQLite generado en runtime (no versionado)
```

**Structure Decision**: Web application con frontend y backend separados (Opción 2), tal como
exige la constitución (`Stack Tecnológico`, Principio IV: estructura plana `/frontend`,
`/backend`, `/db`). No se introduce una carpeta compartida `/shared`: los tipos TypeScript de
las entidades (`Usuario`, `Cancha`, `Reserva`) se definen independientemente en cada paquete a
partir del contrato de API en `contracts/api.md`, evitando acoplar el build de frontend y
backend (mantiene ambos paquetes desplegables/instalables de forma independiente, sin añadir
un monorepo tool adicional).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A — sin violaciones | — | — |
