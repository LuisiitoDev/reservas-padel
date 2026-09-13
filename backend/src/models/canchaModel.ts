import db from "./db.js";

export interface Cancha {
  id: number;
  nombre: string;
}

export function listarTodas(): Cancha[] {
  return db.prepare("SELECT * FROM canchas ORDER BY id ASC").all() as Cancha[];
}

export function buscarPorId(id: number): Cancha | undefined {
  return db.prepare("SELECT * FROM canchas WHERE id = ?").get(id) as Cancha | undefined;
}
