import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateActivityInput,
  ListActivitiesQuery,
  UpdateActivityInput,
} from '../schemas/activity.schema';
import * as activityService from '../services/activity.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

type ActivityScope = { churchId: string } | { churchId: null };

function resolveActivityScope(user: AuthUser): ActivityScope {
  if (isGlobalAdmin(user)) {
    return { churchId: null };
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return { churchId: user.churchId };
}

export async function listActivities(req: Request, res: Response): Promise<void> {
  const scope = resolveActivityScope(req.user!);
  const query = req.query as unknown as ListActivitiesQuery;
  const { activities, total } = await activityService.listActivities(scope.churchId, query);
  res.status(200).json(paginated(activities, total, query.page, query.limit));
}

export async function getActivity(req: Request, res: Response): Promise<void> {
  const scope = resolveActivityScope(req.user!);
  const activity = await activityService.getActivity(scope.churchId, req.params.id);
  res.status(200).json(ok(activity));
}

export async function createActivity(req: Request, res: Response): Promise<void> {
  const scope = resolveActivityScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden crear actividades desde el modo global. Especifique una iglesia.');
  }
  const activity = await activityService.createActivity(
    scope.churchId,
    req.user!.id,
    req.body as CreateActivityInput,
  );
  res.status(201).json(ok(activity, 'Actividad creada exitosamente'));
}

export async function updateActivity(req: Request, res: Response): Promise<void> {
  const scope = resolveActivityScope(req.user!);
  const activity = await activityService.updateActivity(
    scope.churchId,
    req.params.id,
    req.user!.id,
    req.body as UpdateActivityInput,
  );
  res.status(200).json(ok(activity, 'Actividad actualizada exitosamente'));
}

export async function deleteActivity(req: Request, res: Response): Promise<void> {
  const scope = resolveActivityScope(req.user!);
  await activityService.deleteActivity(scope.churchId, req.params.id, req.user!.id);
  res.status(200).json(ok(null, 'Actividad eliminada exitosamente'));
}
