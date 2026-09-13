import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../services/errors.js";

function esErrorDeJsonMalformado(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    "type" in err &&
    (err as { type?: string }).type === "entity.parse.failed"
  );
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  if (esErrorDeJsonMalformado(err)) {
    res.status(400).json({ error: { message: "El cuerpo de la petición no es JSON válido." } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Ocurrió un error inesperado. Intenta de nuevo." } });
}
