import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { RegistroPage } from "./pages/RegistroPage";
import { LoginPage } from "./pages/LoginPage";
import { DisponibilidadPage } from "./pages/DisponibilidadPage";
import { MisReservasPage } from "./pages/MisReservasPage";
import { RequireAuth } from "./components/RequireAuth";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/disponibilidad"
        element={
          <RequireAuth>
            <DisponibilidadPage />
          </RequireAuth>
        }
      />
      <Route
        path="/mis-reservas"
        element={
          <RequireAuth>
            <MisReservasPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
