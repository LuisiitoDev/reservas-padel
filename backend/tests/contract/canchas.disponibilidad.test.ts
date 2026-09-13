import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { format } from "date-fns";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;
let agent: ReturnType<typeof request.agent>;

beforeAll(async () => {
  app = await crearAppDePrueba("canchas-disponibilidad.db");
  agent = request.agent(app);
  await agent
    .post("/api/auth/registro")
    .send({ email: "disponibilidad@example.com", password: "minimo8car" });
});

describe("GET /api/canchas/:canchaId/disponibilidad", () => {
  it("devuelve siempre 24 bloques con estados válidos para una fecha futura", async () => {
    const res = await agent.get("/api/canchas/1/disponibilidad?fecha=2027-01-15");

    expect(res.status).toBe(200);
    expect(res.body.canchaId).toBe(1);
    expect(res.body.fecha).toBe("2027-01-15");
    expect(res.body.bloques).toHaveLength(24);
    for (let hora = 0; hora < 24; hora++) {
      expect(res.body.bloques[hora]).toMatchObject({ horaInicio: hora });
      expect(["disponible", "reservado", "transcurrido"]).toContain(res.body.bloques[hora].estado);
    }
    // Fecha futura: ningún bloque puede estar "transcurrido"
    expect(res.body.bloques.every((b: { estado: string }) => b.estado !== "transcurrido")).toBe(
      true,
    );
  });

  it("marca como transcurridos los bloques de hoy anteriores a la hora actual", async () => {
    const hoy = format(new Date(), "yyyy-MM-dd");
    const horaActual = new Date().getHours();

    const res = await agent.get(`/api/canchas/1/disponibilidad?fecha=${hoy}`);

    expect(res.status).toBe(200);
    for (let hora = 0; hora < horaActual; hora++) {
      expect(res.body.bloques[hora].estado).toBe("transcurrido");
    }
  });

  it("responde 400 si falta la fecha", async () => {
    const res = await agent.get("/api/canchas/1/disponibilidad");
    expect(res.status).toBe(400);
  });

  it("responde 400 si la fecha tiene formato inválido", async () => {
    const res = await agent.get("/api/canchas/1/disponibilidad?fecha=15-01-2027");
    expect(res.status).toBe(400);
  });

  it("responde 404 si la cancha no existe", async () => {
    const res = await agent.get("/api/canchas/999/disponibilidad?fecha=2027-01-15");
    expect(res.status).toBe(404);
  });
});
