import session from "express-session";
import connectSqlite3 from "connect-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLiteStore = connectSqlite3(session);

const UN_DIA_MS = 24 * 60 * 60 * 1000;

declare module "express-session" {
  interface SessionData {
    usuarioId: number;
  }
}

function resolverArchivoDb(): { dir: string; db: string } {
  const override = process.env.PADEL_DB_PATH;
  if (override) {
    return { dir: path.dirname(override), db: path.basename(override) };
  }
  return { dir: path.resolve(__dirname, "../../../db"), db: "padel.db" };
}

export function crearMiddlewareSesion() {
  const { dir, db } = resolverArchivoDb();
  return session({
    store: new SQLiteStore({
      db,
      dir,
      table: "sessions",
    }),
    secret: process.env.SESSION_SECRET ?? "padel-dev-secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: UN_DIA_MS,
    },
  });
}
