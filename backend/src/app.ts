import express from "express";
import { crearMiddlewareSesion } from "./api/session.js";
import { errorHandler } from "./api/middleware/errorHandler.js";
import { authRoutes } from "./api/routes/authRoutes.js";
import { canchaRoutes } from "./api/routes/canchaRoutes.js";
import { reservaRoutes } from "./api/routes/reservaRoutes.js";

export function crearApp() {
  const app = express();

  app.use(express.json());
  app.use(crearMiddlewareSesion());

  app.use("/api/auth", authRoutes);
  app.use("/api/canchas", canchaRoutes);
  app.use("/api/reservas", reservaRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: { message: "Recurso no encontrado." } });
  });

  app.use(errorHandler);

  return app;
}
