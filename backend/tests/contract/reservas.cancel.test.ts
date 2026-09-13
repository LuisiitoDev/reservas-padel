import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import Database from "better-sqlite3";
import { crearAppDePruebaConRutaDb } from "../helpers/testApp.js";

let app: Express;
let dbPath: string;
let agentA: ReturnType<typeof request.agent>;
let agentB: ReturnType<typeof request.agent>;
let reservaId: number;

beforeAll(async () => {
  ({ app, dbPath } = await crearAppDePruebaConRutaDb("reservas-cancel.db"));

  agentA = request.agent(app);
  await agentA
    .post("/api/auth/registro")
    .send({ email: "cancel-a@example.com", password: "minimo8car" });

  agentB = request.agent(app);
  await agentB
    .post("/api/auth/registro")
    .send({ email: "cancel-b@example.com", password: "minimo8car" });

  const creada = await agentA
    .post("/api/reservas")
    .send({ canchaId: 1, fecha: "2027-06-01", horaInicio: 8 });
  reservaId = creada.body.reserva.id;
});

describe("DELETE /api/reservas/:reservaId", () => {
  it("responde 404 si la reserva no existe", async () => {
    const res = await agentA.delete("/api/reservas/999999");
    expect(res.status).toBe(404);
  });

  it("responde 403 si la reserva pertenece a otro usuario", async () => {
    const res = await agentB.delete(`/api/reservas/${reservaId}`);
    expect(res.status).toBe(403);
  });

  it("cancela con 204 y libera el bloque de inmediato", async () => {
    const cancelacion = await agentA.delete(`/api/reservas/${reservaId}`);
    expect(cancelacion.status).toBe(204);

    const disponibilidad = await agentA.get("/api/canchas/1/disponibilidad?fecha=2027-06-01");
    expect(disponibilidad.body.bloques[8].estado).toBe("disponible");
  });

  it("responde 409 si la reserva ya está cancelada", async () => {
    const res = await agentA.delete(`/api/reservas/${reservaId}`);
    expect(res.status).toBe(409);
  });

  it("responde 409 si la reserva ya transcurrió", async () => {
    const db = new Database(dbPath);
    const usuario = db
      .prepare("SELECT id FROM usuarios WHERE email = ?")
      .get("cancel-a@example.com") as { id: number };
    const reservaPasada = db
      .prepare(
        `INSERT INTO reservas (usuario_id, cancha_id, fecha, hora_inicio, estado)
         VALUES (?, 5, '2020-01-01', 10, 'activa') RETURNING *`,
      )
      .get(usuario.id) as { id: number };
    db.close();

    const res = await agentA.delete(`/api/reservas/${reservaPasada.id}`);
    expect(res.status).toBe(409);
  });
});
