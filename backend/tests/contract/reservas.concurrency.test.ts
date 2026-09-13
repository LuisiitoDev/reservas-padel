import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;

beforeAll(async () => {
  app = await crearAppDePrueba("reservas-concurrency.db");
});

async function registrarAgente(email: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/registro").send({ email, password: "minimo8car" });
  return agent;
}

describe("Prevención de colisiones concurrente (Principio II)", () => {
  it("exactamente un usuario obtiene 201 y el otro 409 al reservar el mismo bloque casi simultáneamente", async () => {
    const [agenteA, agenteB] = await Promise.all([
      registrarAgente("concurrente-a@example.com"),
      registrarAgente("concurrente-b@example.com"),
    ]);

    const payload = { canchaId: 4, fecha: "2027-04-10", horaInicio: 12 };

    const [resA, resB] = await Promise.all([
      agenteA.post("/api/reservas").send(payload),
      agenteB.post("/api/reservas").send(payload),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const perdedor = resA.status === 409 ? resA : resB;
    expect(perdedor.body.error.message).toMatch(/ese horario ya no está disponible/i);
  });
});
