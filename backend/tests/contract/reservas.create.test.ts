import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;
let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  app = await crearAppDePrueba("reservas-create.db");
  agent = request.agent(app);
  await agent
    .post("/api/auth/registro")
    .send({ email: "reserva-feliz@example.com", password: "minimo8car" });
});

describe("POST /api/reservas (camino feliz)", () => {
  it("crea la reserva con 201 y el bloque pasa a 'reservado' en la disponibilidad", async () => {
    const res = await agent
      .post("/api/reservas")
      .send({ canchaId: 2, fecha: "2027-02-10", horaInicio: 9 });

    expect(res.status).toBe(201);
    expect(res.body.reserva).toMatchObject({
      canchaId: 2,
      canchaNombre: "Cancha El Poblado",
      fecha: "2027-02-10",
      horaInicio: 9,
      horaFin: 10,
      estado: "activa",
    });

    const disponibilidad = await agent.get("/api/canchas/2/disponibilidad?fecha=2027-02-10");
    expect(disponibilidad.body.bloques[9].estado).toBe("reservado");
  });
});
