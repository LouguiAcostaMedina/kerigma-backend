import { Op } from 'sequelize';
import { db } from '../models';
import type { FinancialContribution } from '../models/FinancialContribution.model';
import type { CreateContributionInput, ListContributionsQuery } from '../schemas/financial.schema';
import { NotFoundError } from '../utils/errors';

interface ContributionSummary {
  category: string;
  total: number;
  count: number;
  averageAmount: number;
}

interface PeriodSummary {
  period: string;
  total: number;
  count: number;
}

interface ContributionListItem {
  id: string;
  churchId: string;
  memberId: string;
  memberName: string;
  category: string;
  amount: number;
  currency: string;
  period: string;
  paymentMethod: string;
  receiptNumber: string | null;
  notes: string | null;
  recordedBy: string;
  recordedByName: string;
  createdAt: Date;
}

function toContributionListItem(row: FinancialContribution): ContributionListItem {
  const plain = row.toJSON() as unknown as Record<string, unknown>;
  const member = plain.member as Record<string, unknown> | undefined;
  const actor = plain.recordedByUser as Record<string, unknown> | undefined;

  return {
    id: plain.id as string,
    churchId: plain.churchId as string,
    memberId: plain.memberId as string,
    memberName: member
      ? `${(member.firstName as string) ?? ''} ${(member.lastName as string) ?? ''}`.trim()
      : 'Desconocido',
    category: plain.category as string,
    amount: Number(plain.amount),
    currency: plain.currency as string,
    period: plain.period as string,
    paymentMethod: plain.paymentMethod as string,
    receiptNumber: (plain.receiptNumber as string) ?? null,
    notes: (plain.notes as string) ?? null,
    recordedBy: plain.recordedBy as string,
    recordedByName: actor
      ? `${(actor.firstName as string) ?? ''} ${(actor.lastName as string) ?? ''}`.trim()
      : 'Sistema',
    createdAt: plain.createdAt as Date,
  };
}

const MEMBER_ATTRIBUTES = ['id', 'firstName', 'lastName'];
const USER_ATTRIBUTES = ['id', 'firstName', 'lastName'];

export async function createContribution(
  churchId: string,
  actorId: string,
  input: CreateContributionInput,
): Promise<ContributionListItem> {
  const member = await db.Member.findByPk(input.memberId);
  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }

  const contribution = await db.FinancialContribution.create({
    churchId,
    memberId: input.memberId,
    category: input.category,
    amount: input.amount,
    currency: input.currency ?? 'PEN',
    period: input.period,
    paymentMethod: input.paymentMethod ?? 'efectivo',
    receiptNumber: input.receiptNumber ?? null,
    notes: input.notes ?? null,
    recordedBy: actorId,
  });

  const full = await db.FinancialContribution.findByPk(contribution.id, {
    include: [
      { model: db.Member, as: 'member', attributes: MEMBER_ATTRIBUTES },
      { model: db.User, as: 'recordedByUser', attributes: USER_ATTRIBUTES },
    ],
  });

  return toContributionListItem(full!);
}

