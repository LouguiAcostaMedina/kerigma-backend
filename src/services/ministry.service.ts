import { Op, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { Ministry, MinistryAssignment } from '../models/Ministry.model';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface MinistrySummary {
  id: string;
  churchId: string;
  name: string;
  description: string | null;
  category: string;
  leaderId: string | null;
  leaderName: string | null;
  meetingSchedule: string | null;
  isActive: boolean;
  assignmentCount: number;
  createdBy: string | null;
  createdAt: Date;
}

export interface MinistryAssignmentSummary {
  id: string;
  ministryId: string;
  memberId: string;
  memberName: string;
  role: string;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
}

export interface MinistriesPaginatedResult {
  ministries: MinistrySummary[];
  total: number;
}

export interface ListMinistriesQuery {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export interface CreateMinistryInput {
  name: string;
  description?: string;
  category: string;
  leaderId?: string;
  meetingSchedule?: string;
}

export interface UpdateMinistryInput {
  name?: string;
  description?: string | null;
  category?: string;
  leaderId?: string | null;
  meetingSchedule?: string | null;
  isActive?: boolean;
}

function toMinistrySummary(ministry: Ministry, assignmentCount: number): MinistrySummary {
  const leader = ministry.leader as { firstName: string; lastName: string } | undefined;
  return {
    id: ministry.id,
    churchId: ministry.churchId,
    name: ministry.name,
    description: ministry.description,
    category: ministry.category,
    leaderId: ministry.leaderId,
    leaderName: leader ? `${leader.firstName} ${leader.lastName}` : null,
    meetingSchedule: ministry.meetingSchedule,
    isActive: ministry.isActive,
    assignmentCount,
    createdBy: ministry.createdBy,
    createdAt: ministry.createdAt,
  };
}

function toAssignmentSummary(assignment: MinistryAssignment): MinistryAssignmentSummary {
  const member = assignment.member as { firstName: string; lastName: string } | undefined;
  return {
    id: assignment.id,
    ministryId: assignment.ministryId,
    memberId: assignment.memberId,
    memberName: member ? `${member.firstName} ${member.lastName}` : 'Desconocido',
    role: assignment.role,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
    notes: assignment.notes,
    isActive: assignment.isActive,
    createdBy: assignment.createdBy,
    createdAt: assignment.createdAt,
  };
}

const MINISTRY_INCLUDES = [
  { model: db.User, as: 'leader', attributes: ['id', 'firstName', 'lastName'] },
];

export async function listMinistries(
  churchId: string,
  query: ListMinistriesQuery,
): Promise<MinistriesPaginatedResult> {
  const { page, limit, search, category } = query;

  const where: WhereOptions = { churchId };
  if (category) {
    (where as Record<string, unknown>).category = category;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { name: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await db.Ministry.findAndCountAll({
    where,
    include: MINISTRY_INCLUDES,
    order: [['name', 'ASC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  const ministries = await Promise.all(
    rows.map(async (m) => {
      const assignmentCount = await db.MinistryAssignment.count({
        where: { ministryId: m.id, isActive: true },
      });
      return toMinistrySummary(m, assignmentCount);
    }),
  );

  return { ministries, total: count };
}

export async function getMinistry(id: string): Promise<MinistrySummary> {
  const ministry = await db.Ministry.findByPk(id, { include: MINISTRY_INCLUDES });
  if (!ministry) {
    throw new NotFoundError('Ministerio no encontrado');
  }
  const assignmentCount = await db.MinistryAssignment.count({
    where: { ministryId: id, isActive: true },
  });
  return toMinistrySummary(ministry, assignmentCount);
}

export async function createMinistry(
  churchId: string,
  userId: string,
  input: CreateMinistryInput,
): Promise<MinistrySummary> {
  if (input.leaderId) {
    const leader = await db.User.findOne({ where: { id: input.leaderId, churchId } });
    if (!leader) {
      throw new NotFoundError('El líder indicado no pertenece a su iglesia');
    }
  }

  const ministry = await db.Ministry.create({
    churchId,
    name: input.name,
    description: input.description ?? null,
    category: input.category,
    leaderId: input.leaderId ?? null,
    meetingSchedule: input.meetingSchedule ?? null,
    isActive: true,
    createdBy: userId,
  });

  return getMinistry(ministry.id);
}

export async function updateMinistry(
  id: string,
  input: UpdateMinistryInput,
): Promise<MinistrySummary> {
  const ministry = await db.Ministry.findByPk(id);
  if (!ministry) {
    throw new NotFoundError('Ministerio no encontrado');
  }

  if (input.leaderId) {
    const leader = await db.User.findOne({ where: { id: input.leaderId, churchId: ministry.churchId } });
    if (!leader) {
      throw new NotFoundError('El líder indicado no pertenece a la iglesia del ministerio');
    }
  }

  await ministry.update({
    name: input.name ?? ministry.name,
    description: input.description !== undefined ? input.description : ministry.description,
    category: input.category ?? ministry.category,
    leaderId: input.leaderId !== undefined ? input.leaderId : ministry.leaderId,
    meetingSchedule: input.meetingSchedule !== undefined ? input.meetingSchedule : ministry.meetingSchedule,
    isActive: input.isActive ?? ministry.isActive,
  });

  return getMinistry(id);
}

export async function deleteMinistry(id: string): Promise<void> {
  const ministry = await db.Ministry.findByPk(id);
  if (!ministry) {
    throw new NotFoundError('Ministerio no encontrado');
  }
  const assignmentCount = await db.MinistryAssignment.count({
    where: { ministryId: id, isActive: true },
  });
  if (assignmentCount > 0) {
    throw new ValidationError('No se puede eliminar un ministerio que tiene asignaciones activas');
  }
  await ministry.destroy();
}

export async function assignMember(
  ministryId: string,
  memberId: string,
  role: string,
  userId: string,
): Promise<MinistryAssignmentSummary> {
  const ministry = await db.Ministry.findByPk(ministryId);
  if (!ministry) {
    throw new NotFoundError('Ministerio no encontrado');
  }

  const member = await db.Member.findByPk(memberId);
  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }

  const existing = await db.MinistryAssignment.findOne({
    where: { ministryId, memberId, isActive: true },
  });
  if (existing) {
    throw new ValidationError('El miembro ya está asignado a este ministerio');
  }

  const assignment = await db.MinistryAssignment.create({
    ministryId,
    memberId,
    role,
    startDate: new Date(),
    isActive: true,
    createdBy: userId,
  });

  const full = await db.MinistryAssignment.findByPk(assignment.id, {
    include: [{ model: db.Member, as: 'member', attributes: ['id', 'firstName', 'lastName'] }],
  });

  return toAssignmentSummary(full!);
}

export async function removeAssignment(assignmentId: string): Promise<void> {
  const assignment = await db.MinistryAssignment.findByPk(assignmentId);
  if (!assignment) {
    throw new NotFoundError('Asignación no encontrada');
  }
  await assignment.update({ isActive: false, endDate: new Date() });
}

export async function listAssignments(ministryId: string): Promise<MinistryAssignmentSummary[]> {
  const assignments = await db.MinistryAssignment.findAll({
    where: { ministryId, isActive: true },
    include: [{ model: db.Member, as: 'member', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['createdAt', 'DESC']],
  });

  return assignments.map(toAssignmentSummary);
}
