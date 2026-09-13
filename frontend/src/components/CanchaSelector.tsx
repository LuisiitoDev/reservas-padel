import type { Cancha } from "../services/canchasApi";

interface CanchaSelectorProps {
  canchas: Cancha[];
  canchaId: number | null;
  fecha: string;
  onCanchaChange: (canchaId: number) => void;
  onFechaChange: (fecha: string) => void;
}

export function CanchaSelector({
  canchas,
  canchaId,
  fecha,
  onCanchaChange,
  onFechaChange,
}: CanchaSelectorProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1">
        <span>Cancha</span>
        <select
          value={canchaId ?? ""}
          onChange={(e) => onCanchaChange(Number(e.target.value))}
          className="rounded border px-3 py-2"
        >
          <option value="" disabled>
            Selecciona una cancha
          </option>
          {canchas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span>Fecha</span>
        <input
          type="date"
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
          className="rounded border px-3 py-2"
        />
      </label>
    </div>
  );
}
