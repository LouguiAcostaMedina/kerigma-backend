import type { Request, Response } from 'express';
import type { CreateWeeklyMetricInput, ListWeeklyMetricsQuery } from '../schemas/metric.schema';
import * as metricService from '../services/metric.service';
import { ok } from '../utils/apiResponse';
import { UnauthorizedError } from '../utils/errors';

function requireChurchId(req: Request): string {
  if (!req.user?.churchId) {
    throw new UnauthorizedError('El usuario no está asociado a ninguna iglesia');
  }
  return req.user.churchId;
}

export async function createWeeklyMetric(req: Request, res: Response): Promise<void> {
  const churchId = requireChurchId(req);
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const metric = await metricService.createWeeklyMetric(churchId, req.user.id, req.body as CreateWeeklyMetricInput);
  res.status(201).json(ok(metric, 'Métrica semanal registrada exitosamente'));
}

export async function listWeeklyMetricsByGroup(req: Request, res: Response): Promise<void> {
  const churchId = requireChurchId(req);
  const metrics = await metricService.listWeeklyMetricsByGroup(
    churchId,
    req.params.groupId,
    req.query as ListWeeklyMetricsQuery,
  );
  res.status(200).json(ok(metrics));
}

export async function listWeeklyMetricsByChurch(req: Request, res: Response): Promise<void> {
  const churchId = requireChurchId(req);
  const metrics = await metricService.listWeeklyMetricsByChurch(churchId, {
    groupId: typeof req.query.groupId === 'string' ? req.query.groupId : undefined,
    from: typeof req.query.from === 'string' ? req.query.from : undefined,
    to: typeof req.query.to === 'string' ? req.query.to : undefined,
  });
  res.status(200).json(ok(metrics));
}
