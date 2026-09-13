import { Router } from "express";
import * as canchaService from "../../services/canchaService.js";
import * as canchaModel from "../../models/canchaModel.js";
import * as disponibilidadService from "../../services/disponibilidadService.js";
import { parseFechaQuery } from "../../services/validation/reservaValidation.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { NotFoundError } from "../../services/errors.js";

export const canchaRoutes = Router();

canchaRoutes.get("/", (_req, res) => {
  res.status(200).json({ canchas: canchaService.listar() });
});

canchaRoutes.get("/:canchaId/disponibilidad", requireAuth, (req, res, next) => {
  try {
    const canchaId = Number(req.params.canchaId);
    const cancha = canchaModel.buscarPorId(canchaId);
    if (!cancha) {
      throw new NotFoundError("La cancha indicada no existe.");
    }

    const fecha = parseFechaQuery(req.query.fecha);
    const bloques = disponibilidadService.obtenerGrilla(canchaId, fecha);
    res.status(200).json({ canchaId, fecha, bloques });
  } catch (err) {
    next(err);
  }
});
