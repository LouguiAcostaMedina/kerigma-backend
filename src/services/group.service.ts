import { db, type Group } from '../models';
import type {
  CreateGroupInput,
  UpdateGroupInput,
} from '../schemas/group.schema';
import { NotFoundError } from '../utils/errors';
import type { User } from '../models/User.model';

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

