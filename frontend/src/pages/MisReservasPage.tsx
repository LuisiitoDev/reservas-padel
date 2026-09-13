import { useCallback, useEffect, useState } from "react";
import { reservasApi, type Reserva } from "../services/reservasApi";
import { ApiError } from "../services/apiClient";
import { TarjetaReserva } from "../components/TarjetaReserva";

export function MisReservasPage() {
  const [futuras, setFuturas] = useState<Reserva[]>([]);
  const [pasadas, setPasadas] = useState<Reserva[]>([]);
  const [reservaACancelar, setReservaACancelar] = useState<Reserva | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const cargar = useCallback(() => {
    reservasApi.listarMias("futuras").then((data) => setFuturas(data.reservas));
    reservasApi.listarMias("pasadas").then((data) => setPasadas(data.reservas));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarCancelacion() {
    if (!reservaACancelar) return;
    setCancelando(true);
    setError(null);
    try {
      await reservasApi.cancelar(reservaACancelar.id);
      setReservaACancelar(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Mis reservas</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">Futuras</h2>
        {futuras.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes reservas futuras.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {futuras.map((r) => (
              <TarjetaReserva key={r.id} reserva={r} onCancelar={setReservaACancelar} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Pasadas</h2>
        {pasadas.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes reservas pasadas.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pasadas.map((r) => (
              <TarjetaReserva key={r.id} reserva={r} onCancelar={setReservaACancelar} />
            ))}
          </div>
        )}
      </section>

      {reservaACancelar && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="rounded bg-white p-6 shadow-lg">
            <p className="mb-4">
              ¿Confirmas cancelar tu reserva en {reservaACancelar.canchaNombre} el{" "}
              {reservaACancelar.fecha} a las{" "}
              {String(reservaACancelar.horaInicio).padStart(2, "0")}:00?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReservaACancelar(null)}
                className="rounded border px-4 py-2"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelando}
                onClick={confirmarCancelacion}
                className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
