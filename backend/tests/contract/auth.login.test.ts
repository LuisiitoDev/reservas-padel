import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;

beforeAll(async () => {
  app = await crearAppDePrueba("auth-login.db");
  await request(app)
    .post("/api/auth/registro")
    .send({ email: "existente@example.com", password: "minimo8car" });
});

describe("POST /api/auth/login", () => {
  it("inicia sesión con credenciales válidas y devuelve 200", async () => {
    const agent = request.agent(app);
    const res = await agent
      .post("/api/auth/login")
      .send({ email: "existente@example.com", password: "minimo8car" });

    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({ email: "existente@example.com" });
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rechaza contraseña incorrecta con 401 y mensaje genérico", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "existente@example.com", password: "incorrecta" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/correo o contraseña incorrectos/i);
  });

  it("rechaza un email inexistente con 401 y el mismo mensaje genérico", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "no-existe@example.com", password: "minimo8car" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/correo o contraseña incorrectos/i);
  });

  it("rechaza un payload incompleto con 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "existente@example.com" });

    expect(res.status).toBe(400);
  });
});
