import Database from "better-sqlite3";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../../../db/padel.db");
const SCHEMA_PATH = path.resolve(__dirname, "../../../db/schema.sql");
const SEED_PATH = path.resolve(__dirname, "../../../db/seed.sql");

for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  const p = DB_PATH + suffix;
  if (existsSync(p)) unlinkSync(p);
}

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.exec(readFileSync(SCHEMA_PATH, "utf-8"));
db.exec(readFileSync(SEED_PATH, "utf-8"));
db.close();

console.log(`Base de datos reiniciada en ${DB_PATH}`);
