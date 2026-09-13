import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;
let agentUno: ReturnType<typeof request.agent>;
let agentDos: ReturnType<typeof request.agent>;

beforeAll(async () => {
  app = await crearAppDePrueba("reservas-mias.db");

  agentUno = request.agent(app);
  await agentUno
    .post("/api/auth/registro")
    .send({ email: "mias-uno@example.com", password: "minimo8car" });
  await agentUno.post("/api/reservas").send({ canchaId: 1, fecha: "2027-05-10", horaInicio: 10 });

  agentDos = request.agent(app);
  await agentDos
    .post("/api/auth/registro")
    .send({ email: "mias-dos@example.com", password: "minimo8car" });
  await agentDos.post("/api/reservas").send({ canchaId: 2, fecha: "2027-05-11", horaInicio: 11 });
});

describe("GET /api/reservas/mias", () => {
  it("ambito=futuras devuelve solo reservas activas vigentes con cancelable=true", async () => {
    const res = await agentUno.get("/api/reservas/mias?ambito=futuras");

    expect(res.status).toBe(200);
    expect(res.body.reservas).toHaveLength(1);
    expect(res.body.reservas[0]).toMatchObject({
      canchaId: 1,
      fecha: "2027-05-10",
      horaInicio: 10,
      cancelable: true,
    });
  });

  it("ambito=pasadas nunca marca cancelable=true", async () => {
    const res = await agentUno.get("/api/reservas/mias?ambito=pasadas");

    expect(res.status).toBe(200);
    for (const reserva of res.body.reservas) {
      expect(reserva.cancelable).not.toBe(true);
    }
  });

  it("responde 400 con ambito inválido", async () => {
    const res = await agentUno.get("/api/reservas/mias?ambito=todas");
    expect(res.status).toBe(400);
  });

  it("nunca expone reservas de otro usuario", async () => {
    const res = await agentDos.get("/api/reservas/mias?ambito=futuras");

    expect(res.status).toBe(200);
    expect(res.body.reservas.every((r: { canchaId: number }) => r.canchaId !== 1)).toBe(true);
    expect(res.body.reservas.some((r: { canchaId: number }) => r.canchaId === 2)).toBe(true);
  });
});
