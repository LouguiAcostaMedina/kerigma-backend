import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { isGlobalAdmin } from '../utils/roles';

type ChurchIdResolver = (req: Request) => string | undefined;

export function scopeByChurch(getChurchId?: ChurchIdResolver) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    // SuperAdmin global: acceso a cualquier iglesia (o sin iglesia asignada).
    if (isGlobalAdmin(req.user)) {
      req.requestId = undefined;
      next();
      return;
    }

    const userChurchId = req.user.churchId;
    if (!userChurchId) {
      next(new ForbiddenError('El usuario no está asociado a ninguna iglesia'));
      return;
    }

    const targetChurchId = getChurchId ? getChurchId(req) : undefined;

    if (targetChurchId !== undefined && targetChurchId !== userChurchId) {
      next(new ForbiddenError('No tiene permisos para acceder a los datos de otra iglesia'));
      return;
    }

    req.requestId = userChurchId;
    next();
  };
}
