import { Router } from "express";
import * as reservaService from "../../services/reservaService.js";
import {
  parseAmbito,
  parseCrearReserva,
} from "../../services/validation/reservaValidation.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const reservaRoutes = Router();

reservaRoutes.post("/", requireAuth, (req, res, next) => {
  try {
    const { canchaId, fecha, horaInicio } = parseCrearReserva(req.body);
    const reserva = reservaService.crear(req.session.usuarioId!, canchaId, fecha, horaInicio);
    res.status(201).json({ reserva });
  } catch (err) {
    next(err);
  }
});

reservaRoutes.get("/mias", requireAuth, (req, res, next) => {
  try {
    const ambito = parseAmbito(req.query.ambito);
    const reservas = reservaService.listarMias(req.session.usuarioId!, ambito);
    res.status(200).json({ reservas });
  } catch (err) {
    next(err);
  }
});

reservaRoutes.delete("/:reservaId", requireAuth, (req, res, next) => {
  try {
    const reservaId = Number(req.params.reservaId);
    reservaService.cancelar(req.session.usuarioId!, reservaId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
