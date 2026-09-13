# Quickstart: Sistema de Reservas de Canchas de Pádel

**Feature**: `001-court-booking-system` | **Date**: 2026-09-13

Guía para levantar el entorno de desarrollo y validar manualmente (o vía tests automatizados)
que las 3 historias de usuario del spec funcionan de extremo a extremo. No repite detalles de
endpoints (ver [contracts/api.md](./contracts/api.md)) ni de esquema (ver
[data-model.md](./data-model.md)).

## Prerrequisitos

- Node.js 20 LTS y npm.
- Ningún servicio externo: la base de datos es un archivo SQLite local (`db/padel.db`), sin
  instalación previa de un motor de base de datos.

## Setup

```bash
# Backend
cd backend
npm install
npm run db:setup      # aplica db/schema.sql y db/seed.sql sobre db/padel.db
npm run dev            # levanta la API en http://localhost:3001

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev             # levanta la SPA en http://localhost:5173, proxy a la API
```

## Ejecutar tests

```bash
# Backend: unit + contrato (incluye el test de colisión concurrente de Principio II)
cd backend && npm test

# Frontend: componentes/flows
cd frontend && npm test
```

## Validación manual por historia de usuario

### US1 — Registro e inicio de sesión (P1)

1. Abrir `http://localhost:5173` sin sesión previa (navegación privada). Verificar que la app
   permite ver que el sistema existe, pero **no** muestra la grilla de disponibilidad completa
   ni permite reservar (FR-004).
2. Registrarse con un correo nuevo y una contraseña de al menos 8 caracteres. Verificar sesión
   activa inmediata (sin paso de verificación de correo) y acceso a las funciones de reserva.
3. Cerrar sesión, volver a iniciar sesión con las mismas credenciales. Verificar acceso
   restaurado.
4. Intentar iniciar sesión con una contraseña incorrecta: verificar rechazo con mensaje claro y
   que no se crea sesión.
5. Intentar registrarse de nuevo con el mismo correo: verificar rechazo por duplicado.

**Éxito** ⇔ Acceptance Scenarios 1-5 de US1 en `spec.md` pasan.

### US2 — Explorar disponibilidad y crear una reserva (P2)

1. Con sesión activa, seleccionar una de las 5 canchas y una fecha futura. Verificar grilla de
   24 bloques, cada uno "Disponible" o "Reservado".
2. Confirmar una reserva sobre un bloque "Disponible". Verificar que pasa a "Reservado" para
   cualquier usuario que consulte esa cancha/fecha.
3. Con la misma sesión (ya con una reserva vigente), intentar crear una segunda reserva en
   cualquier cancha/fecha: verificar rechazo con mensaje de "ya tienes una reserva activa".
4. **Prueba de concurrencia** (cubierta principalmente por el test automatizado de contrato en
   `backend/tests/contract`, dado que es difícil de reproducir manualmente de forma fiable):
   disparar dos `POST /api/reservas` casi simultáneos desde dos usuarios distintos sobre el
   mismo bloque/cancha/fecha. Verificar que exactamente uno recibe `201` y el otro `409`.
5. Intentar seleccionar un bloque de una fecha/hora ya transcurrida: verificar que la UI no lo
   ofrece como reservable (marcado "transcurrido").
6. Verificar que la UI solo permite seleccionar bloques completos de una hora predefinidos (no
   hay forma de pedir un rango parcial).

**Éxito** ⇔ Acceptance Scenarios 1-6 de US2 en `spec.md` pasan, incluyendo el test automatizado
de concurrencia.

### US3 — Gestionar mis reservas (P3)

1. Con una reserva futura ya creada (de US2), abrir el panel "Mis reservas". Verificar
   separación clara entre futuras y pasadas, cada una con cancha, fecha y hora.
2. Cancelar la reserva futura, confirmando la acción en el diálogo de confirmación. Verificar
   que desaparece de "futuras" y que el bloque vuelve a "Disponible" en la grilla (re-consultar
   US2 paso 1).
3. Ver una reserva pasada en el historial: verificar que no se ofrece opción de cancelar.
4. Iniciar una cancelación y luego cerrar/descartar el diálogo de confirmación sin confirmar:
   verificar que la reserva permanece activa sin cambios.
5. Con dos usuarios distintos, cada uno con su propia reserva: verificar que el panel de uno
   nunca muestra la reserva del otro.
6. Ver una reserva cancelada en el historial: verificar que no ofrece ninguna acción ejecutable.

**Éxito** ⇔ Acceptance Scenarios 1-6 de US3 en `spec.md` pasan.

## Notas de higiene de datos para pruebas manuales

- `npm run db:reset` (backend) borra y recrea `db/padel.db` desde cero (schema + seed de las 5
  canchas), útil para repetir la validación manual desde un estado limpio.
- Para simular "fecha/hora transcurrida" sin esperar al reloj real, usar fechas del pasado
  reciente directamente en la UI/API en lugar de manipular la hora del sistema.
