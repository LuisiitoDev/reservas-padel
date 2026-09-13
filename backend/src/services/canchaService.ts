import * as canchaModel from "../models/canchaModel.js";
import type { Cancha } from "../models/canchaModel.js";

export function listar(): Cancha[] {
  return canchaModel.listarTodas();
}
