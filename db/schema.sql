PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS canchas (
  id INTEGER PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  cancha_id INTEGER NOT NULL REFERENCES canchas(id),
  fecha TEXT NOT NULL,
  hora_inicio INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_reserva_bloque
  ON reservas(cancha_id, fecha, hora_inicio)
  WHERE estado = 'activa';

CREATE INDEX IF NOT EXISTS ix_reserva_usuario ON reservas(usuario_id);
