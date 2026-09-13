import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { crearAppDePrueba } from "../helpers/testApp.js";

let app: Express;

beforeAll(async () => {
  app = await crearAppDePrueba("canchas-list.db");
});

describe("GET /api/canchas", () => {
  it("es público (sin sesión) y devuelve exactamente 5 canchas en orden fijo", async () => {
    const res = await request(app).get("/api/canchas");

    expect(res.status).toBe(200);
    expect(res.body.canchas).toHaveLength(5);
    expect(res.body.canchas.map((c: { nombre: string }) => c.nombre)).toEqual([
      "Cancha Laureles",
      "Cancha El Poblado",
      "Cancha Belén",
      "Cancha Robledo",
      "Cancha Envigado",
    ]);
  });
});
