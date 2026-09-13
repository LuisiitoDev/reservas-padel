import db from "../models/db.js";
import * as canchaModel from "../models/canchaModel.js";
import * as reservaModel from "../models/reservaModel.js";
import { ReservaBloqueOcupadoError } from "../models/reservaModel.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "./errors.js";

export interface ReservaPublica {
  id: number;
  canchaId: number;
  canchaNombre: string;
  fecha: string;
  horaInicio: number;
  horaFin: number;
  estado: "activa" | "cancelada";
}

export interface ReservaMiaPublica extends ReservaPublica {
  cancelable: boolean;
}

const MENSAJE_RESERVA_ACTIVA =
  "Ya tienes una reserva activa. Cancélala o espera a que finalice para crear otra.";
const MENSAJE_NO_CANCELABLE = "Esta reserva ya no se puede cancelar.";

export function crear(
  usuarioId: number,
  canchaId: number,
  fecha: string,
  horaInicio: number,
  ahora: Date = new Date(),
): ReservaPublica {
  const cancha = canchaModel.buscarPorId(canchaId);
  if (!cancha) {
    throw new NotFoundError("La cancha indicada no existe.");
  }

  if (!reservaModel.esVigente({ fecha, hora_inicio: horaInicio }, ahora)) {
    throw new BadRequestError("No puedes reservar una fecha u hora que ya transcurrió.");
  }

  const ejecutarEnTransaccion = db.transaction(() => {
    const activaExistente = reservaModel.buscarActivaPorUsuario(usuarioId, ahora);
    if (activaExistente) {
      throw new ConflictError(MENSAJE_RESERVA_ACTIVA);
    }
    return reservaModel.insertar(usuarioId, canchaId, fecha, horaInicio);
  });

  let reserva;
  try {
    reserva = ejecutarEnTransaccion();
  } catch (err) {
    if (err instanceof ReservaBloqueOcupadoError) {
      throw new ConflictError(err.message);
    }
    throw err;
  }

  return {
    id: reserva.id,
    canchaId: reserva.cancha_id,
    canchaNombre: cancha.nombre,
    fecha: reserva.fecha,
    horaInicio: reserva.hora_inicio,
    horaFin: reserva.hora_inicio + 1,
    estado: reserva.estado,
  };
}

export function listarMias(
  usuarioId: number,
  ambito: "futuras" | "pasadas",
  ahora: Date = new Date(),
): ReservaMiaPublica[] {
  const reservas = reservaModel.listarPorUsuario(usuarioId, ambito, ahora);
  return reservas.map((r) => ({
    id: r.id,
    canchaId: r.cancha_id,
    canchaNombre: r.cancha_nombre,
    fecha: r.fecha,
    horaInicio: r.hora_inicio,
    horaFin: r.hora_inicio + 1,
    estado: r.estado,
    cancelable: ambito === "futuras",
  }));
}

export function cancelar(usuarioId: number, reservaId: number, ahora: Date = new Date()): void {
  const reserva = reservaModel.buscarPorId(reservaId);
  if (!reserva) {
    throw new NotFoundError("La reserva indicada no existe.");
  }
  if (reserva.usuario_id !== usuarioId) {
    throw new ForbiddenError("No puedes cancelar una reserva de otro usuario.");
  }
  if (reserva.estado === "cancelada" || !reservaModel.esVigente(reserva, ahora)) {
    throw new ConflictError(MENSAJE_NO_CANCELABLE);
  }

  reservaModel.cancelar(reservaId);
}
