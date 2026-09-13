import * as reservaModel from "../models/reservaModel.js";

export type EstadoBloque = "disponible" | "reservado" | "transcurrido";

export interface Bloque {
  horaInicio: number;
  estado: EstadoBloque;
}

export function obtenerGrilla(canchaId: number, fecha: string, ahora: Date = new Date()): Bloque[] {
  const reservasActivas = reservaModel.buscarPorCanchaYFecha(canchaId, fecha);
  const horasReservadas = new Set(reservasActivas.map((r) => r.hora_inicio));

  const bloques: Bloque[] = [];
  for (let horaInicio = 0; horaInicio < 24; horaInicio++) {
    const vigente = reservaModel.esVigente({ fecha, hora_inicio: horaInicio }, ahora);
    let estado: EstadoBloque;
    if (!vigente) {
      estado = "transcurrido";
    } else if (horasReservadas.has(horaInicio)) {
      estado = "reservado";
    } else {
      estado = "disponible";
    }
    bloques.push({ horaInicio, estado });
  }
  return bloques;
}
