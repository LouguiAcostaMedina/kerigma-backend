import { Op } from 'sequelize';
import { db } from '../models';
import type { AttendanceRecord } from '../models/AttendanceRecord.model';
import type { CreateAttendanceBulkInput, ListAttendanceQuery } from '../schemas/metric.schema';
import { NotFoundError, ValidationError } from '../utils/errors';
import { invalidateDashboardCache } from './redis.service';

export interface AttendanceBulkResult {
  records: AttendanceRecord[];
  present: number;
  studiedDaily: number;
  total: number;
}

export interface CheckinMemberDto {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
}

export interface CheckinPageData {
  groupId: string;
  groupName: string;
  churchId: string;
  meetingDate: string;
  members: CheckinMemberDto[];
}

function localToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function recordBulkAttendance(
  churchId: string,
  groupId: string,
  actorId: string,
  input: CreateAttendanceBulkInput,
): Promise<AttendanceBulkResult> {
  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  const memberIds = input.entries.map((entry) => entry.memberId);
  const uniqueIds = [...new Set(memberIds)];
  if (uniqueIds.length !== memberIds.length) {
    throw new ValidationError('Un mismo miembro no puede repetirse en el registro de asistencia');
  }

  const members = await db.Member.findAll({
    where: { id: { [Op.in]: uniqueIds }, groupId },
  });
  if (members.length !== uniqueIds.length) {
    throw new ValidationError('Uno o más miembros no pertenecen al grupo indicado');
  }

  const meetingType = input.meetingType ?? 'regular';

  const records: AttendanceRecord[] = [];
  for (const entry of input.entries) {
    const [record] = await db.AttendanceRecord.findOrCreate({
      where: { groupId, memberId: entry.memberId, meetingDate: input.meetingDate, meetingType },
      defaults: {
        churchId,
        groupId,
        memberId: entry.memberId,
        meetingDate: input.meetingDate,
        meetingType,
        isPresent: entry.isPresent ?? false,
        studiedDaily: entry.studiedDaily ?? false,
        notes: entry.notes ?? null,
        recordedBy: actorId,
      },
    });

    await record.update({
      isPresent: entry.isPresent ?? record.isPresent,
      studiedDaily: entry.studiedDaily ?? record.studiedDaily,
      notes: entry.notes !== undefined ? entry.notes : record.notes,
      recordedBy: actorId,
    });

    await record.reload({
      include: [{ model: db.Member, as: 'member', attributes: ['id', 'firstName', 'lastName'] }],
    });
    records.push(record);
  }

  const present = records.filter((record) => record.isPresent).length;
  const studiedDaily = records.filter((record) => record.studiedDaily).length;

  await invalidateDashboardCache(churchId);

  return { records, present, studiedDaily, total: records.length };
}

export async function listAttendanceByGroup(
  churchId: string,
  groupId: string,
  query: ListAttendanceQuery = {},
): Promise<AttendanceRecord[]> {
  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  const where: { groupId: string; churchId: string; meetingDate?: string; meetingType?: string } = {
    groupId,
    churchId,
  };
  if (query.meetingDate) {
    where.meetingDate = query.meetingDate;
  }
  if (query.meetingType) {
    where.meetingType = query.meetingType;
  }

  return db.AttendanceRecord.findAll({
    where,
    include: [{ model: db.Member, as: 'member', attributes: ['id', 'firstName', 'lastName', 'status'] }],
    order: [['meetingDate', 'DESC']],
  });
}

export async function getCheckinPageData(groupId: string): Promise<CheckinPageData> {
  const group = await db.Group.findOne({
    where: { id: groupId },
    attributes: ['id', 'name', 'churchId'],
  });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  const members = await db.Member.findAll({
    where: { groupId, isActive: true },
    attributes: ['id', 'firstName', 'lastName', 'status'],
    order: [['lastName', 'ASC']],
  });

  return {
    groupId: group.id,
    groupName: group.name,
    churchId: group.churchId,
    meetingDate: localToday(),
    members: members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      status: member.status,
    })),
  };
}

export async function checkinPublic(groupId: string, memberId: string): Promise<AttendanceRecord> {
  const group = await db.Group.findOne({
    where: { id: groupId },
    attributes: ['id', 'churchId'],
  });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  const member = await db.Member.findOne({ where: { id: memberId, groupId } });
  if (!member) {
    throw new NotFoundError('El miembro no pertenece al grupo indicado');
  }

  const meetingDate = localToday();

  const [record, created] = await db.AttendanceRecord.findOrCreate({
    where: { groupId, memberId, meetingDate, meetingType: 'regular' },
    defaults: {
      churchId: group.churchId,
      groupId,
      memberId,
      meetingDate,
      meetingType: 'regular',
      isPresent: true,
      studiedDaily: false,
      notes: 'Check-in por código QR',
      recordedBy: null,
    },
  });

  if (!created && record.isPresent) {
    return record;
  }

  if (!record.isPresent) {
    await record.update({ isPresent: true, notes: 'Check-in por código QR' });
  }

  await invalidateDashboardCache(group.churchId);

  return record;
}
