import { isValid, parseISO } from "date-fns";
import { z } from "zod";
import { BadRequestError } from "../errors.js";

export const fechaSchema = z
  .string({ required_error: "La fecha es obligatoria." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD.")
  .refine((valor) => isValid(parseISO(valor)), "La fecha no es válida.");

export const crearReservaSchema = z.object({
  canchaId: z.number({ required_error: "canchaId es obligatorio." }).int().positive("canchaId inválido."),
  fecha: fechaSchema,
  horaInicio: z
    .number({ required_error: "horaInicio es obligatorio." })
    .int()
    .min(0)
    .max(23, "horaInicio debe estar entre 0 y 23."),
});

export const ambitoSchema = z.enum(["futuras", "pasadas"], {
  errorMap: () => ({ message: "ambito debe ser 'futuras' o 'pasadas'." }),
});

export function parseCrearReserva(data: unknown) {
  const resultado = crearReservaSchema.safeParse(data);
  if (!resultado.success) {
    throw new BadRequestError(resultado.error.issues[0]?.message ?? "Datos inválidos.");
  }
  return resultado.data;
}

export function parseFechaQuery(fecha: unknown): string {
  const resultado = fechaSchema.safeParse(fecha);
  if (!resultado.success) {
    throw new BadRequestError(resultado.error.issues[0]?.message ?? "Fecha inválida.");
  }
  return resultado.data;
}

export function parseAmbito(ambito: unknown): "futuras" | "pasadas" {
  const resultado = ambitoSchema.safeParse(ambito);
  if (!resultado.success) {
    throw new BadRequestError(resultado.error.issues[0]?.message ?? "ambito inválido.");
  }
  return resultado.data;
}
