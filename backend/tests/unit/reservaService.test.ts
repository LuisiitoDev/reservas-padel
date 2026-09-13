import { describe, expect, it } from "vitest";
import { esVigente } from "../../src/models/reservaModel.js";

describe("esVigente (frontera futura/activa → pasada)", () => {
  const fecha = "2027-01-10";
  const horaInicio = 14; // bloque 14:00-15:00

  it("es vigente cuando 'ahora' está dentro del bloque (después de hora_inicio, antes de hora_fin)", () => {
    const ahora = new Date(`${fecha}T14:30:00`);
    expect(esVigente({ fecha, hora_inicio: horaInicio }, ahora)).toBe(true);
  });

  it("es vigente en el instante exacto de hora_inicio", () => {
    const ahora = new Date(`${fecha}T14:00:00`);
    expect(esVigente({ fecha, hora_inicio: horaInicio }, ahora)).toBe(true);
  });

  it("sigue vigente un instante antes de hora_fin (no transiciona en hora_inicio)", () => {
    const ahora = new Date(`${fecha}T14:59:59`);
    expect(esVigente({ fecha, hora_inicio: horaInicio }, ahora)).toBe(true);
  });

  it("deja de ser vigente exactamente en hora_fin", () => {
    const ahora = new Date(`${fecha}T15:00:00`);
    expect(esVigente({ fecha, hora_inicio: horaInicio }, ahora)).toBe(false);
  });

  it("no es vigente después de hora_fin", () => {
    const ahora = new Date(`${fecha}T15:00:01`);
    expect(esVigente({ fecha, hora_inicio: horaInicio }, ahora)).toBe(false);
  });
});
