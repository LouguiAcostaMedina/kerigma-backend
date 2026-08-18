import { Op, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { Activity } from '../models/Activity.model';
import type {
  CreateActivityInput,
  ListActivitiesQuery,
  UpdateActivityInput,
} from '../schemas/activity.schema';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export interface ActivitySummary {
  id: string;
  churchId: string;
  groupId: string | null;
  groupName: string | null;
  title: string;
  description: string | null;
  eventType: Activity['eventType'];
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  recurrence: Activity['recurrence'];
  isActive: boolean;
  createdBy: string;
  creatorName: string | null;
  createdAt: Date;
}

export interface ActivitiesPaginatedResult {
  activities: ActivitySummary[];
  total: number;
}

function toActivitySummary(activity: Activity): ActivitySummary {
  const group = activity.group as { id: string; name: string } | undefined;
  const creator = activity.creator as { firstName: string; lastName: string } | undefined;
  return {
    id: activity.id,
    churchId: activity.churchId,
    groupId: activity.groupId,
    groupName: group?.name ?? null,
    title: activity.title,
    description: activity.description,
    eventType: activity.eventType,
    startDate: activity.startDate,
    endDate: activity.endDate,
    location: activity.location,
    recurrence: activity.recurrence,
    isActive: activity.isActive,
    createdBy: activity.createdBy,
    creatorName: creator ? `${creator.firstName} ${creator.lastName}` : null,
    createdAt: activity.createdAt,
  };
}

function buildIncludes() {
  return [
    {
      model: db.Group,
      as: 'group',
      attributes: ['id', 'name'],
    },
    {
      model: db.User,
      as: 'creator',
      attributes: ['id', 'firstName', 'lastName'],
    },
  ];
}

export async function listActivities(
  churchId: string | null,
  query: ListActivitiesQuery,
): Promise<ActivitiesPaginatedResult> {
  const { page, limit, eventType, startDate, endDate, groupId, search } = query;

  const where: WhereOptions = {};
  if (churchId) {
    (where as Record<string, unknown>).churchId = churchId;
  }
  if (eventType) {
    (where as Record<string, unknown>).eventType = eventType;
  }
  if (groupId) {
    (where as Record<string, unknown>).groupId = groupId;
  }
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter[Op.gte as unknown as string] = startDate;
    if (endDate) dateFilter[Op.lte as unknown as string] = endDate;
    (where as Record<string, unknown>).startDate = dateFilter;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { title: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
      { location: { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await db.Activity.findAndCountAll({
    where,
    include: buildIncludes(),
    order: [['startDate', 'ASC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  return {
    activities: rows.map(toActivitySummary),
    total: count,
  };
}

export async function getActivity(
  churchId: string | null,
  activityId: string,
): Promise<ActivitySummary> {
  const activity = await db.Activity.findByPk(activityId, {
    include: buildIncludes(),
  });

  if (!activity) {
    throw new NotFoundError('Actividad no encontrada');
  }

  if (churchId && activity.churchId !== churchId) {
    throw new NotFoundError('Actividad no encontrada');
  }

  return toActivitySummary(activity);
}

export async function createActivity(
  churchId: string,
  userId: string,
  input: CreateActivityInput,
): Promise<ActivitySummary> {
  const activity = await db.Activity.create({
    churchId,
    groupId: input.groupId ?? null,
    title: input.title,
    description: input.description ?? null,
    eventType: input.eventType,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    location: input.location ?? null,
    recurrence: input.recurrence,
    isActive: true,
    createdBy: userId,
  });

  return getActivity(churchId, activity.id);
}

export async function updateActivity(
  churchId: string | null,
  activityId: string,
  userId: string,
  input: UpdateActivityInput,
): Promise<ActivitySummary> {
  const existing = await db.Activity.findByPk(activityId);
  if (!existing) {
    throw new NotFoundError('Actividad no encontrada');
  }
  if (churchId && existing.churchId !== churchId) {
    throw new NotFoundError('Actividad no encontrada');
  }
  if (existing.createdBy !== userId && churchId !== null) {
    throw new ForbiddenError('Solo el creador puede modificar esta actividad');
  }

  await existing.update({
    title: input.title ?? existing.title,
    description: input.description !== undefined ? input.description : existing.description,
    eventType: input.eventType ?? existing.eventType,
    startDate: input.startDate ?? existing.startDate,
    endDate: input.endDate !== undefined ? input.endDate : existing.endDate,
    location: input.location !== undefined ? input.location : existing.location,
    recurrence: input.recurrence ?? existing.recurrence,
    groupId: input.groupId !== undefined ? input.groupId : existing.groupId,
    isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
  });

  return getActivity(churchId, activityId);
}

export async function deleteActivity(
  churchId: string | null,
  activityId: string,
  userId: string,
): Promise<void> {
  const activity = await db.Activity.findByPk(activityId);
  if (!activity) {
    throw new NotFoundError('Actividad no encontrada');
  }
  if (churchId && activity.churchId !== churchId) {
    throw new NotFoundError('Actividad no encontrada');
  }
  if (activity.createdBy !== userId && churchId !== null) {
    throw new ForbiddenError('Solo el creador puede eliminar esta actividad');
  }

  await activity.destroy();
}
