import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient, ApiError } from "./apiClient";

export interface UsuarioSesion {
  id: number;
  email: string;
}

interface AuthContextValue {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  setUsuario: (usuario: UsuarioSesion | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ usuario: UsuarioSesion }>("/auth/sesion")
      .then((data) => setUsuario(data.usuario))
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error(err);
        }
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, setUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
