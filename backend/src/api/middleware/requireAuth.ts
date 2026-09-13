import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.usuarioId) {
    res.status(401).json({ error: { message: "Debes iniciar sesión para continuar." } });
    return;
  }
  next();
}
