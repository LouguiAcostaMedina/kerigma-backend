import { Op } from 'sequelize';
import { db } from '../models';
import type { Payment } from '../models/Payment.model';
import type {
  CreatePaymentInput,
  ListPaymentsQuery,
} from '../schemas/payment.schema';
import { NotFoundError } from '../utils/errors';

interface PaymentSummary {
  id: string;
  churchId: string;
  memberId: string | null;
  memberName: string | null;
  amount: number;
  currency: Payment['currency'];
  type: Payment['type'];
  method: Payment['method'];
  status: Payment['status'];
  providerRef: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

interface PaymentStats {
  totalCollected: number;
  totalCount: number;
  byType: Array<{ type: string; total: number; count: number }>;
  byMonth: Array<{ month: string; total: number; count: number }>;
}

function toPaymentSummary(payment: Payment): PaymentSummary {
  const member = (payment as unknown as Record<string, unknown>).member as Record<string, unknown> | undefined;
  return {
    id: payment.id,
    churchId: payment.churchId,
    memberId: payment.memberId,
    memberName: member
      ? `${(member.firstName as string) ?? ''} ${(member.lastName as string) ?? ''}`.trim()
      : null,
    amount: Number(payment.amount),
    currency: payment.currency,
    type: payment.type,
    method: payment.method,
    status: payment.status,
    providerRef: payment.providerRef,
    description: payment.description,
    metadata: payment.metadata,
    createdAt: payment.createdAt,
  };
}

function processWithCulqi(amount: number, currency: string, token: string): { success: boolean; chargeId: string } {
  void amount;
  void currency;
  void token;
  return {
    success: true,
    chargeId: `ch_simulated_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createPayment(
  churchId: string,
  userId: string,
  input: CreatePaymentInput,
): Promise<PaymentSummary> {
  void userId;

  const payment = await db.Payment.create({
    churchId,
    memberId: input.memberId ?? null,
    amount: input.amount,
    currency: input.currency,
    type: input.type,
    method: input.method,
    description: input.description ?? null,
    metadata: input.metadata ?? null,
    status: 'pending',
  });

  return getPaymentById(payment.id, churchId);
}

export async function processPayment(paymentId: string, churchId: string | null): Promise<PaymentSummary> {
  const payment = await db.Payment.findByPk(paymentId);
  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }
  if (churchId && payment.churchId !== churchId) {
    throw new NotFoundError('Pago no encontrado');
  }
  if (payment.status !== 'pending') {
    throw new NotFoundError('El pago no está en estado pendiente');
  }

  await payment.update({ status: 'processing' });

  await delay(1500);

  const result = processWithCulqi(payment.amount, payment.currency, 'simulated_token');

  if (result.success) {
    await payment.update({ status: 'completed', providerRef: result.chargeId });
  } else {
    await payment.update({ status: 'failed' });
  }

  return getPaymentById(paymentId, churchId);
}

export async function getPaymentById(paymentId: string, churchId: string | null): Promise<PaymentSummary> {
  const payment = await db.Payment.findByPk(paymentId, {
    include: [
      { model: db.Member, as: 'member', attributes: ['id', 'firstName', 'lastName'] },
    ],
  });

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  if (churchId && payment.churchId !== churchId) {
    throw new NotFoundError('Pago no encontrado');
  }

  return toPaymentSummary(payment);
}

export async function listPayments(
  churchId: string | null,
  query: ListPaymentsQuery,
): Promise<{ payments: PaymentSummary[]; total: number }> {
  const { page, limit, type, status, dateFrom, dateTo, sortBy, sortOrder } = query;

  const where: Record<string, unknown> = {};
  if (churchId) {
    where.churchId = churchId;
  }
  if (type) {
    where.type = type;
  }
  if (status) {
    where.status = status;
  }
  if (dateFrom || dateTo) {
    const dateCondition: Record<string, Date> = {};
    if (dateFrom) dateCondition[Op.gte as unknown as string] = dateFrom;
    if (dateTo) dateCondition[Op.lte as unknown as string] = dateTo;
    where.createdAt = dateCondition;
  }

  const { rows, count } = await db.Payment.findAndCountAll({
    where,
    include: [
      { model: db.Member, as: 'member', attributes: ['id', 'firstName', 'lastName'] },
    ],
    order: [[sortBy as string, sortOrder]],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  return {
    payments: rows.map(toPaymentSummary),
    total: count,
  };
}

export async function refundPayment(paymentId: string): Promise<PaymentSummary> {
  const payment = await db.Payment.findByPk(paymentId);
  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }
  if (payment.status !== 'completed') {
    throw new NotFoundError('Solo se pueden reembolsar pagos completados');
  }

  await payment.update({ status: 'refunded' });

  return getPaymentById(paymentId, null);
}

export async function getPaymentStats(churchId: string): Promise<PaymentStats> {
  const where: Record<string, unknown> = { churchId, status: 'completed' };

  const allPayments = await db.Payment.findAll({
    where,
    attributes: ['amount', 'type', 'createdAt'],
    raw: true,
  });

  let totalCollected = 0;
  let totalCount = 0;
  const typeMap = new Map<string, { total: number; count: number }>();
  const monthMap = new Map<string, { total: number; count: number }>();

  for (const p of allPayments) {
    const plain = p as unknown as Record<string, unknown>;
    const amount = Number(plain.amount);
    const type = plain.type as string;
    const date = new Date(plain.createdAt as string | number | Date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    totalCollected += amount;
    totalCount += 1;

    const existingType = typeMap.get(type);
    if (existingType) {
      existingType.total += amount;
      existingType.count += 1;
    } else {
      typeMap.set(type, { total: amount, count: 1 });
    }

    const existingMonth = monthMap.get(month);
    if (existingMonth) {
      existingMonth.total += amount;
      existingMonth.count += 1;
    } else {
      monthMap.set(month, { total: amount, count: 1 });
    }
  }

  const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    total: data.total,
    count: data.count,
  }));

  const byMonth = Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      total: data.total,
      count: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalCollected,
    totalCount,
    byType,
    byMonth,
  };
}
