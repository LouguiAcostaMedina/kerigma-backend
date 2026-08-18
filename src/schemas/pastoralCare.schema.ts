import { z } from 'zod';

const prayerRequestPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);
const prayerRequestStatusEnum = z.enum(['pending', 'in_progress', 'answered', 'closed']);

export const createPrayerRequestSchema = z.object({
  requesterName: z.string().min(1).max(200),
  requesterPhone: z.string().optional(),
  requesterEmail: z.string().email().optional(),
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: prayerRequestPriorityEnum.default('normal'),
  memberId: z.string().uuid().optional(),
  isAnonymous: z.boolean().default(false),
  isPublic: z.boolean().default(false),
});

export const updatePrayerRequestSchema = z.object({
  requesterName: z.string().min(1).max(200).optional(),
  requesterPhone: z.string().optional().nullable(),
  requesterEmail: z.string().email().optional().nullable(),
  subject: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  priority: prayerRequestPriorityEnum.optional(),
  memberId: z.string().uuid().optional().nullable(),
  isAnonymous: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export const updatePrayerRequestStatusSchema = z.object({
  status: prayerRequestStatusEnum,
  resolutionNotes: z.string().optional(),
});

export const listPrayerRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: prayerRequestStatusEnum.optional(),
  priority: prayerRequestPriorityEnum.optional(),
  search: z.string().optional(),
});

export const createPastoralVisitSchema = z.object({
  visitorName: z.string().min(1).max(200),
  visitDate: z.coerce.date(),
  visitType: z.string().default('pastoral'),
  reason: z.string().min(1),
  notes: z.string().optional(),
  memberId: z.string().uuid().optional(),
  prayerRequestId: z.string().uuid().optional(),
  followUpNeeded: z.boolean().default(false),
  followUpDate: z.coerce.date().optional(),
});

export const updatePastoralVisitSchema = z.object({
  visitorName: z.string().min(1).max(200).optional(),
  visitDate: z.coerce.date().optional(),
  visitType: z.string().optional(),
  reason: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  memberId: z.string().uuid().optional().nullable(),
  prayerRequestId: z.string().uuid().optional().nullable(),
  followUpNeeded: z.boolean().optional(),
  followUpDate: z.coerce.date().optional().nullable(),
});

export const listPastoralVisitsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  visitType: z.string().optional(),
  followUpNeeded: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreatePrayerRequestInput = z.infer<typeof createPrayerRequestSchema>;
export type UpdatePrayerRequestInput = z.infer<typeof updatePrayerRequestSchema>;
export type UpdatePrayerRequestStatusInput = z.infer<typeof updatePrayerRequestStatusSchema>;
export type ListPrayerRequestsQuery = z.infer<typeof listPrayerRequestsQuerySchema>;
export type CreatePastoralVisitInput = z.infer<typeof createPastoralVisitSchema>;
export type UpdatePastoralVisitInput = z.infer<typeof updatePastoralVisitSchema>;
export type ListPastoralVisitsQuery = z.infer<typeof listPastoralVisitsQuerySchema>;
