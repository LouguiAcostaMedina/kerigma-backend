import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateMemberInput,
  ListMembersQuery,
  SearchMembersInput,
  UpdateMemberInput,
} from '../schemas/member.schema';
import * as memberService from '../services/member.service';
import { ok } from '../utils/apiResponse';
import { paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

type MemberScope = { churchId: string } | { churchId: null };

function resolveMemberScope(user: AuthUser): MemberScope {
  if (isGlobalAdmin(user)) {
    return { churchId: null };
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return { churchId: user.churchId };
}

export async function listMembers(req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(req.user!);
  const query = req.query as unknown as ListMembersQuery;
  const { members, total } = await memberService.listMembers(scope.churchId, query);
  res.status(200).json(paginated(members, total, query.page, query.limit));
}

export async function getMember(req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(req.user!);
  const member = await memberService.getMember(scope.churchId, req.params.id);
  res.status(200).json(ok(member));
}

export async function createMember(req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden crear miembros desde el modo global. Especifique una iglesia.');
  }
  const member = await memberService.createMember(scope.churchId, req.user!.id, req.body as CreateMemberInput);
  res.status(201).json(ok(member, 'Miembro creado exitosamente'));
}

export async function updateMember(req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(req.user!);
  const member = await memberService.updateMember(
    scope.churchId,
    req.params.id,
    req.user!.id,
    req.body as UpdateMemberInput,
  );
  res.status(200).json(ok(member, 'Miembro actualizado exitosamente'));
}

export async function deleteMember(req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(req.user!);
  await memberService.deleteMember(scope.churchId, req.params.id);
  res.status(200).json(ok(null, 'Miembro eliminado exitosamente'));
}

export async function deleteMultipleMembers(req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(req.user!);
  const { ids } = req.body as { ids: string[] };
  await memberService.deleteMultipleMembers(scope.churchId, ids);
  res.status(200).json(ok(null, `${ids.length} miembro(s) eliminado(s) correctamente`));
}

export async function getMembersStats(_req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(_req.user!);
  const stats = await memberService.getMembersStats(scope.churchId);
  res.status(200).json(ok(stats));
}

export async function updateMemberStatus(req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(req.user!);
  const { status } = req.body as { status: 'active' | 'inactive' | 'suspended' | 'transferred' | 'graduated' };
  const member = await memberService.updateMemberStatus(scope.churchId, req.params.id, status);
  res.status(200).json(ok(member, 'Estado del miembro actualizado'));
}

export async function assignToGroup(req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(req.user!);
  const { groupId } = req.body as { groupId: string };
  const member = await memberService.assignToGroup(scope.churchId, req.params.memberId, groupId);
  res.status(200).json(ok(member, 'Miembro asignado al grupo correctamente'));
}

export async function searchMembers(req: Request, res: Response): Promise<void> {
  const scope = resolveMemberScope(req.user!);
  const input = req.body as SearchMembersInput;
  const members = await memberService.searchMembers(scope.churchId, input);
  res.status(200).json(ok(members));
}
