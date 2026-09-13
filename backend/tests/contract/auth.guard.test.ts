import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;

beforeAll(async () => {
  app = await crearAppDePrueba("auth-guard.db");
});

describe("Guardas de autenticación", () => {
  it("GET /api/canchas/:canchaId/disponibilidad responde 401 sin sesión activa", async () => {
    const res = await request(app).get("/api/canchas/1/disponibilidad?fecha=2026-09-20");
    expect(res.status).toBe(401);
  });

  it("POST /api/reservas responde 401 sin sesión activa", async () => {
    const res = await request(app)
      .post("/api/reservas")
      .send({ canchaId: 1, fecha: "2026-09-20", horaInicio: 10 });
    expect(res.status).toBe(401);
  });
});
