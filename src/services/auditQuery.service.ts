import { Op, fn, col, literal } from 'sequelize';
import { db } from '../models';
import { User } from '../models/User.model';
import type { ListAuditLogsQuery } from '../schemas/audit.schema';
import { NotFoundError } from '../utils/errors';

interface AuditLogListItem {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  actorUserId: string;
  actorName: string;
  actorEmail: string;
  changes: Record<string, unknown> | null;
  createdAt: Date;
}

interface AuditStats {
  totalLogs: number;
  recentLogs24h: number;
  byAction: Array<{ action: string; count: number }>;
  byEntity: Array<{ entity: string; count: number }>;
  topActors: Array<{ actorUserId: string; actorName: string; count: number }>;
}

export async function listAuditLogs(
  query: ListAuditLogsQuery,
): Promise<{ logs: AuditLogListItem[]; total: number; page: number }> {
  const { page, limit, entity, action, actorUserId, dateFrom, dateTo, search } = query;

  const where: Record<string, unknown> = {};

  if (entity) {
    where.entity = entity;
  }
  if (action) {
    where.action = action;
  }
  if (actorUserId) {
    where.actorUserId = actorUserId;
  }
  if (dateFrom || dateTo) {
    const createdAtCondition: Record<string, Date> = {};
    if (dateFrom) {
      createdAtCondition[Op.gte as unknown as string] = new Date(dateFrom);
    }
    if (dateTo) {
      createdAtCondition[Op.lte as unknown as string] = new Date(dateTo);
    }
    where.createdAt = createdAtCondition;
  }

  const include = [
    {
      model: User,
      as: 'actor',
      attributes: ['id', 'firstName', 'lastName', 'email'],
      required: false,
    },
  ];

  if (search) {
    (include[0] as Record<string, unknown>).where = {
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ],
    };
    (include[0] as Record<string, unknown>).required = true;
  }

  const { rows, count } = await db.AuditLog.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  const logs: AuditLogListItem[] = rows.map((row) => {
    const plain = row.toJSON() as unknown as Record<string, unknown>;
    const actor = plain.actor as Record<string, unknown> | undefined;
    return {
      id: plain.id as string,
      entity: plain.entity as string,
      entityId: plain.entityId as string,
      action: plain.action as string,
      actorUserId: plain.actorUserId as string,
      actorName: actor
        ? `${(actor.firstName as string) ?? ''} ${(actor.lastName as string) ?? ''}`.trim()
        : 'Sistema',
      actorEmail: (actor?.email as string) ?? '',
      changes: (plain.changes as Record<string, unknown>) ?? null,
      createdAt: plain.createdAt as Date,
    };
  });

  return { logs, total: count, page };
}

export async function getAuditLogById(id: string): Promise<AuditLogListItem> {
  const row = await db.AuditLog.findByPk(id, {
    include: [
      {
        model: User,
        as: 'actor',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  if (!row) {
    throw new NotFoundError('Registro de auditoría no encontrado');
  }

  const plain = row.toJSON() as unknown as Record<string, unknown>;
  const actor = plain.actor as Record<string, unknown> | undefined;

  return {
    id: plain.id as string,
    entity: plain.entity as string,
    entityId: plain.entityId as string,
    action: plain.action as string,
    actorUserId: plain.actorUserId as string,
    actorName: actor
      ? `${(actor.firstName as string) ?? ''} ${(actor.lastName as string) ?? ''}`.trim()
      : 'Sistema',
    actorEmail: (actor?.email as string) ?? '',
    changes: (plain.changes as Record<string, unknown>) ?? null,
    createdAt: plain.createdAt as Date,
  };
}

export async function getAuditStats(days: number): Promise<AuditStats> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const totalLogs = await db.AuditLog.count();

  const recentLogs24h = await db.AuditLog.count({
    where: {
      createdAt: { [Op.gte as unknown as string]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const byActionRaw = await db.AuditLog.findAll({
    attributes: ['action', [fn('COUNT', col('action')), 'count']],
    where: { createdAt: { [Op.gte as unknown as string]: since } },
    group: ['action'],
    order: [[literal('count'), 'DESC']],
    raw: true,
  });

  const byEntityRaw = await db.AuditLog.findAll({
    attributes: ['entity', [fn('COUNT', col('entity')), 'count']],
    where: { createdAt: { [Op.gte as unknown as string]: since } },
    group: ['entity'],
    order: [[literal('count'), 'DESC']],
    raw: true,
  });

  const topActorsRaw = await db.AuditLog.findAll({
    attributes: [
      'actorUserId',
      [fn('COUNT', col('actorUserId')), 'count'],
    ],
    where: { createdAt: { [Op.gte as unknown as string]: since } },
    group: ['actorUserId'],
    order: [[literal('count'), 'DESC']],
    limit: 10,
    raw: true,
  });

  const actorIds = topActorsRaw.map((r) => (r as unknown as Record<string, unknown>).actorUserId as string);
  const actors = actorIds.length
    ? await User.findAll({ where: { id: actorIds }, attributes: ['id', 'firstName', 'lastName'] })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, `${a.firstName} ${a.lastName}`.trim()]));

  return {
    totalLogs,
    recentLogs24h,
    byAction: byActionRaw.map((r) => ({
      action: (r as unknown as Record<string, unknown>).action as string,
      count: Number((r as unknown as Record<string, unknown>).count),
    })),
    byEntity: byEntityRaw.map((r) => ({
      entity: (r as unknown as Record<string, unknown>).entity as string,
      count: Number((r as unknown as Record<string, unknown>).count),
    })),
    topActors: topActorsRaw.map((r) => {
      const plain = r as unknown as Record<string, unknown>;
      const uid = plain.actorUserId as string;
      return {
        actorUserId: uid,
        actorName: actorMap.get(uid) ?? 'Desconocido',
        count: Number(plain.count),
      };
    }),
  };
}
