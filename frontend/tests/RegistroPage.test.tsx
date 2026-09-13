import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistroPage } from "../src/pages/RegistroPage";
import { authApi } from "../src/services/authApi";
import { ApiError } from "../src/services/apiClient";

const setUsuario = vi.fn();

vi.mock("../src/services/authApi", () => ({
  authApi: { registrar: vi.fn(), login: vi.fn(), logout: vi.fn(), sesion: vi.fn() },
}));

vi.mock("../src/services/authContext", async () => {
  const actual =
    await vi.importActual<typeof import("../src/services/authContext")>(
      "../src/services/authContext",
    );
  return {
    ...actual,
    useAuth: () => ({ usuario: null, cargando: false, setUsuario }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RegistroPage", () => {
  it("registra correctamente y actualiza la sesión", async () => {
    vi.mocked(authApi.registrar).mockResolvedValue({ usuario: { id: 1, email: "a@a.com" } });

    render(
      <MemoryRouter>
        <RegistroPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "a@a.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "minimo8car");
    await userEvent.click(screen.getByRole("button", { name: /registrarme/i }));

    await waitFor(() => expect(setUsuario).toHaveBeenCalledWith({ id: 1, email: "a@a.com" }));
  });

  it("muestra el error cuando el correo ya está registrado", async () => {
    vi.mocked(authApi.registrar).mockRejectedValue(
      new ApiError(409, "Ese correo electrónico ya está registrado."),
    );

    render(
      <MemoryRouter>
        <RegistroPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "dup@a.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "minimo8car");
    await userEvent.click(screen.getByRole("button", { name: /registrarme/i }));

    expect(await screen.findByText("Ese correo electrónico ya está registrado.")).toBeInTheDocument();
  });
});
