import type { Bloque } from "../services/canchasApi";

interface GrillaDisponibilidadProps {
  bloques: Bloque[];
  onSeleccionar: (horaInicio: number) => void;
}

const ESTILOS_ESTADO: Record<Bloque["estado"], string> = {
  disponible: "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer",
  reservado: "bg-red-100 text-red-800 cursor-not-allowed",
  transcurrido: "bg-gray-100 text-gray-400 cursor-not-allowed",
};

const ETIQUETA_ESTADO: Record<Bloque["estado"], string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  transcurrido: "Transcurrido",
};

export function GrillaDisponibilidad({ bloques, onSeleccionar }: GrillaDisponibilidadProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {bloques.map((bloque) => (
        <button
          key={bloque.horaInicio}
          type="button"
          disabled={bloque.estado !== "disponible"}
          onClick={() => onSeleccionar(bloque.horaInicio)}
          className={`rounded border px-2 py-3 text-sm ${ESTILOS_ESTADO[bloque.estado]}`}
        >
          <div className="font-medium">{String(bloque.horaInicio).padStart(2, "0")}:00</div>
          <div className="text-xs">{ETIQUETA_ESTADO[bloque.estado]}</div>
        </button>
      ))}
    </div>
  );
}
