import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import * as baptismPipelineService from '../services/baptismPipeline.service';
import { ok } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

type Scope = { churchId: string } | { churchId: null };

function resolveScope(user: AuthUser): Scope {
  if (isGlobalAdmin(user)) return { churchId: null };
  if (!user.churchId) throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  return { churchId: user.churchId };
}

export async function getPipelineMetrics(req: Request, res: Response): Promise<void> {
  const scope = resolveScope(req.user!);
  const metrics = await baptismPipelineService.getPipelineMetrics(scope.churchId as string);
  res.status(200).json(ok(metrics));
}

export async function getLessonCompletionStats(req: Request, res: Response): Promise<void> {
  const scope = resolveScope(req.user!);
  const stats = await baptismPipelineService.getLessonCompletionStats(scope.churchId as string);
  res.status(200).json(ok(stats));
}
