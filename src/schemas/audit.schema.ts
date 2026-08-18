import { z } from 'zod';

const auditActions = [
  'create',
  'update',
  'delete',
  'status_change',
  'assign',
  'bulk',
  'import',
  'login',
  'logout',
  'invite',
  'reset_password',
] as const;

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entity: z.string().trim().max(50).optional(),
  action: z.enum(auditActions).optional(),
  actorUserId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().or(z.coerce.date().transform((d) => d.toISOString())).optional(),
  dateTo: z.string().datetime().or(z.coerce.date().transform((d) => d.toISOString())).optional(),
  search: z.string().trim().max(100).optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

export const auditLogIdParamSchema = z.object({
  id: z.string().uuid('El identificador del registro de auditoría no es válido'),
});

export const auditStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});
