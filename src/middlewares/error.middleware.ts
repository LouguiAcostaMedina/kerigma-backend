import type { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/apiResponse';
import { isAppError } from '../utils/errors';
import logger from '../utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(fail('NOT_FOUND', `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (isAppError(error)) {
    res.status(error.statusCode).json(fail(error.code, error.message, error.details));
    return;
  }

  const message = error instanceof Error ? error.message : 'Error desconocido';
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error(`Error no controlado en ${req.method} ${req.originalUrl}`, { message, stack });

  res.status(500).json(fail('INTERNAL_SERVER_ERROR', 'Error interno del servidor'));
}
