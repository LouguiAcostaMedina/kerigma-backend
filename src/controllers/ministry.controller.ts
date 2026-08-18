import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateMinistryInput,
  ListMinistriesQuery,
  UpdateMinistryInput,
  AssignMemberInput,
} from '../schemas/ministry.schema';
import * as ministryService from '../services/ministry.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

type ChurchScope = { churchId: string } | { churchId: null };

function resolveChurchScope(user: AuthUser): ChurchScope {
  if (isGlobalAdmin(user)) {
    return { churchId: null };
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return { churchId: user.churchId };
}

export async function listMinistries(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden listar ministerios desde el modo global');
  }
  const query = req.query as unknown as ListMinistriesQuery;
  const { ministries, total } = await ministryService.listMinistries(scope.churchId, query);
  res.status(200).json(paginated(ministries, total, query.page, query.limit));
}

export async function getMinistry(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const ministry = await ministryService.getMinistry(req.params.id);
  res.status(200).json(ok(ministry));
}

export async function createMinistry(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden crear ministerios desde el modo global. Especifique una iglesia.');
  }
  const ministry = await ministryService.createMinistry(
    scope.churchId,
    req.user!.id,
    req.body as CreateMinistryInput,
  );
  res.status(201).json(ok(ministry, 'Ministerio creado exitosamente'));
}

export async function updateMinistry(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const ministry = await ministryService.updateMinistry(
    req.params.id,
    req.body as UpdateMinistryInput,
  );
  res.status(200).json(ok(ministry, 'Ministerio actualizado exitosamente'));
}

export async function deleteMinistry(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  await ministryService.deleteMinistry(req.params.id);
  res.status(200).json(ok(null, 'Ministerio eliminado exitosamente'));
}

export async function assignMember(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden asignar miembros desde el modo global.');
  }
  const body = req.body as AssignMemberInput;
  const assignment = await ministryService.assignMember(
    req.params.id,
    body.memberId,
    body.role,
    req.user!.id,
  );
  res.status(201).json(ok(assignment, 'Miembro asignado exitosamente'));
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  await ministryService.removeAssignment(req.params.assignmentId);
  res.status(200).json(ok(null, 'Miembro removido exitosamente'));
}

export async function listAssignments(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const assignments = await ministryService.listAssignments(req.params.id);
  res.status(200).json(ok(assignments));
}
