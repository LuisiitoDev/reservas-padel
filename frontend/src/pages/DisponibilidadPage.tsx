import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { canchasApi, type Bloque, type Cancha } from "../services/canchasApi";
import { reservasApi } from "../services/reservasApi";
import { ApiError } from "../services/apiClient";
import { CanchaSelector } from "../components/CanchaSelector";
import { GrillaDisponibilidad } from "../components/GrillaDisponibilidad";

export function DisponibilidadPage() {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [canchaId, setCanchaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    canchasApi.listar().then(({ canchas }) => {
      setCanchas(canchas);
      if (canchas.length > 0) {
        setCanchaId(canchas[0].id);
      }
    });
  }, []);

  const cargarDisponibilidad = useCallback(() => {
    if (canchaId === null) return;
    canchasApi.disponibilidad(canchaId, fecha).then((data) => setBloques(data.bloques));
  }, [canchaId, fecha]);

  useEffect(() => {
    cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  async function confirmarReserva() {
    if (canchaId === null || horaSeleccionada === null) return;
    setConfirmando(true);
    setError(null);
    setMensaje(null);
    try {
      await reservasApi.crear(canchaId, fecha, horaSeleccionada);
      setMensaje("Reserva confirmada.");
      setHoraSeleccionada(null);
      cargarDisponibilidad();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Disponibilidad</h1>
      <CanchaSelector
        canchas={canchas}
        canchaId={canchaId}
        fecha={fecha}
        onCanchaChange={(id) => {
          setCanchaId(id);
          setHoraSeleccionada(null);
        }}
        onFechaChange={(f) => {
          setFecha(f);
          setHoraSeleccionada(null);
        }}
      />

      {mensaje && <p className="mt-4 text-sm text-green-700">{mensaje}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <GrillaDisponibilidad bloques={bloques} onSeleccionar={setHoraSeleccionada} />
      </div>

      {horaSeleccionada !== null && (
        <div className="mt-6 rounded border p-4">
          <p className="mb-3">
            ¿Confirmar reserva para las {String(horaSeleccionada).padStart(2, "0")}:00 del {fecha}?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={confirmando}
              onClick={confirmarReserva}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setHoraSeleccionada(null)}
              className="rounded border px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
