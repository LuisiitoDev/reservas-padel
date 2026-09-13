import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../src/pages/LoginPage";
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

describe("LoginPage", () => {
  it("inicia sesión correctamente y actualiza el contexto", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ usuario: { id: 1, email: "a@a.com" } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "a@a.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "minimo8car");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => expect(setUsuario).toHaveBeenCalledWith({ id: 1, email: "a@a.com" }));
  });

  it("muestra el mensaje genérico de error en credenciales incorrectas", async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError(401, "correo o contraseña incorrectos"),
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "a@a.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "incorrecta");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("correo o contraseña incorrectos")).toBeInTheDocument();
  });
});
