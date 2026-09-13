import { z } from "zod";
import { BadRequestError } from "../errors.js";

export const credencialesSchema = z.object({
  email: z
    .string({ required_error: "El correo electrónico es obligatorio." })
    .trim()
    .email("Correo electrónico inválido."),
  password: z
    .string({ required_error: "La contraseña es obligatoria." })
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export type CredencialesInput = z.infer<typeof credencialesSchema>;

export function parseCredenciales(data: unknown): CredencialesInput {
  const resultado = credencialesSchema.safeParse(data);
  if (!resultado.success) {
    throw new BadRequestError(resultado.error.issues[0]?.message ?? "Datos inválidos.");
  }
  return resultado.data;
}
