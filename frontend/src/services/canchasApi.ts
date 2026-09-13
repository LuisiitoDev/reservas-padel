import { apiClient } from "./apiClient";

export interface Cancha {
  id: number;
  nombre: string;
}

export type EstadoBloque = "disponible" | "reservado" | "transcurrido";

export interface Bloque {
  horaInicio: number;
  estado: EstadoBloque;
}

export interface Disponibilidad {
  canchaId: number;
  fecha: string;
  bloques: Bloque[];
}

export const canchasApi = {
  listar: () => apiClient.get<{ canchas: Cancha[] }>("/canchas"),
  disponibilidad: (canchaId: number, fecha: string) =>
    apiClient.get<Disponibilidad>(`/canchas/${canchaId}/disponibilidad?fecha=${fecha}`),
};
