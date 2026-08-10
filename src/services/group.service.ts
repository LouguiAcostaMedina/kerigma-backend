import { Op } from 'sequelize';
import { db, type Group } from '../models';
import type {
  AssignTeachersInput,
  CreateDisciplePairInput,
  CreateGroupInput,
  UpdateGroupInput,
} from '../schemas/group.schema';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { User } from '../models/User.model';
import type { DisciplePair } from '../models/DisciplePair.model';

const USER_ATTRIBUTES = ['id', 'firstName', 'lastName', 'email'];

export interface TeacherSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  churchId: string;
  leaderId: string;
  type: Group['type'];
  category: Group['category'];
  meetingDay: Group['meetingDay'];
  meetingTime: string;
  meetingLocation: string | null;
  maxCapacity: number | null;
  currentSize: number;
  status: Group['status'];
  isActive: boolean;
  mainTeacherId: string | null;
  associateTeacherId: string | null;
  mainTeacher: TeacherSummary | null;
  associateTeacher: TeacherSummary | null;
  membersCount: number;
  disciplePairsCount: number;
  createdAt: Date;
}

function toTeacherSummary(user: User | null | undefined): TeacherSummary | null {
  if (!user) {
    return null;
  }
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email };
}

function toGroupSummary(group: Group): GroupSummary {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    churchId: group.churchId,
    leaderId: group.leaderId,
    type: group.type,
    category: group.category,
    meetingDay: group.meetingDay,
    meetingTime: group.meetingTime,
    meetingLocation: group.meetingLocation,
    maxCapacity: group.maxCapacity,
    currentSize: group.currentSize,
    status: group.status,
    isActive: group.isActive,
    mainTeacherId: group.mainTeacherId,
    associateTeacherId: group.associateTeacherId,
    mainTeacher: toTeacherSummary(group.mainTeacher),
    associateTeacher: toTeacherSummary(group.associateTeacher),
    membersCount: group.members?.length ?? 0,
    disciplePairsCount: group.disciplePairs?.length ?? 0,
    createdAt: group.createdAt,
  };
}

export async function listGroups(churchId: string): Promise<GroupSummary[]> {
  const groups = await db.Group.findAll({
    where: { churchId },
    include: [
      { model: db.User, as: 'leader', attributes: USER_ATTRIBUTES },
      { model: db.User, as: 'mainTeacher', attributes: USER_ATTRIBUTES },
      { model: db.User, as: 'associateTeacher', attributes: USER_ATTRIBUTES },
      { model: db.Member, as: 'members', attributes: ['id'], separate: true },
      { model: db.DisciplePair, as: 'disciplePairs', attributes: ['id'], separate: true },
    ],
    order: [['name', 'ASC']],
  });

  return groups.map((group) => toGroupSummary(group));
}

export async function listAllGroups(): Promise<GroupSummary[]> {
  const groups = await db.Group.findAll({
    include: [
      { model: db.User, as: 'leader', attributes: USER_ATTRIBUTES },
      { model: db.User, as: 'mainTeacher', attributes: USER_ATTRIBUTES },
      { model: db.User, as: 'associateTeacher', attributes: USER_ATTRIBUTES },
      { model: db.Member, as: 'members', attributes: ['id'], separate: true },
      { model: db.DisciplePair, as: 'disciplePairs', attributes: ['id'], separate: true },
    ],
    order: [['name', 'ASC']],
  });

  return groups.map((group) => toGroupSummary(group));
}

export async function getGroup(churchId: string, groupId: string): Promise<GroupSummary> {
  const group = await db.Group.findOne({
    where: { id: groupId, churchId },
    include: [
      { model: db.User, as: 'leader', attributes: USER_ATTRIBUTES },
      { model: db.User, as: 'mainTeacher', attributes: USER_ATTRIBUTES },
      { model: db.User, as: 'associateTeacher', attributes: USER_ATTRIBUTES },
      { model: db.Member, as: 'members', attributes: ['id', 'firstName', 'lastName', 'status', 'isActive'], separate: true },
      {
        model: db.DisciplePair,
        as: 'disciplePairs',
        include: [
          { model: db.Member, as: 'member1', attributes: ['id', 'firstName', 'lastName'] },
          { model: db.Member, as: 'member2', attributes: ['id', 'firstName', 'lastName'] },
        ],
      },
    ],
  });

  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  return toGroupSummary(group);
}

export async function getGroupAnyChurch(groupId: string): Promise<GroupSummary> {
  const group = await db.Group.findOne({
    where: { id: groupId },
    include: [
      { model: db.User, as: 'leader', attributes: USER_ATTRIBUTES },
      { model: db.User, as: 'mainTeacher', attributes: USER_ATTRIBUTES },
      { model: db.User, as: 'associateTeacher', attributes: USER_ATTRIBUTES },
      { model: db.Member, as: 'members', attributes: ['id', 'firstName', 'lastName', 'status', 'isActive'], separate: true },
      {
        model: db.DisciplePair,
        as: 'disciplePairs',
        include: [
          { model: db.Member, as: 'member1', attributes: ['id', 'firstName', 'lastName'] },
          { model: db.Member, as: 'member2', attributes: ['id', 'firstName', 'lastName'] },
        ],
      },
    ],
  });

  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  return toGroupSummary(group);
}

