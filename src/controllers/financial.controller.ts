import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateContributionInput,
  ListContributionsQuery,
} from '../schemas/financial.schema';
import * as financialService from '../services/financial.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

function resolveChurchId(user: AuthUser): string {
  if (isGlobalAdmin(user)) {
    throw new ForbiddenError('Los administradores globales no pueden gestionar contribuciones financieras directamente');
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return user.churchId;
}

export async function createContribution(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const result = await financialService.createContribution(churchId, req.user!.id, req.body as CreateContributionInput);
  res.status(201).json(ok(result, 'Contribución registrada correctamente'));
}

export async function listContributions(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const query = req.query as unknown as ListContributionsQuery;
  const { contributions, total, page } = await financialService.listContributions(churchId, query);
  res.status(200).json(paginated(contributions, total, page, query.limit));
}

export async function getContributionById(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const result = await financialService.getContributionById(churchId, req.params.id);
  res.status(200).json(ok(result));
}

export async function deleteContribution(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  await financialService.deleteContribution(churchId, req.params.id);
  res.status(200).json(ok(null, 'Contribución eliminada correctamente'));
}

export async function getSummaryByCategory(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const { period, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
  const result = await financialService.getSummaryByCategory(churchId, { period, dateFrom, dateTo });
  res.status(200).json(ok(result));
}

export async function getSummaryByPeriod(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const { dateFrom, dateTo } = req.query as Record<string, string | undefined>;
  const result = await financialService.getSummaryByPeriod(churchId, { dateFrom, dateTo });
  res.status(200).json(ok(result));
}

export async function getMemberHistory(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const result = await financialService.getMemberHistory(churchId, req.params.memberId);
  res.status(200).json(ok(result));
}
