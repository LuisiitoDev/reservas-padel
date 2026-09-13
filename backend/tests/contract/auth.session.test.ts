import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;

beforeAll(async () => {
  app = await crearAppDePrueba("auth-session.db");
});

describe("GET /api/auth/sesion y POST /api/auth/logout", () => {
  it("responde 401 en /sesion sin sesión activa", async () => {
    const res = await request(app).get("/api/auth/sesion");
    expect(res.status).toBe(401);
  });

  it("responde 200 en /sesion tras registro, 204 en logout, y 401 en /sesion después", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/registro")
      .send({ email: "sesion@example.com", password: "minimo8car" });

    const sesionActiva = await agent.get("/api/auth/sesion");
    expect(sesionActiva.status).toBe(200);

    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(204);

    const sesionTrasLogout = await agent.get("/api/auth/sesion");
    expect(sesionTrasLogout.status).toBe(401);
  });
});
