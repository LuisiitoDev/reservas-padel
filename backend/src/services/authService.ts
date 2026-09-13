import bcrypt from "bcrypt";
import * as usuarioModel from "../models/usuarioModel.js";
import type { Usuario } from "../models/usuarioModel.js";
import { ConflictError, UnauthorizedError } from "./errors.js";

const COSTO_BCRYPT = 11;
const MENSAJE_CREDENCIALES_INVALIDAS = "correo o contraseña incorrectos";

export interface UsuarioPublico {
  id: number;
  email: string;
}

function aPublico(usuario: Usuario): UsuarioPublico {
  return { id: usuario.id, email: usuario.email };
}

export async function registrar(email: string, password: string): Promise<UsuarioPublico> {
  const emailNormalizado = email.toLowerCase();
  if (usuarioModel.buscarPorEmail(emailNormalizado)) {
    throw new ConflictError("Ese correo electrónico ya está registrado.");
  }

  const passwordHash = await bcrypt.hash(password, COSTO_BCRYPT);
  const usuario = usuarioModel.crear(emailNormalizado, passwordHash);
  return aPublico(usuario);
}

export async function login(email: string, password: string): Promise<UsuarioPublico> {
  const usuario = usuarioModel.buscarPorEmail(email.toLowerCase());
  if (!usuario) {
    throw new UnauthorizedError(MENSAJE_CREDENCIALES_INVALIDAS);
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    throw new UnauthorizedError(MENSAJE_CREDENCIALES_INVALIDAS);
  }

  return aPublico(usuario);
}
