import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;

beforeAll(async () => {
  app = await crearAppDePrueba("reservas-create-rejections.db");
});

async function registrarAgente(email: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/registro").send({ email, password: "minimo8car" });
  return agent;
}

describe("POST /api/reservas (rechazos)", () => {
  it("responde 400 si la fecha/hora ya transcurrió", async () => {
    const agent = await registrarAgente("pasado@example.com");
    const res = await agent
      .post("/api/reservas")
      .send({ canchaId: 1, fecha: "2020-01-01", horaInicio: 10 });

    expect(res.status).toBe(400);
  });

  it("responde 409 con mensaje de reserva activa si el usuario ya tiene una vigente", async () => {
    const agent = await registrarAgente("vigente@example.com");
    const primera = await agent
      .post("/api/reservas")
      .send({ canchaId: 1, fecha: "2027-03-01", horaInicio: 8 });
    expect(primera.status).toBe(201);

    const segunda = await agent
      .post("/api/reservas")
      .send({ canchaId: 3, fecha: "2027-03-02", horaInicio: 9 });

    expect(segunda.status).toBe(409);
    expect(segunda.body.error.message).toMatch(/ya tienes una reserva activa/i);
  });

  it("responde 404 si canchaId no existe", async () => {
    const agent = await registrarAgente("cancha-inexistente@example.com");
    const res = await agent
      .post("/api/reservas")
      .send({ canchaId: 999, fecha: "2027-03-05", horaInicio: 9 });

    expect(res.status).toBe(404);
  });
});
