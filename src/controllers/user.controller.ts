import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  BulkOperationInput,
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from '../schemas/user.schema';
import * as userService from '../services/user.service';
import { ok } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';
import { CATALOGS, toEntries } from '../catalogs/catalog';

function assertCanManageUsers(user: AuthUser): void {
  const isManager =
    isGlobalAdmin(user) || user.role === 'admin' || user.role === 'director' || user.role === 'super_admin';
  if (!isManager) {
    throw new ForbiddenError('No tiene permisos para administrar usuarios');
  }
}

export async function listRoles(_req: Request, res: Response): Promise<void> {
  res.status(200).json(
    ok({
      values: CATALOGS.roles.values,
      entries: toEntries(CATALOGS.roles),
      labels: CATALOGS.roles.labels,
    }),
  );
}

function resolveChurchId(user: AuthUser): string | null {
  if (isGlobalAdmin(user)) {
    return null;
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return user.churchId;
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  assertCanManageUsers(req.user!);
  const churchId = resolveChurchId(req.user!);
  const query = req.query as unknown as ListUsersQuery;
  const result = await userService.listUsers(churchId, query);
  res.status(200).json(ok(result));
}

export async function createUser(req: Request, res: Response): Promise<void> {
  assertCanManageUsers(req.user!);
  const user = await userService.createUser(req.user!.id, req.body as CreateUserInput);
  res.status(201).json(ok(user, 'Usuario creado exitosamente'));
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  assertCanManageUsers(req.user!);
  const churchId = resolveChurchId(req.user!);
  const user = await userService.updateUser(churchId, req.params.id, req.user!.id, req.body as UpdateUserInput);
  res.status(200).json(ok(user, 'Usuario actualizado exitosamente'));
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  assertCanManageUsers(req.user!);
  const churchId = resolveChurchId(req.user!);
  await userService.deleteUser(churchId, req.params.id);
  res.status(200).json(ok(null, 'Usuario eliminado exitosamente'));
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  assertCanManageUsers(req.user!);
  const churchId = resolveChurchId(req.user!);
  const status = (req.body as { status: 'active' | 'inactive' | 'suspended' | 'pending' }).status;
  const user = await userService.updateUserStatus(churchId, req.params.id, status);
  res.status(200).json(ok(user, 'Estado del usuario actualizado'));
}

export async function bulkOperation(req: Request, res: Response): Promise<void> {
  assertCanManageUsers(req.user!);
  const churchId = resolveChurchId(req.user!);
  const { operation, userIds } = req.body as BulkOperationInput;
  await userService.bulkOperation(churchId, operation, userIds);
  res.status(200).json(ok(null, `Operación en lote completada para ${userIds.length} usuario(s)`));
}

export async function inviteUser(req: Request, res: Response): Promise<void> {
  assertCanManageUsers(req.user!);
  await userService.inviteUser(req.user!.id, req.params.id);
  res.status(200).json(ok(null, 'Invitación enviada exitosamente'));
}

export async function resetUserPassword(req: Request, res: Response): Promise<void> {
  assertCanManageUsers(req.user!);
  await userService.resetUserPassword(req.params.id);
  res.status(200).json(ok(null, 'Email de recuperación enviado exitosamente'));
}
