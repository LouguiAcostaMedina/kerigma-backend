import type { Request, Response } from 'express';
import type {
  CreateGroupInput,
  UpdateGroupInput,
} from '../schemas/group.schema';
import * as groupService from '../services/group.service';
import { ok } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

function resolveChurchId(req: Request): string | null {
  if (isGlobalAdmin(req.user!)) {
    return null;
  }
  if (!req.user?.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return req.user.churchId;
}

export async function listGroups(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req);
  const groups = churchId
    ? await groupService.listGroups(churchId)
    : await groupService.listAllGroups();
  res.status(200).json(ok(groups));
}

export async function getGroup(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req);
  if (churchId) {
    const group = await groupService.getGroup(churchId, req.params.id);
    res.status(200).json(ok(group));
    return;
  }
  const group = await groupService.getGroupAnyChurch(req.params.id);
  res.status(200).json(ok(group));
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req);
  if (!churchId) {
    throw new ForbiddenError('No se pueden crear grupos desde el modo global. Especifique una iglesia.');
  }
  const group = await groupService.createGroup(churchId, req.user!.id, req.body as CreateGroupInput);
  res.status(201).json(ok(group, 'Grupo creado exitosamente'));
}

export async function updateGroup(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req);
  if (!churchId) {
    throw new ForbiddenError('No se pueden editar grupos desde el modo global. Especifique una iglesia.');
  }
  const group = await groupService.updateGroup(churchId, req.params.id, req.user!.id, req.body as UpdateGroupInput);
  res.status(200).json(ok(group, 'Grupo actualizado exitosamente'));
}

