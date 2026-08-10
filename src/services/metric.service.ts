import { Op } from 'sequelize';
import { db } from '../models';
import type { WeeklyMetric } from '../models/WeeklyMetric.model';
import type { CreateWeeklyMetricInput, ListWeeklyMetricsQuery } from '../schemas/metric.schema';
import { ConflictError, NotFoundError } from '../utils/errors';
import { invalidateDashboardCache } from './redis.service';

async function findGroup(churchId: string, groupId: string) {
  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }
  return group;
}

async function resolveQuarterId(churchId: string, weekStart: string): Promise<string | null> {
  const current = await db.Quarter.findOne({ where: { churchId, isCurrent: true } });
  if (current && weekStart >= current.startDate && weekStart <= current.endDate) {
    return current.id;
  }
  return null;
}

function toNullableNumber(value: number | null | undefined): string | null {
  return value === undefined || value === null ? null : String(value);
}

export async function createWeeklyMetric(
  churchId: string,
  actorId: string,
  input: CreateWeeklyMetricInput,
): Promise<WeeklyMetric> {
  await findGroup(churchId, input.groupId);

  const existing = await db.WeeklyMetric.findOne({
    where: { churchId, groupId: input.groupId, weekStart: input.weekStart },
  });
  if (existing) {
    throw new ConflictError('Ya existe una métrica registrada para esta semana en el grupo');
  }

  const quarterId = await resolveQuarterId(churchId, input.weekStart);

  const metric = await db.WeeklyMetric.create({
    churchId,
    groupId: input.groupId,
    quarterId,
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    membersPresent: input.membersPresent ?? 0,
    dailyBibleStudy: input.dailyBibleStudy ?? 0,
    smallGroupParticipants: input.smallGroupParticipants ?? 0,
    bibleStudiesParticipants: input.bibleStudiesParticipants ?? 0,
    totalMeetings: input.totalMeetings ?? 0,
    averageAttendance: input.averageAttendance ?? 0,
    maxAttendance: input.maxAttendance ?? 0,
    minAttendance: input.minAttendance ?? 0,
    newMembers: input.newMembers ?? 0,
    leftMembers: input.leftMembers ?? 0,
    netGrowth: input.netGrowth ?? 0,
    totalMembersStart: input.totalMembersStart ?? 0,
    totalMembersEnd: input.totalMembersEnd ?? 0,
    newConversions: input.newConversions ?? 0,
    baptisms: input.baptisms ?? 0,
    decisionsForChrist: input.decisionsForChrist ?? 0,
    newStudents: input.newStudents ?? 0,
    graduatedStudents: input.graduatedStudents ?? 0,
    evangelisticEvents: input.evangelisticEvents ?? 0,
    communityServices: input.communityServices ?? 0,
    specialMeetings: input.specialMeetings ?? 0,
    offerings: toNullableNumber(input.offerings),
    tithes: toNullableNumber(input.tithes),
    specialOfferings: toNullableNumber(input.specialOfferings),
    notes: input.notes ?? null,
    challenges: input.challenges ?? null,
    achievements: input.achievements ?? null,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await invalidateDashboardCache(churchId);

  return metric.reload({ include: [{ model: db.Group, as: 'group', attributes: ['id', 'name'] }] });
}

export async function listWeeklyMetricsByGroup(
  churchId: string,
  groupId: string,
  query: ListWeeklyMetricsQuery = {},
): Promise<WeeklyMetric[]> {
  await findGroup(churchId, groupId);

  const where: { groupId: string; churchId: string; quarterId?: string } = { groupId, churchId };
  if (query.quarterId) {
    where.quarterId = query.quarterId;
  }

  return db.WeeklyMetric.findAll({
    where,
    include: [{ model: db.Group, as: 'group', attributes: ['id', 'name'] }],
    order: [['weekStart', 'DESC']],
  });
}

export async function listWeeklyMetricsByChurch(
  churchId: string,
  options: { from?: string; to?: string; groupId?: string } = {},
): Promise<WeeklyMetric[]> {
  const where: { churchId: string; weekStart?: { [Op.gte]: string }; weekEnd?: { [Op.lte]: string }; groupId?: string } = {
    churchId,
  };
  if (options.groupId) {
    where.groupId = options.groupId;
  }
  if (options.from) {
    where.weekStart = { [Op.gte]: options.from };
  }
  if (options.to) {
    where.weekEnd = { [Op.lte]: options.to };
  }

  return db.WeeklyMetric.findAll({
    where,
    include: [{ model: db.Group, as: 'group', attributes: ['id', 'name'] }],
    order: [['weekStart', 'DESC']],
  });
}
