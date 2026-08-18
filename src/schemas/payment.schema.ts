import { z } from 'zod';

const paymentCurrencyEnum = z.enum(['PEN', 'USD']);
const paymentTypeEnum = z.enum(['tithe', 'offering', 'donation']);
const paymentMethodEnum = z.enum(['card', 'bank_transfer', 'yape', 'plin']);
const paymentStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']);

export const createPaymentSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currency: paymentCurrencyEnum.default('PEN'),
  type: paymentTypeEnum.default('tithe'),
  method: paymentMethodEnum.default('card'),
  description: z.string().optional(),
  memberId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: paymentTypeEnum.optional(),
  status: paymentStatusEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
