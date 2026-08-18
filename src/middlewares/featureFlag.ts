import type { NextFunction, Request, Response } from 'express';
import { FeatureFlag } from '../models/FeatureFlag.model';
import { ForbiddenError } from '../utils/errors';

export function requireFeatureFlag(flagName: string) {
  return async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const flag = await FeatureFlag.findOne({ where: { name: flagName } });
    if (!flag || !flag.isEnabled) {
      throw new ForbiddenError(`El módulo "${flagName}" no está habilitado para esta iglesia`);
    }
    next();
  };
}
