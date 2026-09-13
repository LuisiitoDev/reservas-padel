import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;

beforeAll(async () => {
  app = await crearAppDePrueba("auth-registro.db");
});

describe("POST /api/auth/registro", () => {
  it("registra un usuario nuevo, crea sesión y devuelve 201", async () => {
    const agent = request.agent(app);
    const res = await agent
      .post("/api/auth/registro")
      .send({ email: "jugador@example.com", password: "minimo8car" });

    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({ email: "jugador@example.com" });
    expect(res.body.usuario.id).toBeTypeOf("number");
    expect(res.headers["set-cookie"]).toBeDefined();

    const sesion = await agent.get("/api/auth/sesion");
    expect(sesion.status).toBe(200);
  });

  it("rechaza un email duplicado con 409", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/registro")
      .send({ email: "duplicado@example.com", password: "minimo8car" });

    const res = await agent
      .post("/api/auth/registro")
      .send({ email: "duplicado@example.com", password: "otraClave123" });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBeTypeOf("string");
  });

  it("rechaza un password menor a 8 caracteres con 400", async () => {
    const res = await request(app)
      .post("/api/auth/registro")
      .send({ email: "corto@example.com", password: "abc123" });

    expect(res.status).toBe(400);
  });

  it("rechaza un email con formato inválido con 400", async () => {
    const res = await request(app)
      .post("/api/auth/registro")
      .send({ email: "no-es-un-email", password: "minimo8car" });

    expect(res.status).toBe(400);
  });
});
