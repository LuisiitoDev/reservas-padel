import db from "./db.js";

export interface Usuario {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export function crear(email: string, passwordHash: string): Usuario {
  const emailNormalizado = email.toLowerCase();
  const stmt = db.prepare(
    "INSERT INTO usuarios (email, password_hash) VALUES (?, ?) RETURNING *",
  );
  return stmt.get(emailNormalizado, passwordHash) as Usuario;
}

export function buscarPorEmail(email: string): Usuario | undefined {
  const emailNormalizado = email.toLowerCase();
  return db.prepare("SELECT * FROM usuarios WHERE email = ?").get(emailNormalizado) as
    | Usuario
    | undefined;
}

export function buscarPorId(id: number): Usuario | undefined {
  return db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id) as Usuario | undefined;
}
