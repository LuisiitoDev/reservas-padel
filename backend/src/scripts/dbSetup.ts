import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../../../db/padel.db");
const SCHEMA_PATH = path.resolve(__dirname, "../../../db/schema.sql");
const SEED_PATH = path.resolve(__dirname, "../../../db/seed.sql");

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.exec(readFileSync(SCHEMA_PATH, "utf-8"));
db.exec(readFileSync(SEED_PATH, "utf-8"));
db.close();

console.log(`Base de datos lista en ${DB_PATH}`);
