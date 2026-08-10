import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { ok } from '../utils/apiResponse';
import { ForbiddenError } from '../utils/errors';
import { isGlobalAdmin } from '../utils/roles';

function resolveDashboardScope(req: Request): string | null {
  const user = req.user;
  if (!user) {
    throw new ForbiddenError('No autorizado');
  }
  if (isGlobalAdmin(user)) {
    return null;
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return user.churchId;
}

export async function getSpiritualHealth(req: Request, res: Response): Promise<void> {
  const churchId = resolveDashboardScope(req);
  const data = churchId
    ? await dashboardService.getSpiritualHealth(churchId)
    : await dashboardService.getGlobalSpiritualHealth();
  res.status(200).json(ok(data));
}

export async function getDashboardKpis(req: Request, res: Response): Promise<void> {
  const churchId = resolveDashboardScope(req);
  const data = churchId
    ? await dashboardService.getDashboardKpis(churchId)
    : await dashboardService.getGlobalDashboardKpis();
  res.status(200).json(ok(data));
}
