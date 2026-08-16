import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateChurchInput,
  ListChurchesQuery,
  NearbyChurchesQuery,
  UpdateChurchInput,
} from '../schemas/church.schema';
import * as churchService from '../services/church.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

function resolveChurchId(user: AuthUser): string | null {
  if (isGlobalAdmin(user)) {
    return null;
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return user.churchId;
}

export async function listPublicChurches(_req: Request, res: Response): Promise<void> {
  const churches = await churchService.listPublicChurches();
  res.status(200).json(ok(churches));
}

export async function listChurches(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const query = req.query as unknown as ListChurchesQuery;
  const { churches, total } = await churchService.listChurches(churchId, query);
  res.status(200).json(paginated(churches, total, query.page, query.limit));
}

export async function createChurch(req: Request, res: Response): Promise<void> {
  const church = await churchService.createChurch(req.user!.id, req.body as CreateChurchInput);
  res.status(201).json(ok(church, 'Iglesia creada exitosamente'));
}

export async function updateChurch(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const church = await churchService.updateChurch(churchId, req.params.id, req.user!.id, req.body as UpdateChurchInput);
  res.status(200).json(ok(church, 'Iglesia actualizada exitosamente'));
}

export async function deleteChurch(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  await churchService.deleteChurch(churchId, req.params.id);
  res.status(200).json(ok(null, 'Iglesia eliminada exitosamente'));
}

export async function listNearbyChurches(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as NearbyChurchesQuery;
  const churches = await churchService.listNearbyChurches(query);
  res.status(200).json(ok(churches));
}

