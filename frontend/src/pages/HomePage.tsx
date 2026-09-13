import { Link } from "react-router-dom";
import { useAuth } from "../services/authContext";

export function HomePage() {
  const { usuario, cargando } = useAuth();

  return (
    <div className="mx-auto max-w-lg p-6 text-center">
      <h1 className="mb-2 text-2xl font-bold">Club de Pádel</h1>
      <p className="mb-6 text-gray-600">
        Reserva tu cancha de pádel en minutos. 5 canchas disponibles, bloques de una hora.
      </p>

      {cargando ? null : usuario ? (
        <div className="flex justify-center gap-3">
          <Link to="/disponibilidad" className="rounded bg-blue-600 px-4 py-2 text-white">
            Ver disponibilidad
          </Link>
          <Link to="/mis-reservas" className="rounded border px-4 py-2">
            Mis reservas
          </Link>
        </div>
      ) : (
        <div className="flex justify-center gap-3">
          <Link to="/login" className="rounded bg-blue-600 px-4 py-2 text-white">
            Iniciar sesión
          </Link>
          <Link to="/registro" className="rounded border px-4 py-2">
            Crear cuenta
          </Link>
        </div>
      )}
    </div>
  );
}
