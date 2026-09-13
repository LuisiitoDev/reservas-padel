import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../services/authContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <div>Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
