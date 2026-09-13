import type { Express } from "express";
import { crearDbDePrueba } from "./setupTestDb.js";

export async function crearAppDePrueba(nombreDb: string): Promise<Express> {
  process.env.PADEL_DB_PATH = crearDbDePrueba(nombreDb);
  const { crearApp } = await import("../../src/app.js");
  return crearApp();
}

export async function crearAppDePruebaConRutaDb(
  nombreDb: string,
): Promise<{ app: Express; dbPath: string }> {
  const dbPath = crearDbDePrueba(nombreDb);
  process.env.PADEL_DB_PATH = dbPath;
  const { crearApp } = await import("../../src/app.js");
  return { app: crearApp(), dbPath };
}
