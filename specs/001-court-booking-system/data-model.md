# Data Model: Sistema de Reservas de Canchas de Pádel

**Feature**: `001-court-booking-system` | **Date**: 2026-09-13

Deriva de la sección `Key Entities` de [spec.md](./spec.md) y de las decisiones de
`research.md` (§3, prevención de colisiones). Persistencia en SQLite (`db/schema.sql`).

## Entidades

### Usuario

Persona registrada que puede iniciar sesión y es dueña de cero o más reservas.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | INTEGER PK autoincrement | Generado por la base de datos. |
| `email` | TEXT | `UNIQUE`, `NOT NULL`, normalizado a minúsculas antes de guardar/comparar (FR-001: sin correos duplicados). |
| `password_hash` | TEXT | `NOT NULL`. Hash `bcrypt` de una contraseña de mínimo 8 caracteres (FR-001, FR-021). Nunca se almacena ni se loguea la contraseña en texto plano. |
| `created_at` | TEXT (ISO 8601) | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`. |

**Validación de entrada** (antes de tocar la base de datos): `email` con formato válido;
`password` con longitud ≥ 8 caracteres (sin reglas adicionales de complejidad, por decisión de
clarificación del spec).

**Relaciones**: 1 Usuario → N Reservas.

### Cancha

Una de las 5 instalaciones fijas del club. Catálogo cerrado (Principio I, NON-NEGOTIABLE):
nunca se crea, edita ni elimina en runtime; se define una única vez en `db/seed.sql`.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | INTEGER PK | Fijo, uno de `1..5`. |
| `nombre` | TEXT | `UNIQUE`, `NOT NULL`. Valores exactos: `Cancha Laureles`, `Cancha El Poblado`, `Cancha Belén`, `Cancha Robledo`, `Cancha Envigado` (FR-006). |

**Relaciones**: 1 Cancha → N Reservas. No tiene atributos configurables por el usuario final.

### Reserva

Vínculo entre un Usuario, una Cancha, una fecha y un bloque horario de una hora.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | INTEGER PK autoincrement | Generado por la base de datos. |
| `usuario_id` | INTEGER FK → `usuarios.id` | `NOT NULL`. |
| `cancha_id` | INTEGER FK → `canchas.id` | `NOT NULL`. |
| `fecha` | TEXT (`YYYY-MM-DD`) | `NOT NULL`. |
| `hora_inicio` | INTEGER (`0..23`) | `NOT NULL`. Bloque de una hora completa; `hora_fin = hora_inicio + 1` (FR-009, sin bloques parciales). |
| `estado` | TEXT | `NOT NULL`. Uno de `activa` \| `cancelada` (ver máquina de estados abajo). No se almacena `pasada` como valor propio: es un estado **derivado** en tiempo de lectura a partir de `estado = 'activa'` y `fecha + hora_fin < ahora` (evita datos desnormalizados que puedan desincronizarse). |
| `created_at` | TEXT (ISO 8601) | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`. |
| `cancelled_at` | TEXT (ISO 8601) \| NULL | `NULL` mientras `estado = 'activa'`; se fija al cancelar. |

**Restricciones de integridad (base de datos)**:

- `UNIQUE(cancha_id, fecha, hora_inicio)` **filtrado a `estado = 'activa'`** (índice único
  parcial: `CREATE UNIQUE INDEX ux_reserva_bloque ON reservas(cancha_id, fecha, hora_inicio)
  WHERE estado = 'activa';`). Garantiza a nivel de motor que nunca existan dos reservas activas
  sobre el mismo bloque/cancha/fecha (Principio II, FR-011, FR-012). Permite reutilizar el
  bloque tras una cancelación sin violar la unicidad histórica.
- Índice único parcial adicional `ux_reserva_activa_por_usuario ON reservas(usuario_id) WHERE
  estado = 'activa' AND (fecha || hora_inicio) >= ahora_en_insert` — en la práctica esta
  segunda condición no es expresable de forma estática en un índice SQLite (depende del
  reloj), por lo que la regla "una reserva vigente por usuario" (FR-013) se aplica en la capa
  de servicio dentro de la **misma transacción** que el `INSERT`: se verifica que el usuario no
  tenga ninguna fila con `estado = 'activa'` y `fecha/hora_fin` aún no transcurrida antes de
  insertar; si existe, se aborta con conflicto. Ver `research.md` §3.

**Estados derivados en lectura** (no persistidos, calculados con la hora actual del servidor):

- `futura/activa` (vigente): `estado = 'activa'` **y** el momento actual es anterior a
  `fecha + hora_fin` (es decir, incluye el bloque en curso — clarificación del spec: la
  transición a "pasada" ocurre en la hora de **fin**, no de inicio).
- `pasada`: `estado = 'activa'` **y** el momento actual es igual o posterior a
  `fecha + hora_fin`. Solo aparece en el historial; no bloquea nuevas reservas ni es
  cancelable.
- `cancelada`: `estado = 'cancelada'`. Aparece en el historial (no en "futuras"), nunca ofrece
  acción de cancelar de nuevo, y no cuenta como reserva activa cumplida (Assumptions del spec).

**Relaciones**: N Reservas → 1 Usuario, N Reservas → 1 Cancha.

## Máquina de estados de Reserva

```text
                crear reserva (bloque libre, sin reserva vigente propia)
                              │
                              ▼
                         [activa] ──────────────────────────────┐
                         (vigente mientras fecha+hora_fin > ahora)│
                              │                                   │
        usuario cancela       │                       llega fecha+hora_fin
        (solo si vigente)     │                        (transcurre el tiempo)
                              ▼                                   ▼
                        [cancelada]                          [activa]
                     (histórico, fin)                  (derivado: "pasada",
                                                          histórico, fin)
```

Ambos estados terminales (`cancelada` y "pasada") son de solo lectura: ninguna transición sale
de ellos (FR-018: no se puede cancelar una reserva ya pasada; una reserva cancelada tampoco se
reactiva).

## Sesión (mecanismo técnico, no es una "Key Entity" del dominio de negocio)

No forma parte del dominio de reservas descrito en el spec, pero es necesaria para soportar
FR-003. Se persiste en una tabla de sesiones separada gestionada automáticamente por el store
de `express-session` (ver `research.md` §2): `sid`, `expires`, `data` (JSON serializado con
`usuario_id`). No requiere modelado adicional en este documento porque su esquema lo define la
librería del store, no la lógica de negocio.
