import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GrillaDisponibilidad } from "../src/components/GrillaDisponibilidad";

const bloques = [
  { horaInicio: 0, estado: "disponible" as const },
  { horaInicio: 1, estado: "reservado" as const },
  { horaInicio: 2, estado: "transcurrido" as const },
];

describe("GrillaDisponibilidad", () => {
  it("renderiza un bloque por estado", () => {
    render(<GrillaDisponibilidad bloques={bloques} onSeleccionar={() => {}} />);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    expect(screen.getByText("Transcurrido")).toBeInTheDocument();
  });

  it("solo permite seleccionar bloques disponibles", async () => {
    const onSeleccionar = vi.fn();
    render(<GrillaDisponibilidad bloques={bloques} onSeleccionar={onSeleccionar} />);

    const botones = screen.getAllByRole("button");
    expect(botones[0]).not.toBeDisabled();
    expect(botones[1]).toBeDisabled();
    expect(botones[2]).toBeDisabled();

    await userEvent.click(botones[0]);
    expect(onSeleccionar).toHaveBeenCalledWith(0);
  });
});
