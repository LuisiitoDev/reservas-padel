import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TarjetaReserva } from "../src/components/TarjetaReserva";
import type { Reserva } from "../src/services/reservasApi";

const reservaFutura: Reserva = {
  id: 1,
  canchaId: 1,
  canchaNombre: "Cancha Laureles",
  fecha: "2027-01-01",
  horaInicio: 10,
  horaFin: 11,
  estado: "activa",
  cancelable: true,
};

const reservaPasada: Reserva = { ...reservaFutura, id: 2, cancelable: false };

describe("TarjetaReserva", () => {
  it("muestra el botón cancelar solo cuando cancelable es true", () => {
    const { rerender } = render(
      <TarjetaReserva reserva={reservaFutura} onCancelar={() => {}} />,
    );
    expect(screen.getByText("Cancelar")).toBeInTheDocument();

    rerender(<TarjetaReserva reserva={reservaPasada} onCancelar={() => {}} />);
    expect(screen.queryByText("Cancelar")).not.toBeInTheDocument();
  });

  it("invoca onCancelar con la reserva al hacer click", async () => {
    const onCancelar = vi.fn();
    render(<TarjetaReserva reserva={reservaFutura} onCancelar={onCancelar} />);
    await userEvent.click(screen.getByText("Cancelar"));
    expect(onCancelar).toHaveBeenCalledWith(reservaFutura);
  });
});