export async function listContributions(
  churchId: string,
  query: ListContributionsQuery,
): Promise<{ contributions: ContributionListItem[]; total: number; page: number }> {
  const { page, limit, memberId, category, period, dateFrom, dateTo, sortBy, sortOrder } = query;

  const where: Record<string, unknown> = { churchId };
  if (memberId) where.memberId = memberId;
  if (category) where.category = category;
  if (period) where.period = period;
  if (dateFrom || dateTo) {
    const dateCondition: Record<string, Date> = {};
    if (dateFrom) dateCondition[Op.gte as unknown as string] = new Date(dateFrom);
    if (dateTo) dateCondition[Op.lte as unknown as string] = new Date(dateTo);
    where.createdAt = dateCondition;
  }

  const { rows, count } = await db.FinancialContribution.findAndCountAll({
    where,
    include: [
      { model: db.Member, as: 'member', attributes: MEMBER_ATTRIBUTES },
      { model: db.User, as: 'recordedByUser', attributes: USER_ATTRIBUTES },
    ],
    order: [[sortBy as string, sortOrder]],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  return {
    contributions: rows.map(toContributionListItem),
    total: count,
    page,
  };
}

export async function getContributionById(churchId: string, id: string): Promise<ContributionListItem> {
  const row = await db.FinancialContribution.findByPk(id, {
    include: [
      { model: db.Member, as: 'member', attributes: MEMBER_ATTRIBUTES },
      { model: db.User, as: 'recordedByUser', attributes: USER_ATTRIBUTES },
    ],
  });

  if (!row) {
    throw new NotFoundError('Contribución no encontrada');
  }

  if (row.churchId !== churchId) {
    throw new NotFoundError('Contribución no encontrada');
  }

  return toContributionListItem(row);
}

export async function deleteContribution(churchId: string, id: string): Promise<void> {
  const row = await db.FinancialContribution.findByPk(id);
  if (!row) {
    throw new NotFoundError('Contribución no encontrada');
  }
  if (row.churchId !== churchId) {
    throw new NotFoundError('Contribución no encontrada');
  }
  await row.destroy();
}

export async function getSummaryByCategory(
  churchId: string,
  query: { period?: string; dateFrom?: string; dateTo?: string },
): Promise<ContributionSummary[]> {
  const where: Record<string, unknown> = { churchId };
  if (query.period) where.period = query.period;
  if (query.dateFrom || query.dateTo) {
    const dateCondition: Record<string, Date> = {};
    if (query.dateFrom) dateCondition[Op.gte as unknown as string] = new Date(query.dateFrom);
    if (query.dateTo) dateCondition[Op.lte as unknown as string] = new Date(query.dateTo);
    where.createdAt = dateCondition;
  }

  const results = await db.FinancialContribution.findAll({
    attributes: [
      'category',
      [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total'],
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      [db.sequelize.fn('AVG', db.sequelize.col('amount')), 'averageAmount'],
    ],
    where,
    group: ['category'],
    order: [[db.sequelize.fn('SUM', db.sequelize.col('amount')), 'DESC']],
    raw: true,
  });

  return results.map((r) => {
    const plain = r as unknown as Record<string, unknown>;
    return {
      category: plain.category as string,
      total: Number(plain.total),
      count: Number(plain.count),
      averageAmount: Number(plain.averageAmount),
    };
  });
}

export async function getSummaryByPeriod(
  churchId: string,
  query: { dateFrom?: string; dateTo?: string },
): Promise<PeriodSummary[]> {
  const where: Record<string, unknown> = { churchId };
  if (query.dateFrom || query.dateTo) {
    const dateCondition: Record<string, Date> = {};
    if (query.dateFrom) dateCondition[Op.gte as unknown as string] = new Date(query.dateFrom);
    if (query.dateTo) dateCondition[Op.lte as unknown as string] = new Date(query.dateTo);
    where.createdAt = dateCondition;
  }

  const results = await db.FinancialContribution.findAll({
    attributes: [
      'period',
      [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total'],
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
    ],
    where,
    group: ['period'],
    order: [[db.sequelize.col('period'), 'DESC']],
    raw: true,
  });

  return results.map((r) => {
    const plain = r as unknown as Record<string, unknown>;
    return {
      period: plain.period as string,
      total: Number(plain.total),
      count: Number(plain.count),
    };
  });
}

export async function getMemberHistory(
  churchId: string,
  memberId: string,
): Promise<ContributionListItem[]> {
  const member = await db.Member.findByPk(memberId);
  if (!member) {
    throw new NotFoundError('Miembro no encontrado');
  }

  const rows = await db.FinancialContribution.findAll({
    where: { churchId, memberId },
    include: [
      { model: db.Member, as: 'member', attributes: MEMBER_ATTRIBUTES },
      { model: db.User, as: 'recordedByUser', attributes: USER_ATTRIBUTES },
    ],
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  return rows.map(toContributionListItem);
}
