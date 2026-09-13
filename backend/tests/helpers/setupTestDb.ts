import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(__dirname, "../../../db/schema.sql");
const SEED_PATH = path.resolve(__dirname, "../../../db/seed.sql");
const TMP_DIR = path.resolve(__dirname, "../tmp");

export function crearDbDePrueba(nombreArchivo: string): string {
  mkdirSync(TMP_DIR, { recursive: true });
  const dbPath = path.resolve(TMP_DIR, nombreArchivo);
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const p = dbPath + suffix;
    if (existsSync(p)) unlinkSync(p);
  }
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.exec(readFileSync(SCHEMA_PATH, "utf-8"));
  db.exec(readFileSync(SEED_PATH, "utf-8"));
  db.close();
  return dbPath;
}
