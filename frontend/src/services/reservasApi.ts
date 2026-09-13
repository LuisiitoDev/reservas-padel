import { apiClient } from "./apiClient";

export interface Reserva {
  id: number;
  canchaId: number;
  canchaNombre: string;
  fecha: string;
  horaInicio: number;
  horaFin: number;
  estado: "activa" | "cancelada";
  cancelable?: boolean;
}

export const reservasApi = {
  crear: (canchaId: number, fecha: string, horaInicio: number) =>
    apiClient.post<{ reserva: Reserva }>("/reservas", { canchaId, fecha, horaInicio }),
  listarMias: (ambito: "futuras" | "pasadas") =>
    apiClient.get<{ reservas: Reserva[] }>(`/reservas/mias?ambito=${ambito}`),
  cancelar: (reservaId: number) => apiClient.delete<void>(`/reservas/${reservaId}`),
};
