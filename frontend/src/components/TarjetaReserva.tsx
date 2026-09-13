import type { Reserva } from "../services/reservasApi";

interface TarjetaReservaProps {
  reserva: Reserva;
  onCancelar: (reserva: Reserva) => void;
}

export function TarjetaReserva({ reserva, onCancelar }: TarjetaReservaProps) {
  return (
    <div className="flex items-center justify-between rounded border p-4">
      <div>
        <p className="font-medium">{reserva.canchaNombre}</p>
        <p className="text-sm text-gray-600">
          {reserva.fecha} · {String(reserva.horaInicio).padStart(2, "0")}:00 -{" "}
          {String(reserva.horaFin).padStart(2, "0")}:00
        </p>
        {reserva.estado === "cancelada" && (
          <p className="text-xs text-gray-400">Cancelada</p>
        )}
      </div>
      {reserva.cancelable && (
        <button
          type="button"
          onClick={() => onCancelar(reserva)}
          className="rounded border border-red-600 px-3 py-1 text-sm text-red-600"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
