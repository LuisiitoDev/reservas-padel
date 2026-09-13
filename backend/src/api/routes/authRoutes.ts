import { Router } from "express";
import * as authService from "../../services/authService.js";
import * as usuarioModel from "../../models/usuarioModel.js";
import { parseCredenciales } from "../../services/validation/authValidation.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { UnauthorizedError } from "../../services/errors.js";

export const authRoutes = Router();

authRoutes.post("/registro", async (req, res, next) => {
  try {
    const { email, password } = parseCredenciales(req.body);
    const usuario = await authService.registrar(email, password);
    req.session.usuarioId = usuario.id;
    res.status(201).json({ usuario });
  } catch (err) {
    next(err);
  }
});

authRoutes.post("/login", async (req, res, next) => {
  try {
    const { email, password } = parseCredenciales(req.body);
    const usuario = await authService.login(email, password);
    req.session.usuarioId = usuario.id;
    res.status(200).json({ usuario });
  } catch (err) {
    next(err);
  }
});

authRoutes.post("/logout", requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.clearCookie("connect.sid");
    res.status(204).send();
  });
});

authRoutes.get("/sesion", requireAuth, (req, res, next) => {
  try {
    const usuario = usuarioModel.buscarPorId(req.session.usuarioId!);
    if (!usuario) {
      throw new UnauthorizedError("Sesión inválida.");
    }
    res.status(200).json({ usuario: { id: usuario.id, email: usuario.email } });
  } catch (err) {
    next(err);
  }
});
