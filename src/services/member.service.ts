import { Op, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { Member } from '../models/Member.model';
import type {
  CreateMemberInput,
  ListMembersQuery,
  UpdateMemberInput,
} from '../schemas/member.schema';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface MemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Member['gender'];
  maritalStatus: Member['maritalStatus'];
  address: string | null;
  city: string | null;
  district: string | null;
  groupId: string;
  groupName: string | null;
  churchId: string | null;
  baptized: boolean;
  baptismDate: string | null;
  conversionDate: string | null;
  spiritualStatus: Member['spiritualStatus'];
  joinDate: string;
  status: Member['status'];
  attendanceScore: number | null;
  occupation: string | null;
  education: Member['education'];
  emergencyContact: Record<string, unknown> | null;
  isActive: boolean;
  notes: string | null;
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembersPaginatedResult {
  members: MemberSummary[];
  total: number;
}

function toMemberSummary(member: Member): MemberSummary {
  const group = member.group as { id: string; name: string; churchId: string } | undefined;
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    dateOfBirth: member.dateOfBirth,
    gender: member.gender,
    maritalStatus: member.maritalStatus,
    address: member.address,
    city: member.city,
    district: member.district,
    groupId: member.groupId,
    groupName: group?.name ?? null,
    churchId: group?.churchId ?? null,
    baptized: member.baptized,
    baptismDate: member.baptismDate,
    conversionDate: member.conversionDate,
    spiritualStatus: member.spiritualStatus,
    joinDate: member.joinDate,
    status: member.status,
    attendanceScore: member.attendanceScore,
    occupation: member.occupation,
    education: member.education,
    emergencyContact: member.emergencyContact,
    isActive: member.isActive,
    notes: member.notes,
    tags: member.tags,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

const GROUP_ATTRIBUTES = ['id', 'name', 'churchId'];

function buildGroupInclude(filters: { churchId?: string | null; groupId?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.churchId) {
    where.churchId = filters.churchId;
  }
  if (filters.groupId) {
    where.id = filters.groupId;
  }
  return {
    model: db.Group,
    as: 'group',
    attributes: GROUP_ATTRIBUTES,
    ...(Object.keys(where).length > 0 ? { where } : {}),
  };
}

export async function listMembers(
  churchId: string | null,
  query: ListMembersQuery,
): Promise<MembersPaginatedResult> {
  const { page, limit, search, status, sortBy, sortOrder, group: groupFilter } = query;

  const memberWhere: WhereOptions = {};
  if (search) {
    const term = `%${search}%`;
    (memberWhere as Record<string | symbol, unknown>)[Op.or] = [
      { firstName: { [Op.iLike]: term } },
      { lastName: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
      { phone: { [Op.iLike]: term } },
    ];
  }
  if (status) {
    memberWhere.status = status;
  }

  const filters = {
    churchId: churchId ?? undefined,
    groupId: groupFilter,
  };

  const groupInclude = buildGroupInclude(filters);

  const { rows, count } = await db.Member.findAndCountAll({
    where: memberWhere,
    include: [groupInclude],
    order: [[sortBy as string, sortOrder]],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  return {
    members: rows.map(toMemberSummary),
    total: count,
  };
}

export async function getMember(churchId: string | null, memberId: string): Promise<MemberSummary> {
  const member = await db.Member.findByPk(memberId, {
    include: [buildGroupInclude({ churchId: churchId ?? undefined })],
  });

  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }

  if (churchId) {
    const group = member.group as { churchId: string } | undefined;
    if (!group || group.churchId !== churchId) {
      throw new NotFoundError('Miembro no encontrado');
    }
  }

  return toMemberSummary(member);
}

export async function createMember(
  churchId: string,
  _actorId: string,
  input: CreateMemberInput,
): Promise<MemberSummary> {
  const group = await db.Group.findOne({ where: { id: input.groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  const member = await db.Member.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    gender: input.gender ?? null,
    maritalStatus: input.maritalStatus ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    district: input.district ?? null,
    groupId: input.groupId,
    baptized: input.baptized ?? false,
    baptismDate: input.baptismDate ?? null,
    conversionDate: input.conversionDate ?? null,
    spiritualStatus: input.spiritualStatus ?? 'visitor',
    joinDate: input.joinDate ?? new Date().toISOString().slice(0, 10),
    status: input.status ?? 'active',
    occupation: input.occupation ?? null,
    education: input.education ?? null,
    emergencyContact: input.emergencyContact ?? null,
    isActive: true,
    notes: input.notes ?? null,
    tags: input.tags ?? [],
  });

  return getMember(churchId, member.id);
}

export async function updateMember(
  churchId: string | null,
  memberId: string,
  _actorId: string,
  input: UpdateMemberInput,
): Promise<MemberSummary> {
  const existing = await db.Member.findByPk(memberId, {
    include: [buildGroupInclude({ churchId: churchId ?? undefined })],
  });
  if (!existing) {
    throw new NotFoundError('Miembro no encontrado');
  }
  if (churchId) {
    const group = existing.group as { churchId: string } | undefined;
    if (!group || group.churchId !== churchId) {
      throw new NotFoundError('Miembro no encontrado');
    }
  }

  if (input.groupId) {
    const targetGroup = await db.Group.findByPk(input.groupId);
    if (!targetGroup) {
      throw new NotFoundError('Grupo no encontrado');
    }
    if (churchId && targetGroup.churchId !== churchId) {
      throw new ValidationError('El grupo no pertenece a su iglesia');
    }
  }

  await existing.update({
    firstName: input.firstName ?? existing.firstName,
    lastName: input.lastName ?? existing.lastName,
    email: input.email !== undefined ? input.email : existing.email,
    phone: input.phone !== undefined ? input.phone : existing.phone,
    dateOfBirth: input.dateOfBirth !== undefined ? input.dateOfBirth : existing.dateOfBirth,
    gender: input.gender !== undefined ? input.gender : existing.gender,
    maritalStatus: input.maritalStatus !== undefined ? input.maritalStatus : existing.maritalStatus,
    address: input.address !== undefined ? input.address : existing.address,
    city: input.city !== undefined ? input.city : existing.city,
    district: input.district !== undefined ? input.district : existing.district,
    groupId: input.groupId ?? existing.groupId,
    baptized: input.baptized ?? existing.baptized,
    baptismDate: input.baptismDate !== undefined ? input.baptismDate : existing.baptismDate,
    conversionDate: input.conversionDate !== undefined ? input.conversionDate : existing.conversionDate,
    spiritualStatus: input.spiritualStatus ?? existing.spiritualStatus,
    joinDate: input.joinDate ?? existing.joinDate,
    status: input.status ?? existing.status,
    occupation: input.occupation !== undefined ? input.occupation : existing.occupation,
    education: input.education !== undefined ? input.education : existing.education,
    emergencyContact: input.emergencyContact !== undefined ? input.emergencyContact : existing.emergencyContact,
    notes: input.notes !== undefined ? input.notes : existing.notes,
    tags: input.tags !== undefined ? input.tags : existing.tags,
  });

  return getMember(churchId, memberId);
}

export async function deleteMember(churchId: string | null, memberId: string): Promise<void> {
  const member = await db.Member.findByPk(memberId, {
    include: [buildGroupInclude({ churchId: churchId ?? undefined })],
  });
  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }
  if (churchId) {
    const group = member.group as { churchId: string } | undefined;
    if (!group || group.churchId !== churchId) {
      throw new NotFoundError('Miembro no encontrado');
    }
  }
  await member.destroy();
}

export async function updateMemberStatus(
  churchId: string | null,
  memberId: string,
  status: Member['status'],
): Promise<MemberSummary> {
  const member = await db.Member.findByPk(memberId, {
    include: [buildGroupInclude({ churchId: churchId ?? undefined })],
  });
  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }
  if (churchId) {
    const group = member.group as { churchId: string } | undefined;
    if (!group || group.churchId !== churchId) {
      throw new NotFoundError('Miembro no encontrado');
    }
  }

  await member.update({
    status,
    isActive: status === 'active',
  });

  return getMember(churchId, memberId);
}

export async function assignToGroup(
  churchId: string | null,
  memberId: string,
  groupId: string,
): Promise<MemberSummary> {
  const member = await db.Member.findByPk(memberId, {
    include: [buildGroupInclude({ churchId: churchId ?? undefined })],
  });
  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }
  if (churchId) {
    const memberGroup = member.group as { churchId: string } | undefined;
    if (!memberGroup || memberGroup.churchId !== churchId) {
      throw new NotFoundError('Miembro no encontrado');
    }
  }

  const targetGroup = await db.Group.findByPk(groupId);
  if (!targetGroup) {
    throw new NotFoundError('Grupo no encontrado');
  }
  if (churchId && targetGroup.churchId !== churchId) {
    throw new ValidationError('El grupo no pertenece a su iglesia');
  }

  await member.update({ groupId });

  return getMember(churchId, memberId);
}

