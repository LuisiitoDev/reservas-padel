import { apiClient } from "./apiClient";
import type { UsuarioSesion } from "./authContext";

interface UsuarioRespuesta {
  usuario: UsuarioSesion;
}

export const authApi = {
  registrar: (email: string, password: string) =>
    apiClient.post<UsuarioRespuesta>("/auth/registro", { email, password }),
  login: (email: string, password: string) =>
    apiClient.post<UsuarioRespuesta>("/auth/login", { email, password }),
  logout: () => apiClient.post<void>("/auth/logout"),
  sesion: () => apiClient.get<UsuarioRespuesta>("/auth/sesion"),
};
