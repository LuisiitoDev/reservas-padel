import { addHours, isAfter, parseISO } from "date-fns";
import db from "./db.js";

export interface Reserva {
  id: number;
  usuario_id: number;
  cancha_id: number;
  fecha: string;
  hora_inicio: number;
  estado: "activa" | "cancelada";
  created_at: string;
  cancelled_at: string | null;
}

export interface ReservaConCancha extends Reserva {
  cancha_nombre: string;
}

export class ReservaBloqueOcupadoError extends Error {}

function finDeBloque(fecha: string, horaInicio: number): Date {
  return addHours(parseISO(`${fecha}T00:00:00`), horaInicio + 1);
}

export function esVigente(reserva: Pick<Reserva, "fecha" | "hora_inicio">, ahora: Date): boolean {
  return isAfter(finDeBloque(reserva.fecha, reserva.hora_inicio), ahora);
}

export function insertar(
  usuarioId: number,
  canchaId: number,
  fecha: string,
  horaInicio: number,
): Reserva {
  try {
    const stmt = db.prepare(
      `INSERT INTO reservas (usuario_id, cancha_id, fecha, hora_inicio, estado)
       VALUES (?, ?, ?, ?, 'activa') RETURNING *`,
    );
    return stmt.get(usuarioId, canchaId, fecha, horaInicio) as Reserva;
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new ReservaBloqueOcupadoError("Ese horario ya no está disponible.");
    }
    throw err;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}

export function buscarActivaPorUsuario(usuarioId: number, ahora: Date): Reserva | undefined {
  const activas = db
    .prepare("SELECT * FROM reservas WHERE usuario_id = ? AND estado = 'activa'")
    .all(usuarioId) as Reserva[];
  return activas.find((r) => esVigente(r, ahora));
}

export function buscarPorCanchaYFecha(canchaId: number, fecha: string): Reserva[] {
  return db
    .prepare("SELECT * FROM reservas WHERE cancha_id = ? AND fecha = ? AND estado = 'activa'")
    .all(canchaId, fecha) as Reserva[];
}

export function buscarPorId(id: number): Reserva | undefined {
  return db.prepare("SELECT * FROM reservas WHERE id = ?").get(id) as Reserva | undefined;
}

export function listarPorUsuario(
  usuarioId: number,
  ambito: "futuras" | "pasadas",
  ahora: Date = new Date(),
): ReservaConCancha[] {
  const filas = db
    .prepare(
      `SELECT r.*, c.nombre AS cancha_nombre
       FROM reservas r
       JOIN canchas c ON c.id = r.cancha_id
       WHERE r.usuario_id = ?
       ORDER BY r.fecha ASC, r.hora_inicio ASC`,
    )
    .all(usuarioId) as ReservaConCancha[];

  return filas.filter((r) => {
    const vigente = r.estado === "activa" && esVigente(r, ahora);
    return ambito === "futuras" ? vigente : !vigente;
  });
}

export function cancelar(id: number): Reserva {
  const stmt = db.prepare(
    `UPDATE reservas SET estado = 'cancelada', cancelled_at = CURRENT_TIMESTAMP
     WHERE id = ? RETURNING *`,
  );
  return stmt.get(id) as Reserva;
}
