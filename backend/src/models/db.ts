import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.PADEL_DB_PATH ?? path.resolve(__dirname, "../../../db/padel.db");

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
// WAL: la tabla de sesiones (connect-sqlite3, driver async) escribe en el mismo
// archivo que esta conexión (better-sqlite3, síncrona). El modo journal por
// defecto ("delete") produce colisiones intermitentes de E/S entre ambos
// drivers; WAL soporta lectores/escritores concurrentes sobre el mismo archivo.
db.pragma("journal_mode = WAL");

export default db;