export async function createGroup(churchId: string, actorId: string, input: CreateGroupInput): Promise<GroupSummary> {
  const group = await db.Group.create({
    name: input.name,
    description: input.description ?? null,
    churchId,
    leaderId: actorId,
    type: input.type ?? 'mixed',
    category: input.category ?? 'bible_study',
    meetingDay: input.meetingDay,
    meetingTime: input.meetingTime,
    meetingLocation: input.meetingLocation ?? null,
    maxCapacity: input.maxCapacity ?? null,
    mainTeacherId: input.mainTeacherId ?? null,
    associateTeacherId: input.associateTeacherId ?? null,
    isOpenToNewMembers: input.isOpenToNewMembers ?? true,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return getGroup(churchId, group.id);
}

export async function updateGroup(
  churchId: string,
  groupId: string,
  actorId: string,
  input: UpdateGroupInput,
): Promise<GroupSummary> {
  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  await group.update({
    name: input.name ?? group.name,
    description: input.description !== undefined ? input.description : group.description,
    type: input.type ?? group.type,
    category: input.category ?? group.category,
    meetingDay: input.meetingDay ?? group.meetingDay,
    meetingTime: input.meetingTime ?? group.meetingTime,
    meetingLocation: input.meetingLocation !== undefined ? input.meetingLocation : group.meetingLocation,
    maxCapacity: input.maxCapacity !== undefined ? input.maxCapacity : group.maxCapacity,
    status: input.status ?? group.status,
    isOpenToNewMembers: input.isOpenToNewMembers ?? group.isOpenToNewMembers,
    updatedBy: actorId,
  });

  return getGroup(churchId, groupId);
}

export async function assignTeachers(
  churchId: string,
  groupId: string,
  actorId: string,
  input: AssignTeachersInput,
): Promise<GroupSummary> {
  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  const teacherIds = [input.mainTeacherId, input.associateTeacherId].filter(
    (id): id is string => typeof id === 'string',
  );

  if (teacherIds.length > 0) {
    const teachers = await db.User.findAll({
      where: { id: { [Op.in]: teacherIds }, churchId },
    });
    if (teachers.length !== teacherIds.length) {
      throw new NotFoundError('Uno o más maestros no pertenecen a su iglesia');
    }
  }

  await group.update({
    mainTeacherId: input.mainTeacherId,
    associateTeacherId: input.associateTeacherId,
    updatedBy: actorId,
  });

  return getGroup(churchId, groupId);
}

export async function createDisciplePair(
  churchId: string,
  groupId: string,
  actorId: string,
  input: CreateDisciplePairInput,
): Promise<DisciplePair> {
  if (input.member1Id === input.member2Id) {
    throw new ValidationError('El discipulador y el discípulo deben ser miembros distintos');
  }

  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  const members = await db.Member.findAll({
    where: { id: { [Op.in]: [input.member1Id, input.member2Id] }, groupId },
  });
  if (members.length !== 2) {
    throw new ValidationError('Ambos miembros deben pertenecer al grupo');
  }

  const existing = await db.DisciplePair.findOne({
    where: {
      groupId,
      status: 'active',
      [Op.or]: [
        { member1Id: input.member1Id, member2Id: input.member2Id },
        { member1Id: input.member2Id, member2Id: input.member1Id },
      ],
    },
  });
  if (existing) {
    throw new ValidationError('Ya existe una pareja de discipulado activa entre estos miembros');
  }

  const pair = await db.DisciplePair.create({
    churchId,
    groupId,
    member1Id: input.member1Id,
    member2Id: input.member2Id,
    status: input.status ?? 'active',
    startedAt: input.startedAt ?? new Date().toISOString().slice(0, 10),
    meetingSchedule: input.meetingSchedule ?? null,
    notes: input.notes ?? null,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return pair.reload({
    include: [
      { model: db.Member, as: 'member1', attributes: ['id', 'firstName', 'lastName'] },
      { model: db.Member, as: 'member2', attributes: ['id', 'firstName', 'lastName'] },
    ],
  });
}

export async function listDisciplePairs(churchId: string, groupId: string): Promise<DisciplePair[]> {
  const group = await db.Group.findOne({ where: { id: groupId, churchId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  return db.DisciplePair.findAll({
    where: { groupId, churchId },
    include: [
      { model: db.Member, as: 'member1', attributes: ['id', 'firstName', 'lastName', 'status'] },
      { model: db.Member, as: 'member2', attributes: ['id', 'firstName', 'lastName', 'status'] },
    ],
    order: [['createdAt', 'DESC']],
  });
}

export async function listDisciplePairsAnyChurch(groupId: string): Promise<DisciplePair[]> {
  const group = await db.Group.findOne({ where: { id: groupId } });
  if (!group) {
    throw new NotFoundError('Grupo no encontrado');
  }

  return db.DisciplePair.findAll({
    where: { groupId },
    include: [
      { model: db.Member, as: 'member1', attributes: ['id', 'firstName', 'lastName', 'status'] },
      { model: db.Member, as: 'member2', attributes: ['id', 'firstName', 'lastName', 'status'] },
    ],
    order: [['createdAt', 'DESC']],
  });
}
