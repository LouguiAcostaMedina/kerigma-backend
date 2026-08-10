import { z } from 'zod';

export const reportEntitySchema = z.enum([
  'members',
  'groups',
  'students',
  'users',
  'churches',
  'attendance',
  'goals',
  'metrics',
]);

export const reportFilterOperatorSchema = z.enum([
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'startsWith',
  'endsWith',
  'in',
  'between',
  'isNull',
  'notNull',
]);

export const reportFilterSchema = z.object({
  field: z.string().min(1).max(100),
  operator: reportFilterOperatorSchema.default('eq'),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()])), z.null()])
    .optional(),
});

export const createReportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().default(''),
  category: z.string().max(100).optional().default('custom'),
  entity: reportEntitySchema,
  fields: z.array(z.string().min(1).max(100)).default([]),
  filters: z.array(reportFilterSchema).default([]),
  groupBy: z.string().max(100).optional(),
  aggregateFunction: z.enum(['count', 'sum', 'avg', 'min', 'max']).default('count'),
  aggregateField: z.string().max(100).optional(),
  sortBy: z.string().max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().min(1).max(500).optional(),
  isPublic: z.boolean().default(false),
});

export const updateReportSchema = createReportSchema.partial();

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  entity: reportEntitySchema.optional(),
});

export const executeReportSchema = z.record(z.string(), z.unknown()).default({});

export const previewReportSchema = createReportSchema;

export const scheduleReportSchema = z.object({
  reportId: z.string().uuid(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  emailTo: z.string().email().optional(),
});

export const shareReportSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
});

export const bulkDeleteReportsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type ReportEntity = z.infer<typeof reportEntitySchema>;
export type ReportFilter = z.infer<typeof reportFilterSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type ScheduleReportInput = z.infer<typeof scheduleReportSchema>;
export type ShareReportInput = z.infer<typeof shareReportSchema>;
