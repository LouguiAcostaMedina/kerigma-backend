import { z } from 'zod';

const contributionCategories = ['diezmo', 'ofrenda_misionera', 'escuela_sabatica', 'proyectos_especiales', 'otros'] as const;
const paymentMethods = ['efectivo', 'transferencia', 'deposito', 'tarjeta', 'otro'] as const;

export const createContributionSchema = z.object({
  memberId: z.string().uuid('El miembro no es válido'),
  category: z.enum(contributionCategories, { errorMap: () => ({ message: 'La categoría no es válida' }) }),
  amount: z.number().positive('El monto debe ser positivo').max(999999999.99, 'El monto es demasiado grande'),
  currency: z.string().length(3).default('PEN'),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'El formato del período debe ser YYYY-MM'),
  paymentMethod: z.enum(paymentMethods).default('efectivo'),
  receiptNumber: z.string().max(50).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;

export const listContributionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  memberId: z.string().uuid().optional(),
  category: z.enum(contributionCategories).optional(),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['amount', 'category', 'period', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type ListContributionsQuery = z.infer<typeof listContributionsQuerySchema>;

export const contributionIdParamSchema = z.object({
  id: z.string().uuid('El identificador de la contribución no es válido'),
});

export const summaryQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  category: z.enum(contributionCategories).optional(),
});
